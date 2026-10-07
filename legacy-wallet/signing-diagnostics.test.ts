import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AccountRole, address, blockhash, appendTransactionMessageInstructions, compileTransaction, compressTransactionMessageUsingAddressLookupTables, createKeyPairSignerFromPrivateKeyBytes, createTransactionMessage, getAddressDecoder, getTransactionDecoder, getTransactionEncoder, partiallySignTransaction, pipe, setTransactionMessageFeePayer, setTransactionMessageLifetimeUsingBlockhash, type Instruction, type Transaction} from '@solana/kit';
import {signingDiagnostics} from './signing-diagnostics.ts';

const key = (value: number) => getAddressDecoder().decode(new Uint8Array(32).fill(value));
const payer = await createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(32).fill(11));
const receiver = key(12), program = key(13), recentBlockhash = blockhash(key(14));
const computeProgram = address('ComputeBudget111111111111111111111111111111');
const secretPayload = Buffer.from('private-proof-payload-never-log');
const action = (): Instruction => ({programAddress: program, accounts: [
  {address: payer.address, role: AccountRole.WRITABLE_SIGNER}, {address: receiver, role: AccountRole.READONLY},
], data: new Uint8Array(secretPayload)});
function compute(opcode: 2 | 3, value: bigint): Instruction {
  const data = new Uint8Array(opcode === 3 ? 9 : 5), view = new DataView(data.buffer); data[0] = opcode;
  if (opcode === 3) view.setBigUint64(1, value, true); else view.setUint32(1, Number(value), true);
  return {programAddress: computeProgram, data};
}
const limit = () => compute(2, 1_000_000n);
function message(instructions: Instruction[]) {
  return pipe(createTransactionMessage({version: 0}), m => setTransactionMessageFeePayer(payer.address, m),
    m => setTransactionMessageLifetimeUsingBlockhash({blockhash: recentBlockhash, lastValidBlockHeight: 1000n}, m),
    m => appendTransactionMessageInstructions(instructions, m));
}
function transaction(instructions: Instruction[] = [limit(), action()]): Transaction { return compileTransaction(message(instructions)); }
const wire = (tx: Transaction) => getTransactionEncoder().encode(tx);
const clone = (tx: Transaction) => getTransactionDecoder().decode(wire(tx));
const hex = (tx: Transaction) => Buffer.from(wire(tx)).toString('hex');

test('an untouched message remains equal despite a signature, without exposing private bytes or mutating either input', async () => {
  const original = transaction(), returned = await partiallySignTransaction([payer.keyPair], clone(original));
  const before = [hex(original), hex(returned)];
  const result = signingDiagnostics(original, returned);
  assert.deepEqual(result.version, {original: 0, returned: 0});
  for (const key of ['message_equal', 'header_equal', 'blockhash_equal', 'accounts_equal', 'ALT_equal',
    'original_non_compute_instructions_retained', 'non_compute_instructions_equal'] as const) assert.equal(result[key], true, key);
  assert.deepEqual(result.original_instructions, [
    {programId: computeProgram, dataLength: 5, computeBudget: {kind: 'SetComputeUnitLimit', value: '1000000'}},
    {programId: program, dataLength: secretPayload.length},
  ]);
  const publicJson = JSON.stringify(result);
  for (const forbidden of [payer.address, receiver, recentBlockhash,
    secretPayload.toString(), secretPayload.toString('hex'), secretPayload.toString('base64'),
    Buffer.from(returned.signatures[payer.address]!).toString('hex'), ...before]) assert.equal(publicJson.includes(forbidden), false);
  assert.deepEqual([hex(original), hex(returned)], before);
});

test('blockhash mutation is distinguished from instruction or account changes', () => {
  const original = transaction(), returned = compileTransaction(setTransactionMessageLifetimeUsingBlockhash({blockhash: blockhash(key(22)), lastValidBlockHeight: 1000n}, message([limit(), action()])));
  const result = signingDiagnostics(original, returned);
  assert.equal(result.message_equal, false); assert.equal(result.blockhash_equal, false);
  assert.equal(result.accounts_equal, true); assert.equal(result.header_equal, true);
  assert.equal(result.non_compute_instructions_equal, true);
});

test('added or changed compute-unit price is reported exactly without authorizing message mutation', () => {
  const original = transaction(), price = 9_007_199_254_740_993n;
  const returned = transaction([limit(), compute(3, price), action()]);
  const result = signingDiagnostics(original, returned);
  assert.equal(result.message_equal, false); assert.equal(result.blockhash_equal, true);
  assert.equal(result.original_non_compute_instructions_retained, true); assert.equal(result.non_compute_instructions_equal, true);
  assert.deepEqual(result.returned_instructions[1].computeBudget, {kind: 'SetComputeUnitPrice', value: price.toString()});
  const changed = transaction([limit(), compute(3, price + 1n), action()]);
  assert.equal(signingDiagnostics(returned, changed).message_equal, false);
  assert.notEqual(signingDiagnostics(returned, changed).returned_instructions[1].computeBudget!.value, price.toString());
});

test('an added assertion-like program keeps originals but is distinct from an unchanged instruction list', () => {
  const original = transaction(), assertionProgram = key(44);
  const returned = transaction([limit(), action(),
    {programAddress: assertionProgram, accounts: [{address: receiver, role: AccountRole.READONLY}], data: Buffer.from('unknown-assertion-private-payload')}]);
  const result = signingDiagnostics(original, returned);
  assert.equal(result.message_equal, false); assert.equal(result.accounts_equal, false);
  assert.equal(result.original_non_compute_instructions_retained, true); assert.equal(result.non_compute_instructions_equal, false);
  assert.deepEqual(result.returned_instructions[2], {programId: assertionProgram, dataLength: 33});
  assert.equal(JSON.stringify(result).includes('unknown-assertion-private-payload'), false);
});

test('changed non-compute data, account or writable flags never count as retained', () => {
  const original = transaction(), ix = action(), changedData = new Uint8Array(ix.data!); changedData[0] ^= 1;
  const modifications: Instruction[] = [
    {...ix, data: changedData},
    {...ix, accounts: [ix.accounts![0], {...ix.accounts![1], address: key(33)}]},
    {...ix, accounts: [ix.accounts![0], {...ix.accounts![1], role: AccountRole.WRITABLE}]},
  ];
  for (const changed of modifications) {
    const result = signingDiagnostics(original, transaction([limit(), changed]));
    assert.equal(result.original_non_compute_instructions_retained, false);
    assert.equal(result.non_compute_instructions_equal, false);
  }
});

test('non-compute comparison preserves order, multiplicity and signer flags', () => {
  const other: Instruction = {...action(), data: Buffer.from('second-private-payload')};
  const original = transaction([action(), other]);
  assert.equal(signingDiagnostics(original, transaction([other, action()])).original_non_compute_instructions_retained, false);
  assert.equal(signingDiagnostics(transaction([action(), action()]), transaction([action()])).original_non_compute_instructions_retained, false);
  const ix = action(), changed: Instruction = {...ix, accounts: [ix.accounts![0], {...ix.accounts![1], role: AccountRole.READONLY_SIGNER}]};
  const result = signingDiagnostics(transaction([action()]), transaction([changed]));
  assert.equal(result.header_equal, false); assert.equal(result.original_non_compute_instructions_retained, false);
});

test('malformed or non-compute payloads never masquerade as decoded compute settings', () => {
  const cases: Instruction[] = [
    {programAddress: computeProgram, data: Buffer.from([3, 1])},
    {programAddress: computeProgram, data: Buffer.alloc(9, 99)},
    {programAddress: program, data: compute(3, 1n).data},
    {programAddress: computeProgram, accounts: [{address: receiver, role: AccountRole.READONLY}], data: compute(3, 1n).data},
  ];
  for (const ix of cases) assert.equal(signingDiagnostics(transaction(), transaction([ix])).returned_instructions[0].computeBudget, undefined);
});

test('unresolved ALT changes cannot establish byte-equivalent non-compute instructions', () => {
  const original = transaction(), lookupKey = key(55);
  const returned = compileTransaction(compressTransactionMessageUsingAddressLookupTables(message([action()]), {[lookupKey]: [receiver]}));
  const result = signingDiagnostics(original, returned);
  assert.equal(result.ALT_equal, false); assert.equal(result.original_non_compute_instructions_retained, null);
  assert.equal(result.non_compute_instructions_equal, null);
  assert.equal(JSON.stringify(result).includes(lookupKey), false);
  assert.equal(signingDiagnostics(returned, clone(returned)).ALT_equal, true);
});

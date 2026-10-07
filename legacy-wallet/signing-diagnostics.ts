/** Read-only, public structural observations. Never a signature verifier or an
 * authorization to accept a wallet-modified transaction. */
import {address, decompileTransactionMessage, getCompiledTransactionMessageDecoder, type Instruction, type ReadonlyUint8Array, type Transaction} from '@solana/kit';

export interface InstructionDiagnostic {
  /** Null means the program is behind an unresolved address lookup. */
  programId: string | null;
  dataLength: number;
  computeBudget?: {
    kind: 'RequestHeapFrame' | 'SetComputeUnitLimit' | 'SetComputeUnitPrice' | 'SetLoadedAccountsDataSizeLimit';
    value: string;
  };
}
export interface SigningDiagnostic {
  version: {original: 'legacy' | 0; returned: 'legacy' | 0};
  message_equal: boolean;
  header_equal: boolean;
  blockhash_equal: boolean;
  accounts_equal: boolean;
  ALT_equal: boolean;
  original_instructions: InstructionDiagnostic[];
  returned_instructions: InstructionDiagnostic[];
  /** Null means account lookup resolution/decompilation was unavailable. */
  original_non_compute_instructions_retained: boolean | null;
  non_compute_instructions_equal: boolean | null;
}
const equalBytes = (a: ReadonlyUint8Array, b: ReadonlyUint8Array) => a.length === b.length && a.every((byte, index) => byte === b[index]);
const equalNumbers = (a: readonly number[], b: readonly number[]) => a.length === b.length && a.every((value, index) => value === b[index]);
const computeProgram = address('ComputeBudget111111111111111111111111111111');
function message(transaction: Transaction) {
  const decoded = getCompiledTransactionMessageDecoder().decode(transaction.messageBytes);
  if (decoded.version !== 0 && decoded.version !== 'legacy') throw Error('unsupported diagnostic transaction version');
  return decoded;
}
function instructions(transaction: Transaction): InstructionDiagnostic[] {
  const compiled = message(transaction);
  return compiled.instructions.map(instruction => {
    const programId = compiled.staticAccounts[instruction.programAddressIndex] ?? null;
    const bytes = instruction.data ?? new Uint8Array();
    const summary: InstructionDiagnostic = {programId, dataLength: bytes.length};
    // Only decode the exact, account-free known ComputeBudget wire layouts.
    // Other instruction payloads (including Vault proof data) are never exposed.
    if (programId === computeProgram && (instruction.accountIndices?.length ?? 0) === 0) {
      const opcode = bytes[0];
      const kind = opcode === 1 ? 'RequestHeapFrame' : opcode === 2 ? 'SetComputeUnitLimit'
        : opcode === 3 ? 'SetComputeUnitPrice' : opcode === 4 ? 'SetLoadedAccountsDataSizeLimit' : undefined;
      if (kind && bytes.length === (opcode === 3 ? 9 : 5)) {
        const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        summary.computeBudget = {kind, value: (opcode === 3 ? data.getBigUint64(1, true) : BigInt(data.getUint32(1, true))).toString()};
      }
    }
    return summary;
  });
}
function nonCompute(transaction: Transaction): readonly Instruction[] | null {
  try {
    return decompileTransactionMessage(message(transaction)).instructions.filter(instruction => instruction.programAddress !== computeProgram);
  } catch { return null; }
}
function exactInstruction(a: Instruction, b: Instruction): boolean {
  const aAccounts = a.accounts ?? [], bAccounts = b.accounts ?? [];
  return a.programAddress === b.programAddress && equalBytes(a.data ?? new Uint8Array(), b.data ?? new Uint8Array()) && aAccounts.length === bAccounts.length
    && aAccounts.every((key, index) => key.address === bAccounts[index].address && key.role === bAccounts[index].role);
}

/** Snapshot the original with the Kit transaction encoder/decoder before
 * awaiting the wallet. No account address, blockhash, transaction bytes,
 * signature bytes or non-compute data is returned. The SDK must still perform
 * every exact-message/signature check. */
export function signingDiagnostics(original: Transaction, returned: Transaction): SigningDiagnostic {
  const a = message(original), b = message(returned), originalNonCompute = nonCompute(original), returnedNonCompute = nonCompute(returned);
  let retained: boolean | null = null, exact: boolean | null = null;
  if (originalNonCompute && returnedNonCompute) {
    let cursor = 0;
    for (const instruction of returnedNonCompute) {
      if (cursor < originalNonCompute.length && exactInstruction(originalNonCompute[cursor], instruction)) cursor++;
    }
    retained = cursor === originalNonCompute.length;
    exact = originalNonCompute.length === returnedNonCompute.length
      && originalNonCompute.every((instruction, index) => exactInstruction(instruction, returnedNonCompute[index]));
  }
  const aLookups = a.version === 0 ? a.addressTableLookups ?? [] : [], bLookups = b.version === 0 ? b.addressTableLookups ?? [] : [];
  return {
    version: {original: a.version, returned: b.version},
    message_equal: equalBytes(original.messageBytes, returned.messageBytes),
    header_equal: a.header.numSignerAccounts === b.header.numSignerAccounts
      && a.header.numReadonlySignerAccounts === b.header.numReadonlySignerAccounts
      && a.header.numReadonlyNonSignerAccounts === b.header.numReadonlyNonSignerAccounts,
    blockhash_equal: a.lifetimeToken === b.lifetimeToken,
    accounts_equal: a.staticAccounts.length === b.staticAccounts.length
      && a.staticAccounts.every((key, index) => key === b.staticAccounts[index]),
    ALT_equal: aLookups.length === bLookups.length
      && aLookups.every((lookup, index) => lookup.lookupTableAddress === bLookups[index].lookupTableAddress
        && equalNumbers(lookup.writableIndexes, bLookups[index].writableIndexes)
        && equalNumbers(lookup.readonlyIndexes, bLookups[index].readonlyIndexes)),
    original_instructions: instructions(original), returned_instructions: instructions(returned),
    original_non_compute_instructions_retained: retained, non_compute_instructions_equal: exact,
  };
}

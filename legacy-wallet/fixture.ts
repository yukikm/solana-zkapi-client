/** Offline browser fixture only. Never included in the real Phantom bundle. */
import {Buffer} from 'buffer';
import {getWallets} from '@wallet-standard/app';
import {createKeyPairSignerFromPrivateKeyBytes, getAddressDecoder, getAddressEncoder, getSignatureFromTransaction, getTransactionDecoder, getTransactionEncoder, partiallySignTransaction} from '@solana/kit';
import fixture from '../tests/fixtures/genesis-a.json' with {type: 'json'};
import {mountWalletUi} from './app.ts';
import type {VerifiedManifest} from '@zkapi/solana-sdk/trust';
import type {NoteProver} from '@zkapi/solana-sdk/prover';
import type {PrivateState} from '@zkapi/solana-sdk/control';
import {WalletClient} from '@zkapi/solana-sdk/wallet';
import {providerFixture, fixtureState} from './provider.fixture.ts';
import type {TransportRpc} from '@zkapi/solana-sdk/transport';
Object.assign(globalThis, {Buffer});
const field = (value: number) => '0x' + value.toString(16).padStart(64, '0');
const key = (value: string) => getAddressDecoder().decode(Buffer.from(value, 'hex'));
// Public deterministic fixture seeds; there is no imported user key or extension.
const pairs = await Promise.all([51, 52].map(value => createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(32).fill(value))));
const accounts = pairs.map(pair => Object.freeze({address: pair.address, publicKey: new Uint8Array(getAddressEncoder().encode(pair.address)), chains: ['solana:devnet'] as const, features: ['solana:signTransaction'] as const}));
let connected = false, rejectNext = true, requests = 0, sends = 0, persistedBeforeSend = false;
const wallet = {
  version: '1.0.0' as const, name: 'Fixture Wallet', icon: 'data:image/svg+xml;base64,PHN2Zy8+' as const, chains: ['solana:devnet'] as const,
  get accounts() { return connected ? accounts : []; },
  features: {
    'standard:connect': {version: '1.0.0' as const, connect: async () => { connected = true; return {accounts}; }},
    'solana:signTransaction': {version: '1.0.0' as const, supportedTransactionVersions: [0], signTransaction: async (...inputs: any[]) => {
      requests++; if (rejectNext) { rejectNext = false; throw Error('fixture explicit signature rejection'); }
      return Promise.all(inputs.map(async input => { const pair = pairs.find(p => p.address === input.account.address); if (!pair) throw Error('fixture account mismatch'); const tx = getTransactionDecoder().decode(input.transaction); const signed = await partiallySignTransaction([pair.keyPair], tx); return {signedTransaction: new Uint8Array(getTransactionEncoder().encode(signed))}; }));
    }},
  },
};
getWallets().register(wallet);
const manifest = {deployment_environment: 'devnet', setup_profile: 'test_only', genesis_hash: 'EtWTRABZaYq6iMfeYKouRu166VU2xqa1wcaWoxPkrZBG',
  deployment_id: 'i10-ui-offline-fixture', manifest_hash: 'f'.repeat(64), program_id: key(fixture.program_id), pool: key(fixture.pool),
  mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', cap_micro_usdc: '1000000', note_ttl_seconds: String(fixture.ttl)} as unknown as VerifiedManifest;
const repeatProviderMode = location.hash === '#provider-repeat-fixture';
const providerMode = location.hash === '#provider-fixture' || repeatProviderMode;
const providerDeposit = repeatProviderMode ? '2000000' : '1000000';
let presentationNow = 100n;
Object.assign(globalThis, {fixtureSetPresentationClock: (value: string) => { presentationNow = BigInt(value); }});
mountWalletUi({fixtureOnly: true, fixtureNowSeconds: () => presentationNow, targetWallet: wallet.name, runId: repeatProviderMode ? 'fixture-provider-repeat' : providerMode ? 'fixture-provider' : 'fixture', manifest, fee: async () => 5000,
  initialize: async (journal, signer) => {
    const state: PrivateState = {balance_micro_usdc: '1000000', balance_blinding: field(3), note_leaf: field(4), commitment: {x: field(5), y: field(6)}, anchor: field(1), state_signature: null};
    const prover = {deposit: async (note_id: number, amount: string, expiry: string) => ({witness: {secret: field(12345), note_id, deposit_micro_usdc: amount, expiry}, state: {...state, balance_micro_usdc: amount}, registration_commitment: '0x' + fixture.commitment}),
      inspect: async () => ({nullifier: fixture.auth.escape.public_inputs[11], registration_commitment: '0x' + fixture.commitment}),
      withdrawal: async () => fixture.auth.escape,
      tree: async () => fixture.trees[0]} as unknown as NoteProver;
    const rpc: TransportRpc = {signatureStatus: async () => null, finalizedReceipt: async () => null, finalizedBlockHeight: async () => 1,
      sendRawTransaction: async bytes => {
        const tx = getTransactionDecoder().decode(bytes), signature = getSignatureFromTransaction(tx);
        const saved = (await journal.read('wallet-ui-acceptance'))!.value.wallet!.operation!;
        persistedBeforeSend = saved.current === signature && saved.attempts.some(a => a.signature === signature && a.wireHex === Buffer.from(bytes).toString('hex'));
        if (!persistedBeforeSend) throw Error('SDK attempt not durable before send'); sends++; return signature;
      }};
    Object.assign(globalThis, {fixtureObservation: () => ({requests, sends, persistedBeforeSend}), fixtureApprove: () => { rejectNext = false; }});
    const walletOptions = {manifest, prover, rpc, fetch: async () => new Response('', {status: 503}), chain: {snapshot: async () => ({root: fixture.trees[0].public_inputs[1], siblings: Array(32).fill(field(0)), slot: 100, sequence: '0', nextNoteId: 0, clock: String(fixture.now), paused: false, treasuryOwner: signer.publicKey, note: {note_id: 0, registration_commitment: '0x' + fixture.commitment, deposit_micro_usdc: providerMode ? providerDeposit : '2000000', expiry: '86400', status: 'active' as const}}),
      buffer: async () => null, blockhash: async () => ({blockhash: getAddressDecoder().decode(new Uint8Array(32).fill(7)), lastValidBlockHeight: 1000})}};
    if (providerMode) {
      if (!await journal.read('wallet-ui-acceptance')) await new WalletClient({...walletOptions, journal, wallets: [signer]}).importFinalized('wallet-ui-acceptance', {secret: field(12345), note_id: 0, deposit_micro_usdc: providerDeposit, expiry: '86400'}, {...fixtureState(), balance_micro_usdc: providerDeposit});
      const p = await providerFixture(journal, 'wallet-ui-acceptance');
      if (repeatProviderMode) p.options.configuration.requestPolicy = 'explicit_demo';
      Object.assign(globalThis, {fixtureProviderObservation: () => p.counts, fixtureProviderBehavior: p.behavior});
      return {...walletOptions, providerOptions: p.options};
    }
    return walletOptions;
  }});

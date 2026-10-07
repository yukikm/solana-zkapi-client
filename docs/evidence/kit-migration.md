# Solana Kit migration

Recorded 2026-10-07 JST. The active applications consume
`@zkapi/solana-sdk@0.2.0-devnet.1` and `@solana/kit@8.4.0`. Low-level RPC,
address, transaction and signing code now uses native Kit values. Wallet Standard
discovery, explicit account selection and SDK journal ownership remain intact.

The fixed-wallet application verifies the transaction version and 1,232-byte
bound before asking for a signature. It calculates the fee from the exact
message, snapshots the reviewed transaction, and retains the original SDK
message/signature checks. Public diagnostics disclose only structural changes
and recognized compute-budget settings, never proof, message or signature bytes.

Final independent installation passed all five stages, strict typechecking,
both application builds and 77 tests with zero skips. All 56 source inputs
remained unchanged. This includes actual isolated Chrome with synthetic
wallet/provider inputs. The extracted SDK archive has SHA-256
`e6ff141b1c13c278f1c6d80dbe1397f187290270c583a32545df5fe4fbd45019`
and its 46 core source hashes join commit
`088ca40bf5886738f87b4db97205db8bff752356`. The eight signing diagnostic tests cover preserved
messages, changed blockhashes, compute budgets, account roles, instruction order,
malformed encodings and unresolved address lookup tables. These are local tests,
not live Phantom, provider or public-chain acceptance.

Run `npm run verify:isolated` for a clean independent installation from the
vendored archive. Its [report](kit-migration-isolated-results.json) records the
exact SDK digest, source hashes, full test counts and dependency graph check.
Consult the [versioned provenance](../../vendor/provenance-0.2.0-devnet.1.json)
for the current artifact's source and validation status. Public release signature
verification is a separate step from this independent installation test.

The old SDK archives are accessible through Git history and the immutable public
preview release. Historical provenance and evidence remain unchanged. No private
journal, wallet, deployment pin, running operator, provider budget or funded state
was migrated or reset, and this change made no new live provider or chain call.

The first hosted run with the corrected artifact path failed two Chrome startup
checks before their application assertions ran; 75 of 77 tests passed. The
[failed run and artifact](kit-migration-hosted-failure.json) and its complete
[isolation report](kit-migration-hosted-failure-isolated.json) are retained.
A test-only change waits up to 20 seconds for the same Chrome process to write a
valid debugging port, without relaunching it, changing sandbox flags or retrying
application actions. The full independent local check then passed 77/77 with
56 unchanged inputs; the [initial local report](kit-migration-isolated-initial-results.json)
is preserved separately. Only the two browser test source hashes changed; SDK
archive, runtime, custody and deployment inputs remained unchanged.

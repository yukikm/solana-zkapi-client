# Solana zkAPI client examples

Independent browser applications consuming `@zkapi/solana-sdk` from a versioned
package tarball. The protocol, SDK, native clientd, deployment tooling and operator
services live in [solana-zkapi](https://github.com/yukikm/solana-zkapi). An app or
AI agent can use that project without installing this demonstration repository.

**Devnet preview.** This application uses SDK `0.2.0-devnet.1` with `@solana/kit@8.4.0`. SDK tarballs and
local clientd downloads belong to the [core releases](https://github.com/yukikm/solana-zkapi/releases).
This repository provides example applications; it does not provide a production
operator or mainnet deployment. The [integration table](https://github.com/yukikm/solana-zkapi/blob/main/docs/integrations/README.md)
records the tested OpenClaw route and current Claude Code/Codex incompatibilities.

## Install and build

Use Node 24.19.0 and npm 11.9.0. The versioned SDK tarball in `vendor/` is included
with this source checkout, with its SHA256 and provenance in
[vendor/README.md](vendor/README.md). No npm registry publication, workspace link,
or adjacent core checkout is required to build.

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run typecheck
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist/browser-chat
```

Open `http://127.0.0.1:4173`. The default build has no installed deployment and
makes no wallet or API requests. Follow [browser-chat setup](browser-chat/README.md)
to build with independently reviewed public configuration. WASM, proof artifacts,
authenticated tariffs and service endpoints are deployment inputs; the SDK
package does not invent trust pins or contain private service credentials.

`npm run verify:isolated` reproduces clean installation and both application builds
in a temporary directory without a core checkout. [Kit migration evidence](docs/evidence/kit-migration.md)
records the current package. Historical [preview evidence](docs/evidence/devnet-preview.md)
and [migration evidence](docs/evidence/migration.md) retain earlier package checks.
The GitHub Actions workflow runs the same isolation check and requires all
browser tests to run without skips.

`npm run check` runs strict typechecking, builds both applications and runs
the migrated tests. Browser tests use an isolated Chromium profile and synthetic
wallet/provider inputs. Set `ZKAPI_TEST_CHROME` when Chromium is not at a standard
path. These tests do not claim Phantom, real-provider, or public-chain acceptance.

## Solana Kit integration

Both applications and the SDK use native Kit RPC, address and transaction types.
There is no `@solana/web3.js` dependency or compatibility runtime in the installed
package graph. Wallet discovery and connection continue to use Wallet Standard.
The adapter sends the exact serialized v0 transaction to the selected wallet;
the SDK verifies the returned message and signatures before saving or sending it.

SDK `0.2.0-devnet.1` changes low-level public types: `V0Wallet.publicKey` is a Kit
`Address` string, `signTransaction` consumes and returns a Kit `Transaction`, and
`ClientDeployment.connection` is a Kit `Rpc<SolanaRpcApi>`. Account derivation is
asynchronous. High-level deposit, settlement and recovery remain the existing
SDK journal workflow. Preserve existing origins, note IDs and deployment pins.

## Applications

- [browser-chat](browser-chat/README.md): configurable chat application using the
  application SDK, explicit funding, streaming, settlement and recovery actions.
- [legacy-wallet](legacy-wallet/README.md): the original fixed-request live wallet
  UI and its presentation-only `/demo` view. Historical custody identifiers and
  request bodies are preserved for existing notes.

Operator relays remain core tools. They serve an explicitly supplied built
application directory and own private RPC configuration and campaign budgets.
Frontend build and test do not import those tools. Do not copy `.env`, native
journals, wallet keypairs, provider keys or private host configuration here.
Existing funded notes must retain their browser origin, account, deployment,
storage names and note IDs; moving source files does not migrate custody.

## Provenance and scope

Migrated on 2026-10-07 from `examples/browser-chat` and `scripts/i10-wallet-ui` in
the core repository. Their pre-migration READMEs are preserved in
[docs/history](docs/history) as historical records; their old commands and paths
are not the current installation guide. Historical runtime receipts remain in
the core repository. This extraction introduces no new live acceptance or budget
reservation. Selected external SDK/OpenClaw devnet lifecycles are recorded in the
[core evidence](https://github.com/yukikm/solana-zkapi/blob/main/docs/evidence/I10-external-integration.md);
they do not establish a new browser/Phantom result. Distribution signing,
standard public clientd transport acceptance and production release gates remain
separate from local package-consumption checks.

Newly authored Solana zkAPI application code is licensed under [MIT](LICENSE).
The vendored SDK and dependencies retain their own license notices. This license
does not replace upstream or third-party notices. Historical evidence and package
provenance are retained with their original source-specific results.

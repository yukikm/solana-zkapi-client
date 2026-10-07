# Solana zkAPI client examples

Independent browser applications consuming `@zkapi/solana-sdk` from a versioned
package tarball. The protocol, SDK, native clientd, deployment tooling and operator
services live in [solana-zkapi](https://github.com/yukikm/solana-zkapi). An app or
AI agent can use that project without installing this demonstration repository.

**Devnet preview.** This application uses SDK `0.1.0-devnet.1`. SDK tarballs and
local clientd downloads belong to the [core releases](https://github.com/yukikm/solana-zkapi/releases).
This repository provides example applications; it does not provide a production
operator or mainnet deployment. The [integration table](https://github.com/yukikm/solana-zkapi/blob/main/docs/integrations/README.md)
records the tested OpenClaw route and current Claude Code/Codex incompatibilities.

## Install and build

Use Node 24.19.0 and npm 11.9.0. The reviewed SDK tarball in `vendor/` is included
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
in a temporary directory without a core checkout. [Preview evidence](docs/evidence/devnet-preview.md)
records the current package; [migration evidence](docs/evidence/migration.md)
preserves the earlier package checks. The GitHub Actions workflow runs the same
isolation check and requires all browser tests to run without skips.

`npm run check` runs strict typechecking, builds both applications and runs
the migrated tests. Browser tests use an isolated Chromium profile and synthetic
wallet/provider inputs. Set `ZKAPI_TEST_CHROME` when Chromium is not at a standard
path. These tests do not claim Phantom, real-provider, or public-chain acceptance.

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

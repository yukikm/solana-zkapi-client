# Independent client repository extraction

Date: 2026-10-07 JST. `browser-chat/` and `legacy-wallet/` are migrated from the
core repository's `examples/browser-chat/` and `scripts/i10-wallet-ui/`.
The original README files are retained under `docs/history/`; the source
inventory records the original revision and each old/new file hash.

The application and worker use `@zkapi/solana-sdk` public package exports. esbuild,
Wallet Standard, TypeScript and other direct dependencies are pinned in this
repository and its lockfile. SDK declarations replace the inherited core
TypeScript configuration. The historical build-and-launch command is now a
frontend build; the core operator relay serves that explicitly supplied output.
No private credentials, deployment profiles, generated WASM/proof assets,
financial journals or campaign budgets were moved. Running core services were
not restarted or reconfigured by this extraction.

The migrated fixture tests retain encrypted journal and one-send lifecycle
checks. The standalone profile parser/transport/admission tests and both UI
builds run against the installed tarball. The legacy fixed-request test compares
the exact public JSON template without importing the core provider acceptance
coordinator. Browser fixture servers expose only exact static assets; financial
relay tests remain in the core repository.

## Reproduction

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run verify:isolated
```

The verifier creates a temporary directory with only this client's public source,
lockfile and reviewed SDK tarball. It clears `NODE_PATH`, installs fresh packages,
checks that the SDK is an extracted package rather than a workspace symlink,
typechecks, builds both UIs and runs the UI suite. It removes its own temporary
directory after saving [the report](migration-isolated-results.json).

The latest report passed all five stages, 77 tests and zero skips, including three
isolated actual Chrome scenarios. The tested source hashes were unchanged.
It uses the reviewed SDK package with SHA256
`fc37358ce00fa7bcb5c43367c8f09b3908c617f9235e8646ae78003a21040c91`, including
the bounded OpenRouter terminal-usage SSE compatibility fix. The earlier successful
[package verification](migration-isolated-pre-sse-results.json),
[configured build](configured-build-pre-sse-results.json) and
[SDK provenance](../history/sdk-provenance-before-sse-fix.json) remain preserved.
These browser scenarios use synthetic wallet/provider/proof inputs; this report
does not establish Phantom, provider CORS, live billing, public-chain acceptance,
a production deployment or I10/G3 completion.

The initial verifier run installed successfully but incorrectly compared macOS
`/var` and `/private/var` paths. It stopped before tests with a false workspace-link
error. [That failed report](migration-isolated-initial-results.json) is preserved.
The verifier now canonicalizes the temporary directory before checking containment.

A separate [configured-build check](configured-build-results.json) used the
existing public devnet profile pinned by SHA256
`270ff0fea81bed8b809b3d4335af7392a95dc122a12414ed0f058abd6af2eaf4` and the final
installed SDK tarball. All five built asset hashes matched `profile-build.json`.
The new output is isolated in `dist/reviewed-migration-sse-fixed`; no private host file,
running host or funded state was changed. This establishes build compatibility
with the existing public profile, not new browser/provider acceptance.

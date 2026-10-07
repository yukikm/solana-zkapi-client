# Solana Kit SDK package

The active dependency is `zkapi-solana-sdk-0.2.0-devnet.1.tgz`, a compiled
ES-module/TypeScript declaration package using `@solana/kit@8.4.0`.
It is installed as an extracted dependency, without a workspace symlink.
The active package and its dependency graph contain no `@solana/web3.js` runtime.

[Versioned provenance](provenance-0.2.0-devnet.1.json) records the exact SHA256,
size, source status and validation scope. The lockfile separately pins npm's
artifact integrity. Obtain this checkout and its checksum through a trusted
channel; a checksum beside an untrusted download does not establish trust.

```sh
shasum -a 256 vendor/zkapi-solana-sdk-0.2.0-devnet.1.tgz
npm ci --ignore-scripts --no-audit --no-fund
npm run verify:isolated
```

The package includes MIT licensing for newly authored Solana zkAPI code.
Dependency and upstream notices retain their original scope. It contains no
wallet/provider credentials, financial journals, deployment trust profile, WASM
or proving-key files. Install reviewed public deployment assets separately; see
the [SDK distribution guide](https://github.com/yukikm/solana-zkapi/blob/main/packages/sdk/DISTRIBUTION.md).
Existing funded deployments and notes retain their original pins.

## Historical packages

The old archives have been removed from the active checkout so an inactive
legacy client package is not bundled alongside Kit. Their exact bytes remain in
[Git history](https://github.com/yukikm/solana-zkapi-client/tree/b5f623a4fa5a2905ba9955eb76c224446cab9d58/vendor),
and the immutable [0.1.0-devnet.1 release](https://github.com/yukikm/solana-zkapi/releases/tag/v0.1.0-devnet.1)
remains available. Historical evidence has not been rewritten.

- `0.1.0-devnet.1`: [provenance](provenance-0.1.0-devnet.1.json), SHA256
  `eb3164d5b7a54c7b97e523ec742033b39547eda5842648490ae9f68048b07504`.
- `0.1.0`: [provenance](provenance.json), SHA256
  `fc37358ce00fa7bcb5c43367c8f09b3908c617f9235e8646ae78003a21040c91`.
- Earlier pre-SSE provenance remains in the [history archive](../docs/history/sdk-provenance-before-sse-fix.json).

For future updates, add a new versioned artifact and provenance, update the
file dependency and lockfile, and select that artifact in the isolation verifier.
A library upgrade does not migrate deployment identity, browser custody or
unresolved financial operations.

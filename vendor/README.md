# Reviewed SDK packages

The active dependency is `zkapi-solana-sdk-0.1.0-devnet.1.tgz`, a compiled
ES-module/TypeScript declaration package from the Solana zkAPI devnet preview.
It is installed as an extracted dependency, not a workspace symlink.

SHA256:

```text
eb3164d5b7a54c7b97e523ec742033b39547eda5842648490ae9f68048b07504
```

```sh
shasum -a 256 vendor/zkapi-solana-sdk-0.1.0-devnet.1.tgz
npm ci --ignore-scripts --no-audit --no-fund
```

[Versioned provenance](provenance-0.1.0-devnet.1.json) records the exact package,
source hashes and isolated core checks. The lockfile also records npm's artifact
integrity. Obtain this checkout and its checksum through a trusted channel; a
checksum beside an untrusted download does not independently establish trust.
SDK release artifacts are listed in the [core releases](https://github.com/yukikm/solana-zkapi/releases).
Registry publication remains disabled and is not required for this installation.

The package includes MIT licensing for newly authored Solana zkAPI code. Its
dependency and upstream notices retain their original scope. It contains no
wallet/provider credentials, financial journals, deployment trust profile, WASM
or proving-key files. Install reviewed public deployment assets separately; see
the [SDK distribution guide](https://github.com/yukikm/solana-zkapi/blob/main/packages/sdk/DISTRIBUTION.md).
Existing funded deployments and notes retain their original pins.

## Historical package

`zkapi-solana-sdk-0.1.0.tgz` and [provenance.json](provenance.json) are retained
unchanged for the migration and SSE-parser evidence. Their SHA256 is
`fc37358ce00fa7bcb5c43367c8f09b3908c617f9235e8646ae78003a21040c91`.
They are not the active npm dependency. Earlier pre-SSE provenance remains in
[the history archive](../docs/history/sdk-provenance-before-sse-fix.json).

For a future update, retain the old package/provenance, add the new versioned
artifact and provenance, explicitly update the file dependency and lockfile, and
update the isolation verifier's reviewed artifact. Run `npm run verify:isolated`
before accepting the replacement. A library upgrade never migrates deployment
identity, browser custody or unresolved financial operations.

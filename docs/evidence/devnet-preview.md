# Versioned devnet preview consumption

Recorded 2026-10-07 JST. The application now consumes
`@zkapi/solana-sdk@0.1.0-devnet.1` from its vendored tarball, with SHA256
`eb3164d5b7a54c7b97e523ec742033b39547eda5842648490ae9f68048b07504`.
The [versioned provenance](../../vendor/provenance-0.1.0-devnet.1.json) retains
the core source hashes and isolated package result. The SDK tarball contains its
MIT license, and this application has a separate [MIT license](../../LICENSE).
Upstream and dependency notices retain their original scope.

The fresh [isolation report](devnet-preview-isolated-results.json) passed clean
installation, strict typechecking, both application builds and all 77 tests
with zero skips. The browser scenarios use actual isolated Chrome with synthetic
wallet, provider and proof inputs. All 56 guarded files remained unchanged while
the check ran. The temporary consumer had no core checkout or workspace links.

Reproduce with Node 24.19.0 and npm 11.9.0:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run verify:isolated
```

The [new GitHub Actions workflow](../../.github/workflows/ci.yml) uses the same
verifier on Ubuntu 24.04 with its installed Chrome. The verifier requires every
test to run and pass; a missing browser cannot produce a passing report by
skipping the Chrome cases. Adding the workflow is not a claim of a completed
hosted run; check its actual Actions result after publication.

The original `0.1.0` tarball, [original provenance](../../vendor/provenance.json)
and all [migration reports](migration.md) are preserved unchanged. This package
update did not move, open, fund or modify the private SDK devnet journal or any
other browser/native custody. It made no AUTH, provider or public-chain request.
The existing selected live lifecycles remain separately documented in the core
repository. Mainnet, a public production operator, browser/Phantom live acceptance
and production signing are not established by these checks.

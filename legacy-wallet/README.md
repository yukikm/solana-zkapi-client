# Historical wallet and presentation UI

This directory preserves the original fixed-request browser UI from
`solana-zkapi/scripts/i10-wallet-ui`, including its encrypted SDK journal
integration, explicit wallet actions and optional presentation-only `/demo`.
The main application for new integrations is [browser-chat](../browser-chat/README.md).

From this repository root:

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run build:legacy
```

The output is `dist/legacy-wallet`. The presentation assets never connect a wallet
or provider. The live view requires the core operator relay and a reviewed private
configuration. Run the relay from the core checkout with this built directory;
private configuration and existing budgets remain in the operator's environment.
From the core checkout, the launch command is:

```sh
node scripts/legacy_browser_devnet_host.ts \
  --config /absolute/path/to/existing-private-config.json \
  --ui-dir /absolute/path/to/solana-zkapi-client/dist/legacy-wallet
```

The browser bundle and worker import only the installed SDK package and declared
dependencies; they do not import SDK source from a neighboring checkout.

Use the same origin and port for existing funded notes, and keep their original
manifest, run ID, account and encrypted journal names. Do not replace existing
host configuration or clear browser storage to perform this source migration.
The historical `launch.ts --config` build-and-host command is now split into this
repository's build and the core repository's explicit operator host command.

The original README, including source-specific funded checkpoints and historical
commands, is retained verbatim in
[the migration archive](../docs/history/legacy-wallet-README-before-migration.md).
Those checkpoints do not prove a new request, settled withdrawal, or live browser
acceptance after this extraction. The [core evidence archive](https://github.com/yukikm/solana-zkapi/tree/main/docs/evidence)
retains the independent receipts and limitations.

Tests retain the Wallet Standard, encrypted journal, one-send, recovery,
settlement and presentation checks. The test-only static server has no RPC,
AUTH, inference or credential routes. Financial relay validation remains in the
core repository's `scripts/devnet-browser-relay` tests.

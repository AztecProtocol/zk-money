# ZK-Money

## Running locally

To run locally make sure that you run `yarn start:dev` this will by default point at devnet.

## Deployment notes

Post a fresh set of devnet / testnet contracts being deployed there is a manual process to get zk-money in a ready state.

1. Go to `aztec-dev-cli` in the mono-repo,
2. Run `yarn start fetchAllDataProviderData`
3. Paste the input into `yarn-project/zk-money/src/alt-model/registrations_data/registrations_data_raw.ts`.



# zk.money

At the time of writing zk.money's development server can be started with:

```
./bootstrap.sh
yarn start:dev
```

## Deployment notes

Post a fresh set of devnet / testnet contracts being deployed there is a manual process to get zk-money in a ready state.

1. Go to `aztec-dev-cli` in the mono-repo,
2. Run `yarn start fetchAllDataProviderData`
3. Paste the input into `yarn-project/zk-money/src/alt-model/registrations_data/registrations_data_raw.ts`.

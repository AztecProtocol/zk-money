import { getRollupProviderStatus } from '@aztec/sdk';
import { AssetLabel } from './alt-model/known_assets/known_asset_display_data.js';
import { toBaseUnits } from './app/units.js';

export interface Config {
  deployTag: string;
  hostedSdkUrl: string;
  rollupProviderUrl: string;
  explorerUrl: string;
  chainId: number;
  ethereumHost: string;
  txAmountLimits: Record<AssetLabel, bigint>;
  debugFilter: string;
}

export async function getEnvironment() {
  const rollupProviderUrl = `${window.location.protocol}//${window.location.hostname}:8081`;
  const initialRollupProviderStatus = await getRollupProviderStatus(rollupProviderUrl);
  const config: Config = {
    deployTag: 'localhost',
    hostedSdkUrl: `${window.location.protocol}//${window.location.hostname}:1234`,
    rollupProviderUrl,
    explorerUrl: `${window.location.protocol}//${window.location.hostname}:3000`,
    chainId: initialRollupProviderStatus.blockchainStatus.chainId,
    ethereumHost: `${window.location.protocol}//${window.location.hostname}:8545`,
    txAmountLimits: {
      Eth: toBaseUnits('5', 18),
      WETH: 0n, // unused
      DAI: toBaseUnits('10000', 18),
      wstETH: toBaseUnits('6', 18),
      stETH: 0n, // unused
      yvWETH: toBaseUnits('5', 18),
      yvDAI: toBaseUnits('10000', 18),
      weWETH: toBaseUnits('5', 18),
      wewstETH: toBaseUnits('6', 18),
      weDAI: toBaseUnits('10000', 18),
      wa2WETH: toBaseUnits('5', 18),
      wa2DAI: toBaseUnits('12000', 18),
      LUSD: toBaseUnits('10000', 18),
      'TB-275': toBaseUnits('10000', 18),
      'TB-400': toBaseUnits('10000', 18),
      wcDAI: toBaseUnits('10000', 18),
      icETH: toBaseUnits('5', 18),
      yvLUSD: toBaseUnits('10000', 18),
    },
    debugFilter: 'zm:*,bb:*',
  };
  return { config, initialRollupProviderStatus, staleFrontend: false };
}

import eulerLogo from '../../../images/euler_logo.svg';
import eulerMiniLogo from '../../../images/euler_mini_logo.png';
import { CreateRecipeArgs } from '../types.js';
import { useDefaultExpectedAssetYield, useDefaultMarketSizeBulkPrice } from '../defi_info_hooks.js';
import { formatBulkPrice_compact, formatPercentage_2dp } from '../../../app/util/formatters.js';
import { keyStatConfig_averageWait } from '../key_stat_configs.js';
import { bindInteractionPredictionHook_expectedOutput } from '../interaction_prediction_configs.js';
import { useVariableAprText } from '../position_key_stat_configs.js';
import { createDefiPublishStatsCacheArgsBuilder } from '../defi_publish_stats_utils.js';
import { createSimpleSwapFlowBinding } from '../flow_configs.js';
import { EulerRedemptionBridgeData } from '../../../bridge-clients/client/euler/euler-redemption-bridge-data.js';

export const EULER_ETH_CARD: CreateRecipeArgs = {
  id: 'euler.ETH-to-weETH',
  bridgeBinding: 'Euler_Redeem_2M',
  gradient: ['#414066', '#414066'],
  openHandleAssetBinding: 'weWETH',
  flowBindings: createSimpleSwapFlowBinding('Eth', 'weWETH'),
  createAdaptor: ({ provider }) => EulerRedemptionBridgeData.create(provider),
  enterAuxDataResolver: {
    type: 'bridge-data-select',
    selectOpt: opts => opts[0], // minimum output per erc4626 token
  },
  exitAuxDataResolver: {
    type: 'bridge-data-select',
    selectOpt: opts => opts[0], // minimum output per erc4626 token
  },
  projectName: 'Euler',
  website: 'https://www.euler.finance/',
  websiteLabel: 'euler.finance',
  name: 'Euler',
  shortDesc: 'Lend ETH on Euler and earn yield by holding weWETH in exchange.',
  exitDesc: 'Unwrap weWETH to recieve your underlying ETH.',
  longDescription: 'Lend ETH on Euler and earn yield by holding weWETH in exchange.',
  logo: eulerLogo,
  // nextButtonMessage: 'Euler is currently disabled. Please check back later.',
  miniLogo: eulerMiniLogo,
  cardTag: 'Lending',
  cardButtonLabel: 'Earn',
  exitButtonLabel: 'Claim & Exit',
  showExchangeRate: true,
  keyStats: {
    keyStat1: {
      useLabel: () => 'APY',
      skeletonSizingContent: '2.34%',
      useFormattedValue: recipe => {
        const apr = useDefaultExpectedAssetYield(recipe);
        if (apr === undefined) return;
        return formatPercentage_2dp(apr);
      },
    },
    keyStat2: {
      useLabel: () => 'L1 Liquidity',
      skeletonSizingContent: '$11B',
      useFormattedValue: recipe => {
        const liquidity = useDefaultMarketSizeBulkPrice(recipe.id);
        if (liquidity === undefined) return;
        return formatBulkPrice_compact(liquidity);
      },
    },
    keyStat3: keyStatConfig_averageWait,
  },
  useEnterInteractionPredictionInfo: bindInteractionPredictionHook_expectedOutput({
    direction: 'enter',
    showUnderlying: true,
    outputSelection: 'A',
  }),
  useExitInteractionPredictionInfo: bindInteractionPredictionHook_expectedOutput({
    direction: 'exit',
    showUnderlying: false,
    outputSelection: 'A',
  }),
  positionKeyStat: {
    type: 'closable',
    useEnterText: useVariableAprText,
    useOpenText: useVariableAprText,
    useExitText: useVariableAprText,
  },
  getDefiPublishStatsCacheArgs: createDefiPublishStatsCacheArgsBuilder({ ignoreAuxData: false }),
};

export const EULER_WSTETH_CARD: CreateRecipeArgs = {
  ...EULER_ETH_CARD,
  id: 'euler.wstETH-to-wewstETH',
  openHandleAssetBinding: 'wewstETH',
  flowBindings: createSimpleSwapFlowBinding('wstETH', 'wewstETH'),
  shortDesc: 'Lend wstETH on Euler and earn yield by holding wewstETH in exchange.',
  exitDesc: 'Unwrap wewstETH to recieve your underlying wstETH.',
  longDescription: 'Lend wstETH on Euler and earn yield by holding wewstETH in exchange.',
  keyStats: {
    ...EULER_ETH_CARD.keyStats,
    keyStat1: {
      ...EULER_ETH_CARD.keyStats.keyStat1,
      useLabel: () => 'wstETH APY',
    },
  },
};

export const EULER_DAI_CARD: CreateRecipeArgs = {
  ...EULER_ETH_CARD,
  id: 'euler.DAI-to-weDAI',
  openHandleAssetBinding: 'weDAI',
  flowBindings: createSimpleSwapFlowBinding('DAI', 'weDAI'),
  shortDesc: 'Lend DAI on Euler and earn yield by holding weDAI in exchange.',
  exitDesc: 'Unwrap weDAI to recieve your underlying DAI.',
  longDescription: 'Lend DAI on Euler and earn yield by holding weDAI in exchange.',
};

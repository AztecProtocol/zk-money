import type { Provider, StaticJsonRpcProvider } from '@ethersproject/providers';
import type { DefiRecipe } from '../../types.js';
import createDebug from 'debug';
import { LazyInitCacheMap } from '../../../../app/util/lazy_init_cache_map.js';
import { RollupProviderStatus } from '@aztec/sdk';
import { SdkObs } from '../../../top_level_context/sdk_obs.js';

const debug = createDebug('zm:bridge_data_adaptor_cache');

export function createBridgeDataAdaptorCache(
  recipes: DefiRecipe[],
  status: RollupProviderStatus,
  provider: Provider,
  sdkObs: SdkObs,
) {
  return new LazyInitCacheMap((recipeId: string) => {
    const recipe = recipes.find(x => x.id === recipeId)!;
    const { rollupContractAddress } = status.blockchainStatus;
    const blockchainBridge = status.blockchainStatus.bridges.find(bridge => bridge.id === recipe.bridgeAddressId);
    if (!blockchainBridge) {
      debug("No bridge found for recipe's enter address.");
      return undefined;
    }
    return recipe.createAdaptor({
      provider: provider as StaticJsonRpcProvider,
      rollupContractAddress,
      bridgeAddressId: blockchainBridge.id,
      bridgeContractAddress: blockchainBridge.address,
      sdkObs,
    });
  });
}

export type BridgeDataAdaptorCache = ReturnType<typeof createBridgeDataAdaptorCache>;

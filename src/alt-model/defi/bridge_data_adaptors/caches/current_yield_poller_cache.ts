import type { BridgeDataAdaptorCache } from './bridge_data_adaptor_cache.js';
import type { DefiRecipe } from '../../types.js';
import createDebug from 'debug';
import { Obs } from '../../../../app/util/index.js';
import { Poller } from '../../../../app/util/poller.js';
import { LazyInitDeepCacheMap } from '../../../../app/util/lazy_init_cache_map.js';

const debug = createDebug('zm:current_yield_poller_cache');

const POLL_INTERVAL = 5 * 60 * 1000;

export function createCurrentAssetYieldPollerCache(recipes: DefiRecipe[], adaptorCache: BridgeDataAdaptorCache) {
  return new LazyInitDeepCacheMap(([recipeId, interactionNonce]: [string, number]) => {
    const recipe = recipes?.find(x => x.id === recipeId);
    const adaptor = adaptorCache.get(recipeId);
    if (!adaptor || !recipe) return undefined;
    if (!adaptor.getInteractionAPR) {
      throw new Error('Attempted to call unsupported method "getCurrentYield" on bridge adaptor');
    }
    const pollObs = Obs.constant(async () => {
      try {
        const values = await adaptor.getInteractionAPR!(interactionNonce);
        return values[0];
      } catch (err) {
        debug({ recipeId, interactionNonce }, err);
        throw new Error(`Failed to fetch bridge current yield for "${recipe.name}".`);
      }
    });
    return new Poller(pollObs, POLL_INTERVAL, undefined);
  });
}

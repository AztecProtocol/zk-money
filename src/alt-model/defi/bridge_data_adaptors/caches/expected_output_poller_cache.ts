import type { BridgeDataAdaptorCache } from './bridge_data_adaptor_cache.js';
import type { BridgeFlowAssets, DefiRecipe, FlowDirection } from '../../types.js';
import createDebug from 'debug';
import { Obs } from '../../../../app/util/index.js';
import { Poller } from '../../../../app/util/poller.js';
import { LazyInitDeepCacheMap } from '../../../../app/util/lazy_init_cache_map.js';
import { toAdaptorArgs } from '../bridge_adaptor_util.js';
import { AssetValue } from '@aztec/sdk';

const debug = createDebug('zm:expected_output_poller_cache');

const POLL_INTERVAL = 5 * 60 * 1000;

function getInteractionAssets(flow: BridgeFlowAssets, direction: FlowDirection) {
  switch (direction) {
    case 'enter':
      return flow.enter;
    case 'exit': {
      if (flow.type !== 'closable') throw new Error('Cannot query an exit output for an async bridge');
      return flow.exit;
    }
  }
}

export function createExpectedOutputPollerCache(recipes: DefiRecipe[], adaptorCache: BridgeDataAdaptorCache) {
  return new LazyInitDeepCacheMap(
    ([recipeId, auxData, inputAmount, direction]: [string, bigint, bigint, FlowDirection]) => {
      const adaptor = adaptorCache.get(recipeId);
      const recipe = recipes.find(x => x.id === recipeId);
      if (!adaptor || !recipe) return undefined;

      const interactionAssets = getInteractionAssets(recipe.flow, direction);
      const { inA, inB, outA, outB } = toAdaptorArgs(interactionAssets);
      const pollObs = Obs.constant(async () => {
        try {
          const values = await adaptor.getExpectedOutput(inA, inB, outA, outB, auxData, inputAmount);
          const outputValueA: AssetValue = { assetId: interactionAssets.outA.id, value: values[0] };
          let outputValueB: undefined | AssetValue;
          if (interactionAssets.outB !== undefined) {
            outputValueB = { assetId: interactionAssets.outB.id, value: values[1] };
          }
          return { outputValueA, outputValueB };
        } catch (err) {
          debug({ recipeId, inA, inB, outA, outB, auxData, inputAmount }, err);
          throw new Error(`Failed to fetch bridge expected output for "${recipe.name}".`);
        }
      });
      return new Poller(pollObs, POLL_INTERVAL, undefined);
    },
  );
}

export type ExpectedOutputPollerCache = ReturnType<typeof createExpectedOutputPollerCache>;

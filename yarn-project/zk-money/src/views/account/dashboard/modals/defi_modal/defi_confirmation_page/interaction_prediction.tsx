import {
  CostBreakdownInvestmentRow,
  CostBreakdownInvestmentRowTextOnly,
} from '../../modal_molecules/cost_breakdown/index.js';
import {
  BridgeInteraction,
  DefiRecipe,
  FlowDirection,
  InteractionPredictionInfoHook,
} from '../../../../../../alt-model/defi/types.js';
import { Amount } from '../../../../../../alt-model/assets/index.js';
import { BridgeCallData } from '@aztec/sdk';

function InteractionPrediction(props: {
  useInteractionPredictionInfo: InteractionPredictionInfoHook;
  recipe: DefiRecipe;
  interaction: BridgeInteraction;
}) {
  const { useInteractionPredictionInfo } = props;
  const info = useInteractionPredictionInfo(props.recipe, props.interaction);
  switch (info.type) {
    case 'labelled-value':
      return (
        <CostBreakdownInvestmentRow
          label={info.label}
          asset={props.interaction.displayedOutputAsset}
          value={info.formattedValue}
          conversionValue={info.formattedUnderlyingValue}
        />
      );
    case 'text-only':
      return <CostBreakdownInvestmentRowTextOnly text={info.text} />;
  }
}

function toInteraction(
  direction: FlowDirection,
  recipe: DefiRecipe,
  inputValue: bigint,
  bridgeCallData?: BridgeCallData,
): BridgeInteraction | undefined {
  if (!bridgeCallData) return;
  if (direction === 'enter') {
    return {
      bridgeCallData,
      inputValue,
      inputAssetA: recipe.flow.enter.inA,
      inputAssetB: recipe.flow.enter.inB,
      outputAssetA: recipe.flow.enter.outA,
      outputAssetB: recipe.flow.enter.outB,
      displayedOutputAsset: recipe.flow.enter.outDisplayed,
    };
  }
  if (direction === 'exit' && recipe.flow.type === 'closable') {
    return {
      bridgeCallData,
      inputValue,
      inputAssetA: recipe.flow.exit.inA,
      inputAssetB: recipe.flow.exit.inB,
      outputAssetA: recipe.flow.exit.outA,
      outputAssetB: recipe.flow.exit.outB,
      displayedOutputAsset: recipe.flow.exit.outDisplayed,
    };
  }
}

function getInteractionPredictionInfoHook(direction: FlowDirection, recipe: DefiRecipe) {
  switch (direction) {
    case 'enter':
      return recipe.useEnterInteractionPredictionInfo;
    case 'exit':
      return recipe.useExitInteractionPredictionInfo;
  }
}

export function renderInteractionPrediction(
  direction: FlowDirection,
  recipe: DefiRecipe,
  amount: Amount,
  bridgeCallData: BridgeCallData | undefined,
) {
  const interaction = toInteraction(direction, recipe, amount.baseUnits, bridgeCallData);
  if (!interaction) return;
  const useInteractionPrediction = getInteractionPredictionInfoHook(direction, recipe);
  if (!useInteractionPrediction) return;
  return (
    <InteractionPrediction
      useInteractionPredictionInfo={useInteractionPrediction}
      recipe={recipe}
      interaction={interaction}
    />
  );
}

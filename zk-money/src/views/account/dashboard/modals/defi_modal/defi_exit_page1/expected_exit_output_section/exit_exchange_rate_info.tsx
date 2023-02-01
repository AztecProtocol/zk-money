import type { DefiRecipe } from '../../../../../../../alt-model/defi/types.js';
import { useExpectedOutput } from '../../../../../../../alt-model/defi/defi_info_hooks.js';
import { useAmount } from '../../../../../../../alt-model/asset_hooks.js';
import { InteractiveTooltip } from '../../../../../../../ui-components/index.js';
import { Amount } from '../../../../../../../alt-model/assets/index.js';
import { useAmountBulkPrice } from '../../../../../../../alt-model/index.js';
import { formatBulkPrice } from '../../../../../../../app/index.js';
import style from './exit_exchange_rate_info.module.css';

interface ExitExchangeRateInfoProps {
  recipe: DefiRecipe;
  auxData?: bigint;
}

export function ExitExchangeRateInfo(props: ExitExchangeRateInfoProps) {
  const { flow } = props.recipe;
  if (flow.type !== 'closable') {
    throw new Error("Can't calculate exit exchange rate for non-closable recipe.");
  }
  const unitOfInput = Amount.from('1', flow.exit.outDisplayed);
  const expectedOutput = useExpectedOutput(props.recipe.id, 'exit', props.auxData, unitOfInput.baseUnits);
  const expectedOutputAmount = useAmount(expectedOutput?.outputValueA);
  const expectedOutputBulkPrice = useAmountBulkPrice(expectedOutputAmount);

  if (expectedOutputAmount === undefined || expectedOutputBulkPrice === undefined) return <></>;
  const exchangeStr = `${unitOfInput.format({ layer: 'L1' })} = ${expectedOutputAmount.format({
    layer: 'L1',
    uniform: true,
  })} `;
  return (
    <div className={style.root}>
      {exchangeStr}
      <span className={style.price}> (${formatBulkPrice(expectedOutputBulkPrice)})</span>
      <InteractiveTooltip
        content={<p>Prices are fetched live. Final settlement price may differ based on rollup latency.</p>}
      />
    </div>
  );
}

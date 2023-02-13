import type { Amount } from '../../../alt-model/assets/index.js';
import type {
  DefiPosition,
  DefiPosition_Interactable,
  DefiPosition_NonInteractable,
} from '../../../alt-model/defi/open_position_hooks.js';
import { useInteractionPresentValue } from '../../../alt-model/defi/defi_info_hooks.js';
import { useAmount } from '../../../alt-model/top_level_context/index.js';
import { ShieldedAssetIcon } from '../../shielded_asset_icon.js';
import { UserDefiInteractionResultState, UserDefiTx } from '@aztec/sdk';
import { SkeletonRect } from '../../../ui-components/index.js';
import style from './defi_investment_value_fields.module.scss';

function ValueField({ amount }: { amount?: Amount }) {
  if (!amount) return <SkeletonRect sizingContent="XXX 1.000000 zkETH" />;
  return (
    <>
      <ShieldedAssetIcon className={style.icon} size="s" asset={amount.info} />
      {amount.format({ uniform: true })}
    </>
  );
}

function DepositValueField({ tx }: { tx: UserDefiTx }) {
  const amount = useAmount(tx.depositValue);
  return <ValueField amount={amount} />;
}

function OutputValueField({ tx }: { tx: UserDefiTx }) {
  const amount = useAmount(tx.interactionResult.outputValueA);
  return <ValueField amount={amount} />;
}

function DefaultClosableValueField({ position }: { position: DefiPosition_Interactable }) {
  const amount = useAmount(position.handleValue);
  return <ValueField amount={amount} />;
}

function InteractionPresentValueField({ position }: { position: DefiPosition_NonInteractable }) {
  const values = useInteractionPresentValue(position.recipe, position.tx);
  const amount0 = useAmount(values?.[0]);
  const amount1 = useAmount(values?.[1]);
  return (
    <>
      <ValueField amount={amount0} />
      {amount1 && <ValueField amount={amount1} />}
    </>
  );
}

function renderAsyncValue(position: DefiPosition_NonInteractable) {
  switch (position.tx.interactionResult.state) {
    case UserDefiInteractionResultState.PENDING:
      return <DepositValueField tx={position.tx} />;
    case UserDefiInteractionResultState.AWAITING_FINALISATION:
    case UserDefiInteractionResultState.AWAITING_SETTLEMENT:
      return <InteractionPresentValueField position={position} />;
    case UserDefiInteractionResultState.SETTLED: // Not shown
  }
}

function renderSync(position: DefiPosition_NonInteractable) {
  switch (position.tx.interactionResult.state) {
    case UserDefiInteractionResultState.PENDING:
      return <DepositValueField tx={position.tx} />;
    case UserDefiInteractionResultState.AWAITING_FINALISATION: // Never happens
    case UserDefiInteractionResultState.AWAITING_SETTLEMENT:
      return <OutputValueField tx={position.tx} />;
    case UserDefiInteractionResultState.SETTLED: // Not shown
  }
}

export function renderValueField(position: DefiPosition) {
  switch (position.type) {
    case 'async':
      return renderAsyncValue(position);
    case 'sync-entering':
    case 'sync-exiting':
      return renderSync(position);
    case 'sync-open':
      return (
        position.recipe.renderCustomClosableValueField?.(position) ?? <DefaultClosableValueField position={position} />
      );
  }
}

import { Amount } from '../../../alt-model/assets/index.js';
import { TouchedFormFields } from '../../../alt-model/form_fields_hooks.js';
import { getAssetPreferredFractionalDigits } from '../../../alt-model/known_assets/known_asset_display_data.js';
import { assetIsSupportedForShielding } from '../../../alt-model/shield/shieldable_assets.js';
import { DefiFormValidationResult, DefiFormFields } from './defi_form_validation.js';

function getAmountInputFeedback(result: DefiFormValidationResult, touched: boolean) {
  if (!touched) return;
  if (result.noAmount) {
    return `Amount must be non-zero`;
  }
  if (result.beyondTransactionLimit) {
    const { transactionLimit } = result.input;
    const txLimitAmount = result.targetDepositAmount?.withBaseUnits(transactionLimit ?? 0n);
    return `Transactions are capped at ${txLimitAmount?.format()}`;
  }
  if (result.insufficientTargetAssetBalance) {
    const required = result.requiredInputInTargetAssetCoveringCosts;
    const balance = result.input.balanceInDisplayedInputAsset;
    const asset = result.input.displayedInputAsset;
    const requiredAmount = asset && required !== undefined ? new Amount(required, asset) : undefined;
    const balanceAmount = asset && balance !== undefined ? new Amount(balance, asset) : undefined;
    if (!requiredAmount || !balanceAmount) {
      console.error("Couldn't correctly form feedback string for defi form issue named insufficientTargetAssetBalance");
    }
    const requiredStr = `Transaction requires ${requiredAmount?.format()}. You have ${balanceAmount?.format()} available.`;
    if (assetIsSupportedForShielding(asset?.address)) {
      return requiredStr + ` Please shield more ${asset?.symbol}.`;
    } else {
      return requiredStr;
    }
  }
  if (result.precisionIsTooHigh) {
    const digits = getAssetPreferredFractionalDigits(result.input.displayedInputAsset.label);
    return `Please enter no more than ${digits} decimal places.`;
  }
}

function getFooterFeedback(result: DefiFormValidationResult) {
  if (result.insufficientFeePayingAssetBalance) {
    const fee = result.input.feeAmount;
    return `You do not have enough zk${fee?.info.symbol} to pay the fee. Please shield at least ${fee?.format({
      layer: 'L1',
    })}.`;
  }
  if (result.cannotBatchForCustomAuxData) {
    return 'No batches exist for this setting. Either pay for a faster transaction or clear any customised settings under ⚙.';
  }
}

export function getDefiFormFeedback(
  result: DefiFormValidationResult,
  touchedFields: TouchedFormFields<DefiFormFields>,
  attemptedLock: boolean,
) {
  return {
    amount: getAmountInputFeedback(result, touchedFields.amountStrOrMax || attemptedLock),
    footer: getFooterFeedback(result),
  };
}

export type DefiFormFeedback = ReturnType<typeof getDefiFormFeedback>;

import { DefiSettlementTime, BridgeCallData, AssetValue } from '@aztec/sdk';
import type { AmountFactory } from '../../assets/amount_factory.js';
import type { DefiComposerPayload } from './defi_composer.js';
import type { RemoteAsset } from '../../types.js';
import { Amount } from '../../assets/index.js';
import { StrOrMax } from '../../forms/constants.js';
import { getPrecisionIsTooHigh } from '../../forms/helpers.js';
import { AuxDataCustomisationState } from '../types.js';

export interface DefiFormFields {
  amountStrOrMax: StrOrMax;
  speed: DefiSettlementTime;
  auxDataCustomisationState: AuxDataCustomisationState;
}

interface DefiFormValidationInput {
  fields: DefiFormFields;
  amountFactory?: AmountFactory;
  displayedInputAsset: RemoteAsset;
  balanceInDisplayedInputAsset?: bigint;
  maxOutput: bigint;
  targetDepositAmount: Amount;
  feeAmount?: Amount;
  feeAmounts?: (Amount | undefined)[];
  balanceInFeePayingAsset?: bigint;
  transactionLimit?: bigint;
  maxChainableDefiDeposit?: AssetValue;
  bridgeCallData?: BridgeCallData;
  auxDataIsCustomised: boolean;
}

export interface DefiFormValidationResult {
  loading?: boolean;
  unrecognisedTargetAmount?: boolean;
  feeAmounts?: (Amount | undefined)[];
  requiredInputInTargetAssetCoveringCosts?: bigint;
  insufficientTargetAssetBalance?: boolean;
  insufficientFeePayingAssetBalance?: boolean;
  beyondTransactionLimit?: boolean;
  noAmount?: boolean;
  precisionIsTooHigh?: boolean;
  cannotBatchForCustomAuxData?: boolean;
  isValid?: boolean;
  validPayload?: DefiComposerPayload;
  maxOutput?: bigint;
  targetDepositAmount?: Amount;
  input: DefiFormValidationInput;
}

export function validateDefiForm(input: DefiFormValidationInput): DefiFormValidationResult {
  const {
    fields,
    amountFactory,
    displayedInputAsset,
    balanceInDisplayedInputAsset,
    maxOutput,
    targetDepositAmount,
    feeAmount,
    feeAmounts,
    balanceInFeePayingAsset,
    transactionLimit,
    maxChainableDefiDeposit,
    auxDataIsCustomised,
  } = input;
  if (
    !amountFactory ||
    !feeAmount ||
    balanceInDisplayedInputAsset === undefined ||
    balanceInFeePayingAsset === undefined ||
    !maxChainableDefiDeposit
  ) {
    return { loading: true, input };
  }
  if (transactionLimit === undefined) {
    return { unrecognisedTargetAmount: true, input };
  }

  // If the target asset isn't used for paying the fee, we don't need to reserve funds for it.
  // For completeness we should also check whether inputAssetB is fee paying, but since we
  // don't currently support any such bridges, the extra complexity it would introduce isn't
  // yet worthwhile.
  const targetAssetIsPayingFee = displayedInputAsset.id === feeAmount.id;
  const feeInTargetAsset = targetAssetIsPayingFee ? feeAmount.baseUnits : 0n;

  const requiredInputInTargetAssetCoveringCosts = targetDepositAmount.baseUnits + feeInTargetAsset;

  const beyondTransactionLimit = targetDepositAmount.baseUnits > transactionLimit;
  const noAmount = targetDepositAmount.baseUnits <= 0n;
  const insufficientTargetAssetBalance = balanceInDisplayedInputAsset < requiredInputInTargetAssetCoveringCosts;
  const insufficientFeePayingAssetBalance = balanceInFeePayingAsset < feeAmount.baseUnits;

  const precisionIsTooHigh = getPrecisionIsTooHigh(targetDepositAmount);

  const cannotBatchForCustomAuxData = auxDataIsCustomised && fields.speed === DefiSettlementTime.DEADLINE;

  const isValid =
    !insufficientTargetAssetBalance &&
    !insufficientFeePayingAssetBalance &&
    !beyondTransactionLimit &&
    !noAmount &&
    !precisionIsTooHigh &&
    !cannotBatchForCustomAuxData;
  const validPayload = isValid ? { targetDepositAmount, feeAmount } : undefined;

  return {
    insufficientTargetAssetBalance,
    insufficientFeePayingAssetBalance,
    beyondTransactionLimit,
    noAmount,
    precisionIsTooHigh,
    cannotBatchForCustomAuxData,
    isValid,
    validPayload,
    maxOutput,
    input,
    feeAmounts,
    requiredInputInTargetAssetCoveringCosts,
    targetDepositAmount,
  };
}

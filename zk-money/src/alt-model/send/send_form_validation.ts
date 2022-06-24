import { ProofId, TxSettlementTime, UserTx } from '@aztec/sdk';
import { Amount } from 'alt-model/assets';
import { AmountFactory } from 'alt-model/assets/amount_factory';
import { StrOrMax } from 'alt-model/forms/constants';
import { amountFromStrOrMaxRoundedDown, getPrecisionIsTooHigh } from 'alt-model/forms/helpers';
import { RemoteAsset } from 'alt-model/types';
import { max, min } from 'app';
import { Recipient, SendComposerPayload } from './send_form_composer';
import { SendMode } from './send_mode';

export interface SendFormFields {
  amountStrOrMax: StrOrMax;
  speed: TxSettlementTime;
  recipientStr: string;
  assetId: number;
  sendMode: SendMode;
}

interface SendFormValidationInput {
  fields: SendFormFields;
  amountFactory?: AmountFactory;
  asset: RemoteAsset;
  balanceInTargetAsset?: bigint;
  feeAmount?: Amount;
  feeAmounts?: (Amount | undefined)[];
  balanceInFeePayingAsset?: bigint;
  transactionLimit?: bigint;
  recipient?: Recipient;
  aliasIsValid?: boolean;
  isLoadingRecipient: boolean;
  userTxs?: UserTx[];
}

export interface SendFormDerivedData extends Omit<SendFormValidationInput, 'fields'> {
  fields: SendFormFields;
  validComposerPayload?: SendComposerPayload;
  targetAmount?: Amount;
  maxOutput?: bigint;
  requiredInputInTargetAssetCoveringCosts?: bigint;
}

interface SendFormValidationResultIssues {
  noAmount?: boolean;
  insufficientTargetAssetBalance?: boolean;
  insufficientFeePayingAssetBalance?: boolean;
  beyondTransactionLimit?: boolean;
  unrecognisedTargetAmount?: boolean;
  precisionIsTooHigh?: boolean;
  hasDepositedFromL1AddressBefore?: boolean;
  hasWithdrawnToL1AddressBefore?: boolean;
}

export interface SendFormValidationResult {
  state: SendFormDerivedData;
  issues?: SendFormValidationResultIssues;
  isValid?: boolean;
  isLoading?: boolean;
}

export function validateSendForm(input: SendFormValidationInput): SendFormValidationResult {
  const {
    fields,
    amountFactory,
    balanceInTargetAsset,
    feeAmount,
    balanceInFeePayingAsset,
    transactionLimit,
    asset,
    recipient,
    isLoadingRecipient,
    userTxs,
  } = input;
  if (!amountFactory || !feeAmount || balanceInTargetAsset === undefined || balanceInFeePayingAsset === undefined) {
    return { isLoading: true, state: { ...input } };
  }
  if (transactionLimit === undefined) {
    return { issues: { unrecognisedTargetAmount: true }, state: { ...input } };
  }

  // If the target asset isn't used for paying the fee, we don't need to reserve funds for it
  const targetAssetIsPayingFee = fields.assetId === feeAmount.id;
  const feeInTargetAsset = targetAssetIsPayingFee ? feeAmount.baseUnits : 0n;

  const maxOutput = max(min(balanceInTargetAsset - feeInTargetAsset, transactionLimit), 0n);
  const targetAmount = amountFromStrOrMaxRoundedDown(fields.amountStrOrMax, maxOutput, asset);

  const requiredInputInTargetAssetCoveringCosts = targetAmount.baseUnits + feeInTargetAsset;

  const beyondTransactionLimit = targetAmount.baseUnits > transactionLimit;
  const noAmount = targetAmount.baseUnits <= 0n;
  const insufficientTargetAssetBalance = balanceInTargetAsset < requiredInputInTargetAssetCoveringCosts;
  const insufficientFeePayingAssetBalance = balanceInFeePayingAsset < feeAmount.baseUnits;
  const invalidRecipient = !isLoadingRecipient && !recipient;

  const precisionIsTooHigh = getPrecisionIsTooHigh(targetAmount);

  const hasDepositedFromL1AddressBefore =
    recipient?.sendMode === SendMode.WIDTHDRAW &&
    userTxs?.some(tx => tx.proofId === ProofId.DEPOSIT && tx.publicOwner?.equals(recipient.address));
  const hasWithdrawnToL1AddressBefore =
    recipient?.sendMode === SendMode.WIDTHDRAW &&
    userTxs?.some(tx => tx.proofId === ProofId.WITHDRAW && tx.publicOwner?.equals(recipient.address));

  const isInvalid =
    insufficientTargetAssetBalance ||
    insufficientFeePayingAssetBalance ||
    beyondTransactionLimit ||
    noAmount ||
    precisionIsTooHigh ||
    invalidRecipient;
  const isValid = !isInvalid;
  const validComposerPayload = isValid && recipient ? { targetAmount, feeAmount, recipient } : undefined;

  return {
    issues: {
      insufficientTargetAssetBalance,
      insufficientFeePayingAssetBalance,
      beyondTransactionLimit,
      noAmount,
      precisionIsTooHigh,
      hasDepositedFromL1AddressBefore,
      hasWithdrawnToL1AddressBefore,
    },
    state: {
      ...input,
      targetAmount,
      validComposerPayload,
      maxOutput,
      requiredInputInTargetAssetCoveringCosts,
    },
    isValid,
  };
}

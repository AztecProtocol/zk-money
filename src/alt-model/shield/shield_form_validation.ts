import type { AmountFactory } from '../assets/amount_factory.js';
import type { Network } from '../../app/networks.js';
import type { ShieldComposerPayload } from './shield_composer.js';
import type { EthAddress, GrumpkinAddress, TxSettlementTime } from '@aztec/sdk';
import type { RemoteAsset } from '../types.js';
import type { StrOrMax } from '../forms/constants.js';
import { max, min } from '../../app/index.js';
import { Amount } from '../assets/amount.js';
import { amountFromStrOrMaxRoundedDown, getPrecisionIsTooHigh } from '../forms/helpers.js';

export interface ShieldFormFields {
  assetId: number;
  amountStrOrMax: StrOrMax;
  recipientAlias: string;
  speed: TxSettlementTime;
}

interface ShieldFormValidationInputs {
  fields: ShieldFormFields;
  amountFactory?: AmountFactory;
  targetAsset: RemoteAsset;
  l1Balance?: bigint;
  l1PendingBalance?: bigint;
  approveProofGasCost?: bigint;
  depositFundsGasCost?: bigint;
  feeAmount?: Amount;
  feeAmounts?: (Amount | undefined)[];
  signerAddress?: EthAddress;
  balanceInFeePayingAsset?: bigint;
  transactionLimit?: bigint;
  depositor?: EthAddress;
  recipientUserId?: GrumpkinAddress;
  isLoadingRecipientUserId: boolean;
  currentNetwork?: Network;
  requiredNetwork: Network;
}

export interface ShieldFormValidationResult {
  noWalletConnected?: boolean;
  wrongNetwork?: boolean;
  loading?: boolean;
  unrecognisedTargetAmount?: boolean;
  targetAssetIsPayingFee?: boolean;
  insufficientTargetAssetBalance?: boolean;
  mustDepositFromWalletAccountUsedToGenerateAztecKeys?: boolean;
  insufficientFeePayingAssetBalance?: boolean;
  mustAllowForFee?: boolean;
  mustAllowForGas?: boolean;
  requiresSpendingKey?: boolean;
  beyondTransactionLimit?: boolean;
  noAmount?: boolean;
  precisionIsTooHigh?: boolean;
  isValid?: boolean;
  isValidReasonString?: string;
  validPayload?: ShieldComposerPayload;
  maxL2Output?: bigint;
  targetL2OutputAmount?: Amount;
  reservedForL1GasIfTargetAssetIsEth?: bigint;
  requiredL1InputCoveringCosts?: bigint;
  hasPendingBalance?: boolean;
  input: ShieldFormValidationInputs;
}

export function validateShieldForm(input: ShieldFormValidationInputs): ShieldFormValidationResult {
  const {
    fields,
    amountFactory,
    targetAsset,
    l1Balance,
    l1PendingBalance,
    approveProofGasCost,
    depositFundsGasCost,
    signerAddress,
    feeAmount,
    balanceInFeePayingAsset,
    transactionLimit,
    depositor,
    recipientUserId,
    isLoadingRecipientUserId,
    currentNetwork,
    requiredNetwork,
  } = input;
  if (!depositor) {
    return { noWalletConnected: true, input };
  }
  if (currentNetwork?.chainId !== requiredNetwork.chainId) {
    return { wrongNetwork: true, input };
  }
  if (
    !amountFactory ||
    !feeAmount ||
    l1Balance === undefined ||
    l1PendingBalance === undefined ||
    !signerAddress ||
    approveProofGasCost === undefined ||
    depositFundsGasCost === undefined ||
    balanceInFeePayingAsset === undefined
  ) {
    return { loading: true, input };
  }
  if (!targetAsset || transactionLimit === undefined) {
    return { unrecognisedTargetAmount: true, input };
  }

  // Keep track of exactly how the form failed
  let isValid = true;
  let isValidReasonString = '';

  // If the target asset isn't used for paying the fee, we don't need to reserve funds for it
  const targetAssetIsPayingFee = fields.assetId === feeAmount.id;
  // const feeInTargetAsset = targetAssetIsPayingFee ? feeAmount.baseUnits : 0n;

  const requiresSpendingKey = !targetAssetIsPayingFee;
  if (requiresSpendingKey && !signerAddress.equals(depositor)) {
    return { mustDepositFromWalletAccountUsedToGenerateAztecKeys: true, targetAssetIsPayingFee, input };
  }

  // If it's ETH being shielded, we need to reserve funds for gas costs
  const isEth = targetAsset.id === 0;
  // const reservedForL1GasIfTargetAssetIsEth = isEth ? approveProofGasCost + depositFundsGasCost : 0n;
  // NOTE: This is currently hardcoded to zero as users cannot actually deposit right now
  const reservedForL1GasIfTargetAssetIsEth = 0n;

  // Some value may already be deposited, and will be used first
  const hasPendingBalance = l1PendingBalance > 0n;
  const totalL1Balance = l1Balance + l1PendingBalance;

  // Accounting for both L1 gas and L2 fees
  // const totalCost = feeInTargetAsset + reservedForL1GasIfTargetAssetIsEth;
  // NOTE: hardcoded to 0 as there are no costs to withdraw
  const totalCost = 0n;

  const maxL2Output = max(min(totalL1Balance - totalCost, transactionLimit), 0n);
  const targetL2OutputAmount = amountFromStrOrMaxRoundedDown(fields.amountStrOrMax, maxL2Output, targetAsset);

  const requiredL1InputIfThereWereNoCosts = targetL2OutputAmount.baseUnits - l1PendingBalance;
  const requiredL1InputCoveringCosts = requiredL1InputIfThereWereNoCosts + totalCost;

  // Check if we are beyond the transaction limit
  const beyondTransactionLimit = targetL2OutputAmount.baseUnits > maxL2Output;
  if (beyondTransactionLimit) {
    isValid = false;
    isValidReasonString =
      'beyondTransactionLimit, maxL2Output: ' +
      maxL2Output.toString() +
      ' targetL2OutputAmount: ' +
      targetL2OutputAmount.baseUnits.toString();
  }

  // Check if the user has entered an amount
  const noAmount = targetL2OutputAmount.baseUnits <= 0n;
  if (noAmount) {
    isValid = false;
    isValidReasonString = 'noAmount';
  }

  // Check if the target balance is too small
  const insufficientTargetAssetBalance = l1Balance < requiredL1InputCoveringCosts;
  if (insufficientTargetAssetBalance) {
    isValid = false;
    isValidReasonString =
      'insufficientTargetAssetBalance, l1Balance: ' +
      l1Balance.toString() +
      ' requiredL1InputCoveringCosts: ' +
      requiredL1InputCoveringCosts.toString();
  }

  const insufficientFeePayingAssetBalance = !targetAssetIsPayingFee && balanceInFeePayingAsset < feeAmount.baseUnits;
  if (insufficientFeePayingAssetBalance) {
    isValid = false;
    isValidReasonString =
      'insufficientFeePayingAssetBalance, balanceInFeePayingAsset: ' +
      balanceInFeePayingAsset.toString() +
      ' feeAmount.baseUnits: ' +
      feeAmount.baseUnits.toString();
  }

  const couldShieldIfThereWereNoCosts =
    insufficientTargetAssetBalance && l1Balance >= requiredL1InputIfThereWereNoCosts;
  if (couldShieldIfThereWereNoCosts) {
    isValid = false;
    isValidReasonString =
      'couldShieldIfThereWereNoCosts, l1Balance: ' +
      l1Balance.toString() +
      ' requiredL1InputIfThereWereNoCosts: ' +
      requiredL1InputIfThereWereNoCosts.toString();
  }

  const mustAllowForFee = targetAssetIsPayingFee && couldShieldIfThereWereNoCosts;
  const mustAllowForGas = isEth && couldShieldIfThereWereNoCosts;

  const precisionIsTooHigh = getPrecisionIsTooHigh(targetL2OutputAmount);
  if (precisionIsTooHigh) {
    isValid = false;
    isValidReasonString = 'precisionIsTooHigh, targetL2OutputAmount: ' + targetL2OutputAmount.baseUnits.toString();
  }

  const aliasIsValid = !!recipientUserId && !isLoadingRecipientUserId;
  if (!aliasIsValid) {
    isValid = false;
    isValidReasonString =
      'aliasIsInValid, recipientUserId: ' + recipientUserId + ' isLoadingRecipientUserId: ' + isLoadingRecipientUserId;
  }

  const validPayload = isValid
    ? {
        targetOutput: targetL2OutputAmount,
        fee: feeAmount,
        settlementTime: fields.speed,
        depositor,
        recipientUserId,
      }
    : undefined;
  return {
    targetAssetIsPayingFee,
    insufficientTargetAssetBalance,
    insufficientFeePayingAssetBalance,
    mustAllowForFee,
    mustAllowForGas,
    requiresSpendingKey,
    beyondTransactionLimit,
    noAmount,
    precisionIsTooHigh,
    isValid,
    isValidReasonString,
    validPayload,
    input,
    maxL2Output,
    targetL2OutputAmount,
    reservedForL1GasIfTargetAssetIsEth,
    requiredL1InputCoveringCosts,
    hasPendingBalance,
  };
}

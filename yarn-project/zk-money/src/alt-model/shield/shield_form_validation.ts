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

  // If the target asset isn't used for paying the fee, we don't need to reserve funds for it
  const targetAssetIsPayingFee = fields.assetId === feeAmount.id;
  const feeInTargetAsset = targetAssetIsPayingFee ? feeAmount.baseUnits : 0n;

  const requiresSpendingKey = !targetAssetIsPayingFee;
  if (requiresSpendingKey && !signerAddress.equals(depositor)) {
    return { mustDepositFromWalletAccountUsedToGenerateAztecKeys: true, targetAssetIsPayingFee, input };
  }

  // If it's ETH being shielded, we need to reserve funds for gas costs
  const isEth = targetAsset.id === 0;
  const reservedForL1GasIfTargetAssetIsEth = isEth ? approveProofGasCost + depositFundsGasCost : 0n;

  // Some value may already be deposited, and will be used first
  const hasPendingBalance = l1PendingBalance > 0n;
  const totalL1Balance = l1Balance + l1PendingBalance;

  // Accounting for both L1 gas and L2 fees
  const totalCost = feeInTargetAsset + reservedForL1GasIfTargetAssetIsEth;

  const maxL2Output = max(min(totalL1Balance - totalCost, transactionLimit), 0n);
  const targetL2OutputAmount = amountFromStrOrMaxRoundedDown(fields.amountStrOrMax, maxL2Output, targetAsset);

  const requiredL1InputIfThereWereNoCosts = targetL2OutputAmount.baseUnits - l1PendingBalance;
  const requiredL1InputCoveringCosts = requiredL1InputIfThereWereNoCosts + totalCost;

  const beyondTransactionLimit = targetL2OutputAmount.baseUnits > transactionLimit;
  const noAmount = targetL2OutputAmount.baseUnits <= 0n;
  const insufficientTargetAssetBalance = l1Balance < requiredL1InputCoveringCosts;
  const insufficientFeePayingAssetBalance = !targetAssetIsPayingFee && balanceInFeePayingAsset < feeAmount.baseUnits;

  const couldShieldIfThereWereNoCosts =
    insufficientTargetAssetBalance && l1Balance >= requiredL1InputIfThereWereNoCosts;
  const mustAllowForFee = targetAssetIsPayingFee && couldShieldIfThereWereNoCosts;
  const mustAllowForGas = isEth && couldShieldIfThereWereNoCosts;

  const precisionIsTooHigh = getPrecisionIsTooHigh(targetL2OutputAmount);
  const aliasIsValid = !!recipientUserId && !isLoadingRecipientUserId;

  const isValid =
    !insufficientTargetAssetBalance &&
    !insufficientFeePayingAssetBalance &&
    !beyondTransactionLimit &&
    !noAmount &&
    !precisionIsTooHigh &&
    aliasIsValid;
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
    validPayload,
    input,
    maxL2Output,
    targetL2OutputAmount,
    reservedForL1GasIfTargetAssetIsEth,
    requiredL1InputCoveringCosts,
    hasPendingBalance,
  };
}

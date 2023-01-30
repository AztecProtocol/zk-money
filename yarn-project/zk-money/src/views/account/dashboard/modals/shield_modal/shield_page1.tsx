import { TxSettlementTime } from '@aztec/sdk';
import type {
  ShieldFormFeedback,
  ShieldFormFields,
  ShieldFormValidationResult,
} from '../../../../../alt-model/shield/index.js';
import type { StrOrMax } from '../../../../../alt-model/forms/constants.js';
import { TxGasSection, RecipientSection } from '../../../../../views/account/dashboard/modals/sections/index.js';
import { TransactionSettlementTimeInformationSection } from '../sections/settlement_time_information_section/index.js';
import { SplitSection } from '../sections/split_section/index.js';
import { ShieldPrivacySection } from './shield_privacy_section/index.js';
import { FooterSection } from '../sections/footer_section/index.js';
import { AmountSelection } from '../../../../../components/index.js';
import { useAccountStateManager } from '../../../../../alt-model/top_level_context/index.js';
import { useObs } from '../../../../../app/util/index.js';
import { bindStyle, Loader, LoaderSize } from '../../../../../ui-components/index.js';
import { Amount } from '../../../../../alt-model/assets/amount.js';
import style from './shield.module.scss';

const cx = bindStyle(style);

interface ShieldPage1Props {
  fields: ShieldFormFields;
  feedback: ShieldFormFeedback;
  attemptedLock: boolean;
  validationResult: ShieldFormValidationResult;
  onNext(): void;
  onChangeAmountStrOrMax(value: StrOrMax): void;
  onChangeRecipientAlias(value: string): void;
  onChangeSpeed(speed: TxSettlementTime): void;
  onChangeAsset(asset: number): void;
}

function getRecipientMessage(isShieldingToHimself: boolean) {
  return isShieldingToHimself ? 'You will be the recipient of this transaction.' : '';
}

export function ShieldPage1({
  fields,
  feedback,
  validationResult,
  attemptedLock,
  onNext,
  onChangeAmountStrOrMax,
  onChangeRecipientAlias,
  onChangeSpeed,
  onChangeAsset,
}: ShieldPage1Props) {
  const asset = validationResult.input.targetAsset;
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);

  if (!asset) {
    return <>Loading...</>;
  }

  function handleUsePendingFunds() {
    if (!validationResult.input?.l1PendingBalance) return;
    const pendingAmount = new Amount(validationResult.input.l1PendingBalance, validationResult.input.targetAsset);
    if (!pendingAmount || fields.speed === null || !validationResult.input.feeAmount) return;
    const pendingAmountMinusFee = pendingAmount.subtract(validationResult.input.feeAmount?.baseUnits);
    const amountStr = pendingAmountMinusFee.format({
      layer: 'L1',
      uniform: true,
      hideSymbol: true,
      hideComma: true,
    });
    onChangeAmountStrOrMax(amountStr);
  }

  let footerFeedback: React.ReactNode = `${feedback.walletAccount ? feedback.walletAccount + '. ' : ''}${
    feedback.footer || ''
  }`;

  if (!footerFeedback) {
    footerFeedback = feedback.pendingFunds ? (
      <span>
        {feedback.pendingFunds}{' '}
        <span onClick={handleUsePendingFunds} className={style.usePendingFunds}>
          Click here to use it.
        </span>
      </span>
    ) : (
      ''
    );
  }

  const recipientWasFound = !!validationResult.input.recipientUserId;
  const recipientAddress = validationResult.input.recipientUserId?.toString();
  const isShieldingToHimself = recipientAddress === accountState?.userId.toString();

  return (
    <div className={style.contentWrapper}>
      {attemptedLock && <Loader size={LoaderSize.ExtraLarge} className={style.loader} />}
      <SplitSection
        className={cx(attemptedLock && style.isLoading)}
        leftPanel={
          <>
            <RecipientSection
              recipientType="L2"
              recipientStr={fields.recipientAlias}
              message={getRecipientMessage(isShieldingToHimself)}
              isLoading={validationResult.input.isLoadingRecipientUserId}
              isValid={recipientWasFound}
              onChangeValue={onChangeRecipientAlias}
            />
            <AmountSelection
              maxAmount={validationResult.maxL2Output ?? 0n}
              asset={asset}
              feeAmount={validationResult.input.feeAmounts?.[fields.speed]}
              amountStringOrMax={fields.amountStrOrMax}
              allowAssetSelection={true}
              allowWalletSelection={true}
              onChangeAsset={onChangeAsset}
              onChangeAmountStringOrMax={onChangeAmountStrOrMax}
              message={feedback.amount}
              balanceType="L1"
            />
          </>
        }
        rightPanel={<ShieldPrivacySection />}
      />
      <SplitSection
        className={cx(attemptedLock && style.isLoading)}
        leftPanel={
          <TxGasSection
            balanceType={validationResult.targetAssetIsPayingFee ? 'L1' : 'L2'}
            speed={fields.speed}
            onChangeSpeed={onChangeSpeed}
            asset={asset}
            feeAmounts={validationResult.input.feeAmounts}
            targetAssetIsErc20={asset.id !== 0}
          />
        }
        rightPanel={<TransactionSettlementTimeInformationSection selectedSpeed={fields.speed} />}
      />
      <FooterSection onNext={onNext} nextDisabled={!validationResult.isValid} feedback={footerFeedback} />
    </div>
  );
}

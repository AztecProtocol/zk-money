import React, { useState } from 'react';
import styled from 'styled-components/macro';
import {
  ShieldFormValues,
  ShieldStatus,
  formatBaseUnits,
  isValidForm,
  ProviderState,
  WalletId,
  MessageType,
} from '../../app';
import {
  Button,
  Checkbox,
  DisclaimerBlock,
  Input,
  InputCol,
  InputMessage,
  InputRow,
  InputTheme,
  InputWrapper,
  PaddedBlock,
  ShieldedAssetIcon,
  Text,
  TextButton,
} from '../../components';
import { borderRadiuses, breakpoints, spacings } from '../../styles';
import { WalletSelect } from '../account/wallet_select';
import { formatTime } from '../account/settled_time';
import { Progress } from './progress';
import { useRemoteAssetForId } from 'alt-model/top_level_context';
import { getAssetPreferredFractionalDigits } from 'alt-model/known_assets/known_asset_display_data';

const ProgressRoot = styled.div`
  position: relative;
`;

const RetryButtonWrapper = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  transform: translateY(100%);
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: ${spacings.m};
`;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const Cols = styled.div`
  display: grid;
  width: 100%;
  height: 180px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  grid-template-columns: 3fr 2fr;
  gap: ${spacings.s};

  @media (max-width: ${breakpoints.m}) {
    grid-template-columns: 1fr;
    justify-items: center;
  }
`;

const ConfirmRoot = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding-top: 25px;
`;

const InputPaddedBlock = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 420px;
  padding: ${spacings.m} 0 ${spacings.l};
`;

const DisclaimerPaddedBlock = styled(PaddedBlock)`
  width: 100%;
`;

const FieldTitleRoot = styled.div`
  display: flex;
  justify-content: space-between;
  padding-bottom: ${spacings.xs};
  width: 100%;
`;

const FieldInputWrapper = styled(InputWrapper)`
  align-items: stretch;
  width: 100%;
`;

const AmountAssetIconRoot = styled.div`
  display: flex;
  align-items: center;
  padding-left: ${spacings.s};
`;

const AmountMessageRoot = styled.div`
  position: absolute;
  bottom: 0;
  transform: translateY(100%);
`;

const MaxButton = styled.div`
  display: flex;
  align-items: center;
  padding: 0 ${spacings.m};
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0 ${borderRadiuses.s} ${borderRadiuses.s} 0;
  cursor: pointer;
`;

const ButtonRoot = styled(InputCol)`
  flex-shrink: 0;
  width: auto;
`;

const getAmountInputMessageProps = (form: ShieldFormValues, signerAddress?: string) => {
  const { amount, ethAccount, fees, speed, assetState } = form;

  const addressMismatchMessage =
    signerAddress !== ethAccount.value.ethAddress?.toString()
      ? ' \nWarning: you are shielding from a different address than the one used for registering.'
      : '';

  if (amount.message) {
    return { message: `${amount.message}${addressMismatchMessage}`, type: amount.messageType };
  }

  const { pendingBalance } = ethAccount.value;
  const txFee = fees.value[speed.value];
  if (pendingBalance > txFee.fee) {
    const { asset } = assetState.value;

    return {
      message: `You have ${formatBaseUnits(pendingBalance - txFee.fee, asset.decimals, {
        precision: getAssetPreferredFractionalDigits(asset.address),
        commaSeparated: true,
      })} ${asset.symbol} pending on the contract, this will be used first.${addressMismatchMessage}`,
      type: MessageType.TEXT,
    };
  }
};

interface DepositFormProps {
  form: ShieldFormValues;
  providerState?: ProviderState;
  signerAddress?: string;
  onChangeInputs(inputs: Partial<ShieldFormValues>): void;
  onSubmit(isRetry?: boolean): void;
  onChangeWallet(walletId: WalletId): void;
}

export const ShieldForAliasForm: React.FunctionComponent<DepositFormProps> = ({
  providerState,
  form,
  signerAddress,
  onChangeInputs,
  onSubmit,
  onChangeWallet,
}) => {
  const [risksAccepted, setRisksAccepted] = useState(false);
  const {
    submit, // eslint-disable-line @typescript-eslint/no-unused-vars
    ...formInputs
  } = form;
  const {
    assetState: { value: assetState },
    amount,
    maxAmount,
    fees,
    speed,
    ethAccount,
    status: { value: status },
  } = formInputs;
  const asset = useRemoteAssetForId(assetState.asset.id);
  if (!asset) return <></>;

  const submissionSteps = [
    {
      step: ShieldStatus.CREATE_PROOF,
      title: 'Create Shield Proof',
    },
    {
      step: ShieldStatus.DEPOSIT,
      title: `Deposit ${asset.symbol}`,
    },
    {
      step: ShieldStatus.APPROVE_PROOF,
      title: 'Approve Shield Proof',
    },
    {
      step: ShieldStatus.SEND_PROOF,
      title: 'Send Shield and Registration Transaction',
    },
    {
      step: ShieldStatus.DONE,
      title: 'Initialise Account',
    },
  ];
  if (submissionSteps.find(x => x.step === status)) {
    const failed = submit.messageType === MessageType.ERROR;
    return (
      <ProgressRoot>
        <Progress steps={submissionSteps} currentStep={status} active={!failed} failed={failed} />
        {failed && (
          <RetryButtonWrapper>
            <TextButton text="Retry" onClick={() => onSubmit(true)} />
          </RetryButtonWrapper>
        )}
      </ProgressRoot>
    );
  }

  const amountInputMessageProps = getAmountInputMessageProps(form, signerAddress);
  const txFee = fees.value[speed.value];

  return (
    <Root>
      <Cols>
        <InputPaddedBlock>
          <FieldTitleRoot>
            Amount
            <WalletSelect
              asset={asset}
              providerState={providerState}
              ethAccount={ethAccount.value}
              message={ethAccount.message}
              comparisonAddress={signerAddress}
              messageType={ethAccount.messageType}
              onChangeWallet={onChangeWallet}
            />
          </FieldTitleRoot>
          <FieldInputWrapper theme={InputTheme.LIGHT}>
            <AmountAssetIconRoot>
              <ShieldedAssetIcon asset={asset} size="m" white />
            </AmountAssetIconRoot>
            <Input
              theme={InputTheme.LIGHT}
              value={amount.value}
              onChangeValue={value => onChangeInputs({ amount: { value } })}
            />
            <MaxButton
              onClick={() =>
                onChangeInputs({
                  amount: {
                    value: formatBaseUnits(maxAmount.value, asset.decimals, {
                      precision: getAssetPreferredFractionalDigits(asset.address),
                      floor: true,
                    }),
                  },
                })
              }
            >
              <Text text="MAX" size="xs" />
            </MaxButton>
            {amountInputMessageProps && (
              <AmountMessageRoot>
                <InputMessage theme={InputTheme.LIGHT} {...amountInputMessageProps} />
              </AmountMessageRoot>
            )}
          </FieldInputWrapper>
        </InputPaddedBlock>
        <InputPaddedBlock>
          <FieldTitleRoot>
            Fee
            <Text size="xs">{formatTime(txFee.time)}</Text>
          </FieldTitleRoot>
          <FieldInputWrapper theme={InputTheme.LIGHT}>
            <AmountAssetIconRoot>
              <ShieldedAssetIcon asset={asset} size="m" white />
            </AmountAssetIconRoot>
            <Input
              theme={InputTheme.LIGHT}
              value={formatBaseUnits(txFee.fee, asset.decimals, {
                precision: getAssetPreferredFractionalDigits(asset.address),
              })}
              disabled
            />
          </FieldInputWrapper>
        </InputPaddedBlock>
      </Cols>
      <DisclaimerPaddedBlock size="m">
        <DisclaimerBlock />
        <ConfirmRoot>
          <Checkbox
            text="I understand the risks"
            theme={InputTheme.LIGHT}
            checked={risksAccepted}
            onChangeValue={setRisksAccepted}
          />
        </ConfirmRoot>
      </DisclaimerPaddedBlock>
      <InputRow>
        <ButtonRoot>
          <Button
            theme="white"
            text="Shield"
            onClick={onSubmit}
            disabled={
              submit.value || !isValidForm(formInputs as any) || status > ShieldStatus.VALIDATE || !risksAccepted
            }
            isLoading={submit.value}
          />
        </ButtonRoot>
      </InputRow>
      {submit.message && <InputMessage theme={InputTheme.LIGHT} message={submit.message} type={submit.messageType} />}
    </Root>
  );
};

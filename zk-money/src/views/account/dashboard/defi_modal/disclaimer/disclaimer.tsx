import { Asset, fromBaseUnits } from '../../../../../app';
import { Checkbox, Spacer, Text } from '../../../../../components';
import style from './disclaimer.module.css';

interface DisclaimerProps {
  maxAmount: bigint;
  asset: Asset;
  accepted: boolean;
  onChangeAccepted: (accepted: boolean) => void;
}

export function Disclaimer({ maxAmount, asset, accepted, onChangeAccepted }: DisclaimerProps) {
  return (
    <div className={style.root}>
      <div className={style.header}>
        <Text text="Disclaimer" />
        <div className={style.icon} />
      </div>
      <Spacer size="m" />
      <div>
        <Text
          inline
          size="s"
          text={`This is experimental software that hasn’t yet been externally audited. Your private key is stored in the browser, for security amounts are capped at ${fromBaseUnits(
            maxAmount,
            asset.decimals,
          )} ${asset.symbol}. `}
        />
        <Text size="s" inline italic text="Use at your own risk" />
      </div>
      <Spacer size="m" />
      <div className={style.checkboxRow}>
        <Text size="s" text="I understand the risks" />
        <Checkbox checked={accepted} onChangeValue={onChangeAccepted} />
      </div>
    </div>
  );
}

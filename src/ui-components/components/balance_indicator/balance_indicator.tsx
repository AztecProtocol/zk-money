import { bindStyle } from '../../util/classnames.js';
import walletIcon from '../../images/wallet_switcher.svg';
import style from './balance_indicator.module.scss';
const cx = bindStyle(style);

interface BalanceIndicatorProps {
  balance: string;
  disabled: boolean;
  onClick: () => void;
  onChangeWalletRequest?: () => void;
}

export function BalanceIndicator(props: BalanceIndicatorProps) {
  return (
    <>
      <div className={style.balanceIndicatorWrapper}>
        {props.onChangeWalletRequest && (
          <img
            className={cx(style.wallet, props.disabled && style.disabled)}
            src={walletIcon}
            alt="Change wallet"
            onClick={props.onChangeWalletRequest}
          />
        )}
        <div className={cx(style.text, props.disabled && style.disabled)}>Balance: {props.balance}</div>
      </div>
    </>
  );
}

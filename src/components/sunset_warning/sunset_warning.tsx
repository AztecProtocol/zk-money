import { FormWarning, Hyperlink } from '../../ui-components/index.js';
import style from './sunset_warning.module.scss';

export function SunsetWarning() {
  return (
    <FormWarning
      className={style.formWarning}
      text={
        <div className={style.text}>
          We are sunsetting zk.money. Deposits are now closed, and withdrawals will be enabled for one year.
          <br />
          You have until March 31st, 2024 to withdraw with no fees.{' '}
          <Hyperlink
            className={style.link}
            href="https://medium.com/aztec-protocol/sunsetting-aztec-connect-a786edce5cae"
            label={'Read our full announcement here.'}
          />
        </div>
      }
    />
  );
}

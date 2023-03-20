import { FormWarning, Hyperlink } from '../../ui-components/index.js';
import style from './sunset_warning.module.scss';

export function SunsetWarning() {
  return (
    <FormWarning
      className={style.formWarning}
      text={
        <div className={style.text}>
          As of March 13th, 2023, we are sunsetting zk.money.{' '}
          <b>Deposits will remain open until 14:00 UTC on Match 21st, 2023.</b>
          <br /> Withdrawals can be made normally until 21st March 2024. All user deposits will remain safe.{' '}
          <Hyperlink
            className={style.link}
            href="https://medium.com/aztec-protocol/sunsetting-aztec-connect-a786edce5cae"
            label={'Read our announcement here.'}
          />
        </div>
      }
    />
  );
}

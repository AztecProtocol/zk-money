import type { UserTx } from '@aztec/sdk';
import { TransactionTypeField } from './transaction_type_field.js';
import { TransactionTimeField } from './transaction_time_field.js';
import { renderTransactionValueField } from './transaction_value_field.js';
import { renderTransactionFeeField } from './transaction_fee_field.js';
import { bindStyle } from '../../../ui-components/util/classnames.js';
import style from './transaction_history_row.module.scss';

interface TransactionHistoryRowProps {
  tx: UserTx;
}

const cx = bindStyle(style);

export function TransactionHistoryRow({ tx }: TransactionHistoryRowProps) {
  const transactionFee = renderTransactionFeeField(tx);
  return (
    <div className={style.root}>
      <div className={cx(style.segment, style.firstSegment)}>
        <TransactionTypeField tx={tx} />
      </div>
      <div className={cx(style.segment, style.valueField)}>
        <div className={style.value}>{renderTransactionValueField(tx)}</div>
      </div>
      {transactionFee && (
        <div className={cx(style.segment, style.feeField)}>
          <div className={style.fee}>{renderTransactionFeeField(tx)}</div>
        </div>
      )}
      <div className={cx(style.segment, style.lastSegment)}>
        <div className={style.time}>
          <TransactionTimeField tx={tx} />
        </div>
      </div>
    </div>
  );
}

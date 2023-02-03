import download from '../../ui-components/images/download.svg';
import { ProofId, UserPaymentTx } from '@aztec/sdk';
import { useAccountStateManager, useSdk } from '../../alt-model/top_level_context/top_level_context_hooks.js';
import { useObs } from '../../app/util/index.js';
import { Button, ButtonSize, ButtonTheme, Section, SectionTitle } from '../../ui-components/index.js';
import { TransactionHistory } from './transaction_history.js';
import { useUserTxs } from '../../alt-model/user_tx_hooks.js';

export function TransactionHistorySection() {
  const sdk = useSdk();
  const txs = useUserTxs();
  const accountStateManager = useAccountStateManager();
  const accountState = useObs(accountStateManager.stateObs);

  async function getHistory() {
    if (!sdk || !txs || !accountState || !accountState.userId) return;

    const rows = [
      [
        'Ethereum Account',
        'Aztec Account Address',
        'Transaction ID',
        'Created',
        'Settled',
        'Transaction Type',
        'Asset ID',
        'Value',
        'Fee',
        'Is Sender?',
      ],
    ];
    txs.forEach(tx => {
      let txType = '',
        value = '',
        assetId = '',
        isSender = '',
        fee = '';
      switch (tx.proofId) {
        case ProofId.DEPOSIT:
          txType = 'Deposit';
          break;
        case ProofId.WITHDRAW:
          txType = 'Withdrawal';
          break;
        case ProofId.SEND:
          txType = 'Send';
          break;
        case ProofId.ACCOUNT:
          txType = 'Account';
          break;
        case ProofId.DEFI_DEPOSIT:
          txType = 'Defi Deposit';
          break;
        case ProofId.DEFI_CLAIM:
          txType = 'Defi Claim';
          break;
      }
      if (tx instanceof UserPaymentTx) {
        value = tx.value.value.toString();
        assetId = tx.value.assetId.toString();
        fee = tx.fee.value.toString();
        isSender = tx.isSender.toString();
      }

      rows.push([
        accountState.ethAddressUsedForAccountKey.toString(),
        tx.userId.toString(),
        tx.txId ? tx.txId.toString() : '-',
        tx.created ? tx.created.toISOString() : '-',
        tx.settled ? tx.settled.toISOString() : '-',
        txType,
        assetId,
        value,
        fee,
        isSender ? 'Yes' : 'No',
      ]);
    });
    const blob = new Blob([rows.map(e => e.join(',')).join('\n')], { type: 'csv' });
    const a = document.createElement('a');
    a.download = 'transaction_history.csv';
    a.href = window.URL.createObjectURL(blob);
    const clickEvt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true,
    });
    a.dispatchEvent(clickEvt);
    a.remove();
  }

  return (
    <Section>
      <SectionTitle
        label="Transaction History"
        sideComponent={
          <Button
            imageSrc={download}
            text="Download History"
            size={ButtonSize.Small}
            theme={ButtonTheme.Secondary}
            onClick={getHistory}
            disabled={!txs || txs.length === 0}
          />
        }
      />

      <TransactionHistory txs={txs} />
    </Section>
  );
}

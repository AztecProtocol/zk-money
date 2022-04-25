import { ProofId } from '@aztec/barretenberg/client_proofs';
import { AssetValue, JoinSplitTx } from '@aztec/sdk';
import { useEffect, useMemo, useState } from 'react';
import { listenAccountUpdated } from './event_utils';
import { useApp } from './app_context';
import { useProviderState } from './provider_hooks';
import { useSdk } from './top_level_context';

export function useBalance(assetId?: number) {
  const { accountId } = useApp();
  const sdk = useSdk();
  const [balance, setBalance] = useState(() => {
    if (sdk && accountId && assetId !== undefined) return BigInt(0);
  });
  useEffect(() => {
    if (sdk && accountId && assetId !== undefined) {
      const updateBalance = async () => setBalance(await sdk.getBalance(assetId, accountId));
      updateBalance();
      return listenAccountUpdated(sdk, accountId, updateBalance);
    } else {
      setBalance(undefined);
    }
  }, [sdk, accountId, assetId]);
  return balance;
}

export function useBalances() {
  const { accountId } = useApp();
  const sdk = useSdk();
  const [balances, setBalances] = useState<AssetValue[]>();
  useEffect(() => {
    if (accountId && sdk) {
      const updateBalances = async () => setBalances(await sdk.getBalances(accountId));
      updateBalances();
      return listenAccountUpdated(sdk, accountId, updateBalances);
    }
  }, [sdk, accountId]);
  return balances;
}

export function useSpendableBalance(assetId: number) {
  const { accountId } = useApp();
  const sdk = useSdk();
  const [spendableBalance, setSpendableBalance] = useState<bigint>();
  useEffect(() => {
    if (sdk && accountId) {
      const updateSpendableBalance = () => sdk.getSpendableSum(assetId, accountId).then(setSpendableBalance);
      updateSpendableBalance();
      return listenAccountUpdated(sdk, accountId, updateSpendableBalance);
    }
  }, [sdk, accountId, assetId]);
  return spendableBalance;
}

// maxSpendableValue is the sum of the two highest avaiable notes
export function useMaxSpendableValue(assetId?: number) {
  const { accountId } = useApp();
  const sdk = useSdk();
  const [maxSpendableValue, setMaxSpendableValue] = useState<bigint>();
  useEffect(() => {
    if (sdk && accountId) {
      if (assetId !== undefined) {
        const updateMaxSpendableValue = () => sdk.getMaxSpendableValue(assetId, accountId).then(setMaxSpendableValue);
        updateMaxSpendableValue();
        return listenAccountUpdated(sdk, accountId, updateMaxSpendableValue);
      } else {
        setMaxSpendableValue(undefined);
      }
    }
  }, [sdk, accountId, assetId]);
  return maxSpendableValue;
}

export function useSpendableBalances() {
  const { accountId } = useApp();
  const sdk = useSdk();
  const [spendableBalances, setSpendableBalances] = useState<AssetValue[]>();
  useEffect(() => {
    if (sdk && accountId) {
      const updateSpendableSums = () => sdk.getSpendableSums(accountId).then(setSpendableBalances);
      updateSpendableSums();
      return listenAccountUpdated(sdk, accountId, updateSpendableSums);
    }
  }, [accountId, sdk]);
  return spendableBalances;
}

export function useDepositPendingShieldBalance(assetId: number) {
  const sdk = useSdk();
  const ethAddress = useProviderState()?.account;
  const [deposit, setDeposit] = useState<bigint>();
  useEffect(() => {
    if (sdk && ethAddress) {
      // TODO:
      // Note that there are no events to monitor updates to this value, so
      // components using this hooks will not dynamically refresh. The syncing
      // of this value should be recentralised so it's displayed consistently
      // across the app.
      sdk.getUserPendingDeposit(assetId, ethAddress).then(setDeposit);
    }
  }, [sdk, ethAddress, assetId]);
  const [unsettledTxs, setUnsettledTxs] = useState<JoinSplitTx[]>();
  useEffect(() => {
    // TODO:
    // Same goes for this endpoint, it should be shared via context.
    sdk?.getRemoteUnsettledPaymentTxs().then(setUnsettledTxs);
  }, [sdk]);
  const unsettledDeposit = useMemo(() => {
    if (!unsettledTxs || !ethAddress) return;
    return (
      unsettledTxs
        .filter(
          tx =>
            tx.proofData.proofData.proofId === ProofId.DEPOSIT &&
            tx.proofData.publicAssetId === assetId &&
            tx.proofData.publicOwner.equals(ethAddress),
        )
        .reduce((sum, tx) => sum + BigInt(tx.proofData.publicValue), 0n) || 0n
    );
  }, [unsettledTxs, ethAddress, assetId]);
  if (deposit === undefined || unsettledDeposit === undefined) return;
  return deposit - unsettledDeposit;
}

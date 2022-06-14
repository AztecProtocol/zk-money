import type { RemoteAsset } from 'alt-model/types';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from 'alt-model';
import { useSdk } from 'alt-model/top_level_context';
import { EthAccount, EthAccountEvent } from 'app';
import { useProviderState } from 'alt-model/provider_hooks';

export function useLegacyEthAccountState(asset?: RemoteAsset) {
  const sdk = useSdk();
  const { provider, requiredNetwork } = useApp();
  const providerState = useProviderState();
  const network = providerState?.network;
  const account = providerState?.account;
  const ethAccount = useMemo(() => {
    if (provider && sdk && asset) {
      return new EthAccount(provider, account, network, sdk, asset.id, asset.address, requiredNetwork);
    }
  }, [provider, network, account, sdk, requiredNetwork, asset]);
  const [state, setState] = useState(ethAccount?.state);
  useEffect(() => {
    setState(undefined);
    if (ethAccount) {
      const updateState = () => setState(ethAccount.state);
      updateState();
      ethAccount.on(EthAccountEvent.UPDATED_PENDING_BALANCE, updateState);
      ethAccount.on(EthAccountEvent.UPDATED_PUBLIC_BALANCE, updateState);
      return () => {
        ethAccount.off(EthAccountEvent.UPDATED_PENDING_BALANCE, updateState);
        ethAccount.off(EthAccountEvent.UPDATED_PUBLIC_BALANCE, updateState);
      };
    }
  }, [ethAccount]);
  return state;
}

export function useL1Balances(asset?: RemoteAsset) {
  const state = useLegacyEthAccountState(asset);
  return {
    l1Balance: state?.publicBalance,
    l1PendingBalance: state?.pendingBalance,
  };
}

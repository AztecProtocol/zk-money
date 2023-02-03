import type { RemoteAsset } from '../../../../../../alt-model/types.js';
import { getAssetPreferredFractionalDigits } from '../../../../../../alt-model/known_assets/known_asset_display_data.js';
import { formatBaseUnits } from '../../../../../../app/index.js';
import { useL1Balance } from '../../../../../../alt-model/assets/l1_balance_hooks.js';
import { useMaxSpendableValue } from '../../../../../../alt-model/index.js';
import { usePendingBalances } from '../../../../../../alt-model/top_level_context/top_level_context_hooks.js';

export function useL1BalanceIndicator(asset?: RemoteAsset, symbol: boolean = false) {
  const pendingBalances = usePendingBalances();
  const l1Balance = useL1Balance(asset);
  const l1PendingBalance = asset ? pendingBalances?.[asset.id] ?? 0n : 0n;
  return asset === undefined || l1Balance === undefined
    ? 'Loading...'
    : `${formatBaseUnits(l1Balance + l1PendingBalance, asset.decimals, {
        precision: getAssetPreferredFractionalDigits(asset.label),
      })}${symbol ? ` ${asset.symbol}` : ''}`;
}

export function useL2BalanceIndicator(asset?: RemoteAsset, symbol: boolean = false) {
  const balance = useMaxSpendableValue(asset?.id);
  return asset === undefined || balance === undefined
    ? 'Loading...'
    : `${formatBaseUnits(balance, asset.decimals, {
        precision: getAssetPreferredFractionalDigits(asset.label),
      })}${symbol ? ` zk${asset.symbol}` : ''}`;
}

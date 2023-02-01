import type { AssetValue } from '@aztec/sdk';
import type { RemoteAsset } from '../types.js';
import { getAssetPreferredFractionalDigits } from '../known_assets/known_asset_display_data.js';

export function getIsDust(assetValue: AssetValue, asset: RemoteAsset) {
  const fractionalDigits = getAssetPreferredFractionalDigits(asset.label);
  if (fractionalDigits === undefined) return false;
  const dustThreshold = 10n ** BigInt(asset.decimals - fractionalDigits);
  return assetValue.value <= dustThreshold;
}

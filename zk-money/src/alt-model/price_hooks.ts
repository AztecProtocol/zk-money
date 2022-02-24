import { AssetValue } from '@aztec/sdk';
import { convertToPrice } from 'app';
import { useEffect, useMemo, useState } from 'react';
import { useApp } from './app_context';
import { useRollupProviderStatus } from './rollup_provider_hooks';

export function useAssetPrice(assetId?: number) {
  const { priceFeedService } = useApp();
  const [price, setPrice] = useState<bigint>();
  useEffect(() => {
    if (assetId !== undefined) {
      setPrice(priceFeedService.getPrice(assetId));
      const handlePriceChange = (_: number, newPrice: bigint) => {
        setPrice(newPrice);
      };
      priceFeedService.subscribe(assetId, handlePriceChange);
      return () => {
        priceFeedService.unsubscribe(assetId, handlePriceChange);
      };
    }
  }, [assetId, priceFeedService]);
  return price;
}

export function useAssetPrices(assetIds?: number[]) {
  const { priceFeedService } = useApp();
  const [prices, setPrices] = useState<Record<number, bigint | undefined>>({});
  useEffect(() => {
    if (assetIds) {
      const unlisteners = assetIds.map(id => {
        const handlePriceChange = (_: number, newPrice: bigint) => {
          setPrices(prices => ({ ...prices, [id]: newPrice }));
        };
        handlePriceChange(id, priceFeedService.getPrice(id));
        priceFeedService.subscribe(id, handlePriceChange);
        return () => {
          priceFeedService.unsubscribe(id, handlePriceChange);
        };
      });
      return () => {
        for (const unlisten of unlisteners) unlisten();
      };
    }
  }, [priceFeedService, assetIds]);
  return prices;
}

export function useAggregatedAssetsPrice(assetValues?: AssetValue[]) {
  const rpStatus = useRollupProviderStatus();

  const assetIds = useMemo(() => assetValues?.map(x => x.assetId) ?? [], [assetValues]);
  const prices = useAssetPrices(assetIds ?? []);

  if (!assetValues) return undefined;

  let aggregatedPrice = 0n;
  assetValues?.forEach(({ assetId, value }) => {
    const price = prices[assetId];
    const asset = rpStatus?.blockchainStatus.assets[assetId];
    if (price !== undefined && asset !== undefined) {
      aggregatedPrice += convertToPrice(value, asset.decimals, price);
    }
  });

  return aggregatedPrice;
}
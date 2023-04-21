import { EthAddress, AssetValue } from '@aztec/sdk';
import 'isomorphic-fetch';

import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { AuxDataConfig, AztecAsset, BridgeDataFieldGetters, SolidityType, UnderlyingAsset } from '../bridge-data.js';

export class EulerRedemptionBridgeData implements BridgeDataFieldGetters {
  protected constructor(protected ethersProvider: StaticJsonRpcProvider) {}
  migrators = new Map<EthAddress, EthAddress>(); // Get contract addresses of the migrators

  getInteractionPresentValue?(interactionNonce: number, inputValue: bigint): Promise<AssetValue[]> {
    throw new Error('Method not implemented.');
  }

  async getAuxData(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
  ): Promise<bigint[]> {
    // Minimum of 0.95 underlying token in output per erc4626 input.
    return [95n * 10n ** 16n];
  }

  auxDataConfig: AuxDataConfig[] = [
    {
      start: 0,
      length: 64,
      solidityType: SolidityType.uint64,
      description: 'The aux-data will determine the maximum slippage. The value represents the minimum acceptable amount per ERC4626 share ',
    },
  ];

  async getExpectedOutput(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
    inputValue: bigint,
  ): Promise<bigint[]> {
    return [(inputValue * 95n) / 100n];
  }

  getExpiration?(interactionNonce: number): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  hasFinalised?(interactionNonce: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  getAPR?(yieldAsset: AztecAsset): Promise<number> {
    return 0;
  }

  getMarketSize?(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
  ): Promise<AssetValue[]> {
    return [{ asset: inputAssetA, value: 0n }];
  }

  getInteractionAPR?(interactionNonce: number): Promise<number[]> {
    throw new Error('Method not implemented.');
  }

  getUnderlyingAmount?(asset: AztecAsset, amount: bigint): Promise<UnderlyingAsset> {
    throw new Error('Method not implemented.');
  }

  getTermAPR?(underlying: AztecAsset, auxData: bigint, inputValue: bigint): Promise<number> {
    throw new Error('Method not implemented.');
  }

  getBorrowingFee?(borrowAmount: bigint): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  getCurrentCR?(): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  getUserDebtAndCollateral?(tbAmount: bigint): Promise<[bigint, bigint]> {
    throw new Error('Method not implemented.');
  }

  getCustomMaxPrice?(slippage: bigint): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  static create(provider: StaticJsonRpcProvider) {
    return new EulerRedemptionBridgeData(provider);
  }
}

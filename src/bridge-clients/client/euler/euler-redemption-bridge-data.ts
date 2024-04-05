import { AssetValue, EthAddress } from '@aztec/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import 'isomorphic-fetch';
import { IERC4626__factory, IERC20Metadata__factory } from '../../typechain-types/index.js';

import { AuxDataConfig, AztecAsset, BridgeDataFieldGetters, SolidityType, UnderlyingAsset } from '../bridge-data.js';

// using 0.90 as minimums to account for large price fluctuations between dai/eth
// in the time between user proof generation and inclusion on L1.
const MINIMUM_OUT = 90n * 10n ** 16n;

export class EulerRedemptionBridgeData implements BridgeDataFieldGetters {
  protected constructor(protected ethersProvider: StaticJsonRpcProvider) {}
  minTokenOut = {
    0: MINIMUM_OUT, // ETH
    1: MINIMUM_OUT, // DAI
    2: MINIMUM_OUT, // WSTETH
    5: MINIMUM_OUT, // weWETH
    6: MINIMUM_OUT, // weWSTETH
    7: MINIMUM_OUT, // weDAI
  };
  getInteractionPresentValue?(interactionNonce: number, inputValue: bigint): Promise<AssetValue[]> {
    throw new Error('Method not implemented.');
  }

  async getAuxData(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
  ): Promise<bigint[]> {
    // Minimum of underlying token output per erc4626 input.
    return Promise.resolve([this.minTokenOut[outputAssetA.id]]);
  }

  auxDataConfig: AuxDataConfig[] = [
    {
      start: 0,
      length: 64,
      solidityType: SolidityType.uint64,
      description:
        'The aux-data will determine the maximum slippage. The value represents the minimum acceptable amount per ERC4626 share',
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
    return Promise.resolve([(inputValue * auxData) / 10n ** 18n]);
  }

  getExpiration?(interactionNonce: number): Promise<bigint> {
    throw new Error('Method not implemented.');
  }

  hasFinalised?(interactionNonce: number): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  getAPR(yieldAsset: AztecAsset): Promise<number> {
    return Promise.resolve(0);
  }

  getMarketSize(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
  ): Promise<AssetValue[]> {
    return Promise.resolve([{ assetId: inputAssetA.id, value: 0n }]);
  }

  getInteractionAPR?(interactionNonce: number): Promise<number[]> {
    throw new Error('Method not implemented.');
  }

  async getUnderlyingAmount(share: AztecAsset, amount: bigint): Promise<UnderlyingAsset> {
    const vault = IERC4626__factory.connect(share.erc20Address.toString(), this.ethersProvider);
    const assetAddress = EthAddress.fromString(await vault.asset());

    const tokenContract = IERC20Metadata__factory.connect(assetAddress.toString(), this.ethersProvider);
    const namePromise = tokenContract.name();
    const symbolPromise = tokenContract.symbol();
    const decimalsPromise = tokenContract.decimals();
    const underlyingAmount = (amount * this.minTokenOut[share.id]) / 10n ** 18n;

    return {
      address: assetAddress,
      name: await namePromise,
      symbol: await symbolPromise,
      decimals: await decimalsPromise,
      amount: underlyingAmount,
    };
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

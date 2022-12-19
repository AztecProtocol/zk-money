import { AssetValue, EthAddress } from '@aztec/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import 'isomorphic-fetch';
import { ICERC20__factory, ICompoundERC4626__factory, IERC20__factory } from '../../typechain-types/index.js';
import { AztecAsset } from '../bridge-data.js';

import { ERC4626BridgeData } from '../erc4626/erc4626-bridge-data.js';

export class CompoundBridgeData extends ERC4626BridgeData {
  protected constructor(ethersProvider: StaticJsonRpcProvider) {
    super(ethersProvider);
  }

  static create(provider: StaticJsonRpcProvider) {
    return new CompoundBridgeData(provider);
  }

  async getAPR(yieldAsset: AztecAsset): Promise<number> {
    // Not taking into account how the deposited funds will change the yield
    // The approximate number of blocks per year that is assumed by the interest rate model

    const blocksPerYear = 2102400;

    // To get the cToken first call cToken on the wrapper contract
    const cTokenAddress = await this.getCToken(yieldAsset.erc20Address);
    const cToken = ICERC20__factory.connect(cTokenAddress.toString(), this.ethersProvider);

    const supplyRatePerBlock = await cToken.supplyRatePerBlock();
    return supplyRatePerBlock
      .mul(blocksPerYear)
      .div(10n ** 16n)
      .toNumber();
  }

  async getMarketSize(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
  ): Promise<AssetValue[]> {
    let cTokenAddress;
    let underlyingAsset;
    if (auxData === 0n) {
      // Minting
      cTokenAddress = await this.getCToken(outputAssetA.erc20Address);
      underlyingAsset = inputAssetA;
    } else if (auxData === 1n) {
      // Redeeming
      cTokenAddress = await this.getCToken(inputAssetA.erc20Address);
      underlyingAsset = outputAssetA;
    } else {
      throw new Error('Invalid auxData');
    }

    const underlying = IERC20__factory.connect(underlyingAsset.erc20Address.toString(), this.ethersProvider);
    const cToken = ICERC20__factory.connect(cTokenAddress.toString(), this.ethersProvider);

    const underlyingBalance = await underlying.balanceOf(cTokenAddress.toString());
    const totalBorrows = await cToken.totalBorrows();

    const marketSize = underlyingBalance.add(totalBorrows).toBigInt();

    return [
      {
        assetId: underlyingAsset.id,
        value: marketSize,
      },
    ];
  }

  private async getCToken(shareAddress: EthAddress): Promise<EthAddress> {
    const share = ICompoundERC4626__factory.connect(shareAddress.toString(), this.ethersProvider);
    return EthAddress.fromString(await share.cToken());
  }
}

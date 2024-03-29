import { BridgeCallData, EthAddress, AssetValue } from '@aztec/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BigNumber } from 'ethers';
import {
  IChainlinkOracle,
  IChainlinkOracle__factory,
  IPriceFeed__factory,
  ITroveManager,
  ITroveManager__factory,
  TroveBridge,
  TroveBridge__factory,
} from '../../typechain-types/index.js';
import { AuxDataConfig, AztecAsset, AztecAssetType, BridgeDataFieldGetters, SolidityType } from '../bridge-data.js';

export class TroveBridgeData implements BridgeDataFieldGetters {
  public readonly LUSD = EthAddress.fromString('0x5f98805A4E8be255a32880FDeC7F6728C6568bA0');
  // Price precision
  public readonly PRECISION = 10n ** 18n;

  // Note: max setting has to be set significantly higher than the ideal setting in order for the aggregation to work
  public readonly IDEAL_SLIPPAGE_SETTING = 100n; // Denominated in basis points
  public readonly MAX_ACCEPTABLE_BATCH_SLIPPAGE_SETTING = this.IDEAL_SLIPPAGE_SETTING * 2n;

  private price?: BigNumber;

  protected constructor(
    protected ethersProvider: StaticJsonRpcProvider,
    protected bridgeAddressId: number,
    protected bridge: TroveBridge,
    protected troveManager: ITroveManager,
    protected ethUsdOracle: IChainlinkOracle,
    protected lusdUsdOracle: IChainlinkOracle,
  ) {}

  /**
   * @param provider Ethereum provider
   * @param bridgeAddressId An id representing bridge address in the RollupProcessor contract
   * @param bridgeAddress Address of the bridge address (and the corresponding accounting token)
   */
  static create(provider: StaticJsonRpcProvider, bridgeAddressId: number, bridgeAddress: EthAddress) {
    const troveManager = ITroveManager__factory.connect('0xA39739EF8b0231DbFA0DcdA07d7e29faAbCf4bb2', provider);
    const bridge = TroveBridge__factory.connect(bridgeAddress.toString(), provider);

    // Precision of the feeds is 1e8
    const ethUsdOracle = IChainlinkOracle__factory.connect('0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', provider);
    const lusdUsdOracle = IChainlinkOracle__factory.connect('0x3D7aE7E594f2f2091Ad8798313450130d0Aba3a0', provider);

    return new TroveBridgeData(provider, bridgeAddressId, bridge, troveManager, ethUsdOracle, lusdUsdOracle);
  }

  auxDataConfig: AuxDataConfig[] = [
    {
      start: 0,
      length: 64,
      solidityType: SolidityType.uint64,
      description: 'AuxData is only used when borrowing and represent max borrowing fee',
    },
  ];

  /**
   * @return Borrowing rate rounded up to tenths of percents when the input/output asset combination corresponds
   *         to borrowing. Returns 0 for non-borrowing flows.
   */
  async getAuxData(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
  ): Promise<bigint[]> {
    if (
      inputAssetA.assetType === AztecAssetType.ETH &&
      inputAssetB.assetType === AztecAssetType.NOT_USED &&
      outputAssetA.erc20Address.equals(EthAddress.fromString(this.bridge.address)) &&
      outputAssetB.erc20Address.equals(this.LUSD)
    ) {
      const currentBorrowingRate = await this.troveManager.getBorrowingRateWithDecay();
      // Borrowing rate is decaying to a value defined by governance --> this means the value is changing
      // --> we don't want to break aggregation by there occurring irrelevant borrowing rate changes
      // so I will set the irrelevant decimals to 0 and increase the acceptable fee by 0.1 %
      const borrowingRate = (currentBorrowingRate.toBigInt() / 10n ** 15n) * 10n ** 15n + 10n ** 15n;
      return [borrowingRate];
    } else if (
      inputAssetA.erc20Address.equals(EthAddress.fromString(this.bridge.address)) &&
      inputAssetB.erc20Address.equals(this.LUSD) &&
      outputAssetA.assetType === AztecAssetType.ETH &&
      outputAssetB.erc20Address.equals(EthAddress.fromString(this.bridge.address))
    ) {
      // Repayment with a combination of collateral and LUSD --> `auxData` contains maximum price of LUSD
      return [await this.getMaxPrice(inputAssetA.id, outputAssetA.id, inputAssetB.id, outputAssetB.id)];
    } else if (
      inputAssetA.erc20Address.equals(EthAddress.fromString(this.bridge.address)) &&
      inputAssetB.assetType === AztecAssetType.NOT_USED &&
      outputAssetA.assetType === AztecAssetType.ETH &&
      outputAssetB.assetType === AztecAssetType.NOT_USED
    ) {
      // Repayment with collateral --> `auxData` contains maximum price of LUSD
      return [await this.getMaxPrice(inputAssetA.id, outputAssetA.id, undefined, undefined)];
    }
    return [0n];
  }

  async getExpectedOutput(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
    inputValue: bigint,
  ): Promise<bigint[]> {
    const bridge = TroveBridge__factory.connect(this.bridge.address, this.ethersProvider);
    if (
      inputAssetA.assetType === AztecAssetType.ETH &&
      inputAssetB.assetType === AztecAssetType.NOT_USED &&
      outputAssetA.erc20Address.equals(EthAddress.fromString(this.bridge.address)) &&
      outputAssetB.erc20Address.equals(this.LUSD)
    ) {
      const amountOut = await bridge.callStatic.computeAmtToBorrow(inputValue);
      // Borrowing
      // Note: returning dummy value on index 0 because the frontend doesn't care about it
      return [0n, amountOut.toBigInt()];
    } else if (
      inputAssetA.erc20Address.equals(EthAddress.fromString(this.bridge.address)) &&
      outputAssetA.assetType === AztecAssetType.ETH
    ) {
      // Repaying with collateral
      const tbTotalSupply = await bridge.totalSupply();
      const { debt, coll } = await this.troveManager.getEntireDebtAndColl(this.bridge.address);
      // Compute the users share of collateral measured in Eth
      const userCollateral = (inputValue * coll.toBigInt()) / tbTotalSupply.toBigInt();
      // Compute the users share of debt measured in LUSD
      const userDebt = (inputValue * debt.toBigInt()) / tbTotalSupply.toBigInt();
      // Compute the user share measured in Eth
      const userDebtInEth = (userDebt * (await this.getLusdPriceInEth())) / 10n ** 18n;
      // Return the remainder of users collateral after debt has been repaid
      return [userCollateral - userDebtInEth, 0n];
    }
    throw new Error('Incorrect combination of input/output assets.');
  }

  async getMarketSize(
    inputAssetA: AztecAsset,
    inputAssetB: AztecAsset,
    outputAssetA: AztecAsset,
    outputAssetB: AztecAsset,
    auxData: bigint,
  ): Promise<AssetValue[]> {
    const { coll } = await this.troveManager.getEntireDebtAndColl(this.bridge.address);
    return [
      {
        assetId: 0,
        value: coll.toBigInt(),
      },
    ];
  }

  /**
   * @notice This function computes borrowing fee for a given borrow amount
   * @param borrowAmount An amount of LUSD borrowed
   * @return amount of fee to be paid for a given borrow amount (in LUSD)
   */
  async getBorrowingFee(borrowAmount: bigint): Promise<bigint> {
    const isRecoveryMode = await this.troveManager.checkRecoveryMode(await this.fetchPrice());
    if (isRecoveryMode) {
      return 0n;
    }

    const borrowingRate = await this.troveManager.getBorrowingRateWithDecay();
    return (borrowingRate.toBigInt() * borrowAmount) / 10n ** 18n;
  }

  /**
   * @notice Returns current collateral ratio of the bridge
   * @return Current collateral ratio of the bridge denominated in percents
   */
  async getCurrentCR(): Promise<bigint> {
    const cr = await this.troveManager.getCurrentICR(this.bridge.address, await this.fetchPrice());
    return cr.toBigInt() / 10n ** 16n;
  }

  /**
   * @notice Returns debt and collateral corresponding to a given accounting token amount (TB token)
   * @return Debt corresponding to a given accounting token amount
   * @return Collateral corresponding to a given accounting token amount
   */
  async getUserDebtAndCollateral(tbAmount: bigint): Promise<[bigint, bigint]> {
    const tbTotalSupply = await this.bridge.totalSupply();

    const { debt, coll } = await this.troveManager.getEntireDebtAndColl(this.bridge.address);

    const userDebt = (tbAmount * debt.toBigInt()) / tbTotalSupply.toBigInt();
    const userCollateral = (tbAmount * coll.toBigInt()) / tbTotalSupply.toBigInt();

    return [userDebt, userCollateral];
  }

  /**
   * @notice Returns LUSD price with applied slippage
   * @param slippage Slippage denominated in basis points
   * @return Maximum acceptable price of LUSD
   */
  async getCustomMaxPrice(slippage: bigint): Promise<bigint> {
    const lusdPriceInEth = await this.getLusdPriceInEth();

    return (lusdPriceInEth * (10000n + slippage)) / 10000n;
  }

  private async fetchPrice(): Promise<BigNumber> {
    if (this.price === undefined) {
      const priceFeedAddress = await this.troveManager.priceFeed();
      const priceFeed = IPriceFeed__factory.connect(priceFeedAddress, this.ethersProvider);
      this.price = await priceFeed.callStatic.fetchPrice();
    }

    return this.price;
  }

  private async getMaxPrice(
    inputAssetIdA: number,
    outputAssetIdA: number,
    inputAssetIdB?: number,
    outputAssetIdB?: number,
  ): Promise<bigint> {
    const relevantAuxDatas = await this.fetchRelevantAuxDataFromFalafel(
      inputAssetIdA,
      outputAssetIdA,
      inputAssetIdB,
      outputAssetIdB,
    );

    const lusdPriceInEth = await this.getLusdPriceInEth();
    const maxPrice = (lusdPriceInEth * (10000n + this.MAX_ACCEPTABLE_BATCH_SLIPPAGE_SETTING)) / 10000n;

    for (const existingBatchPrice of relevantAuxDatas) {
      if (lusdPriceInEth < existingBatchPrice && existingBatchPrice < maxPrice) {
        return existingBatchPrice;
      }
    }

    return (lusdPriceInEth * (10000n + this.IDEAL_SLIPPAGE_SETTING)) / 10000n;
  }

  private async fetchRelevantAuxDataFromFalafel(
    inputAssetIdA: number,
    outputAssetIdA: number,
    inputAssetIdB?: number,
    outputAssetIdB?: number,
  ): Promise<bigint[]> {
    const result = await (
      await fetch('https://api.aztec.network/aztec-connect-prod/falafel/status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ).json();

    const bridgeCallDatas: BridgeCallData[] = result.bridgeStatus.map((status: any) =>
      BridgeCallData.fromString(status.bridgeCallData),
    );

    const auxDatas: bigint[] = [];

    for (const bridgeCallData of bridgeCallDatas) {
      if (
        bridgeCallData.bridgeAddressId === this.bridgeAddressId &&
        bridgeCallData.inputAssetIdA === inputAssetIdA &&
        bridgeCallData.inputAssetIdB === inputAssetIdB &&
        bridgeCallData.outputAssetIdA === outputAssetIdA &&
        bridgeCallData.outputAssetIdB === outputAssetIdB
      ) {
        auxDatas.push(bridgeCallData.auxData);
      }
    }

    return auxDatas;
  }

  /**
   * @return LUSD price denominated in ETH using a 1e18 precision
   */
  private async getLusdPriceInEth(): Promise<bigint> {
    // Both feeds use 8 decimals
    const [, ethPrice, , ,] = await this.ethUsdOracle.latestRoundData();
    const [, lusdPrice, , ,] = await this.lusdUsdOracle.latestRoundData();

    return lusdPrice.mul(this.PRECISION).div(ethPrice).toBigInt();
  }
}

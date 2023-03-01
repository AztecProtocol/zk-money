import type { Signer } from '@ethersproject/abstract-signer';
import {
  GrumpkinAddress,
  AztecSdk,
  EthAddress,
  DepositController,
  TxId,
  TxSettlementTime,
  EthersAdapter,
} from '@aztec/sdk';
import createDebug from 'debug';
import { Amount } from '../assets/index.js';
import { retryUntil, withinTimeLimit, CachedStep } from '../../app/util/index.js';
import { WalletAccountEnforcer } from './ensured_provider.js';
import { Network } from '../../app/networks.js';
import { ShieldComposerPhase, ShieldComposerStateObs } from './shield_composer_state_obs.js';
import { createSigningRetryableGenerator } from '../forms/composer_helpers.js';
import { FEE_SIG_FIGURES } from '../forms/constants.js';
import { ActiveSignerObs } from '../defi/defi_form/correct_provider_hooks.js';

const debug = createDebug('zm:shield_composer');

const PROOF_CREATION_TIMEOUT = 120e3;

export type ShieldComposerPayload = Readonly<{
  targetOutput: Amount;
  fee: Amount;
  settlementTime: TxSettlementTime;
  depositor: EthAddress;
  recipientUserId: GrumpkinAddress;
}>;

export interface ShieldComposerDeps {
  sdk: AztecSdk;
  userId: GrumpkinAddress;
  requiredNetwork: Network;
  activeSignerObs: ActiveSignerObs;
  awaitCorrectSigner: () => Promise<Signer>;
}

export class ShieldComposer {
  stateObs = new ShieldComposerStateObs();
  private readonly walletAccountEnforcer: WalletAccountEnforcer;
  constructor(readonly payload: ShieldComposerPayload, private readonly deps: ShieldComposerDeps) {
    this.walletAccountEnforcer = new WalletAccountEnforcer(
      deps.activeSignerObs,
      payload.depositor,
      deps.requiredNetwork,
      this.stateObs.setPrompt,
    );
  }

  private readonly cachedSteps = {
    createController: new CachedStep<DepositController>(),
    deposit: new CachedStep<void>(),
    createProof: new CachedStep<void>(),
    approveProof: new CachedStep<void>(),
    sendProof: new CachedStep<TxId>(),
  };

  private withRetryableSigning = createSigningRetryableGenerator(this.stateObs);

  async compose() {
    this.stateObs.clearError();
    this.stateObs.setBackNoRetry(false);
    try {
      // Each step is only attempted if it hasn't already succeeded on a previous run.
      const controller = await this.cachedSteps.createController.exec(() => this.createController());
      await this.cachedSteps.createProof.exec(() => this.createProof(controller));
      await this.cachedSteps.deposit.exec(() => this.deposit(controller));
      await this.cachedSteps.approveProof.exec(() => this.approveProof(controller));
      const txId = await this.cachedSteps.sendProof.exec(() => this.sendProof(controller));
      this.stateObs.setPhase(ShieldComposerPhase.DONE);

      return txId;
    } catch (error) {
      if (error?.message === 'Insufficient fee.') {
        await this.showInsufficientFeeMessage();
        return false;
      }
      debug('Compose failed with error:', error);
      this.stateObs.error(error?.message?.toString(), error);
      return false;
    }
  }

  private async createController() {
    const { targetOutput, fee, depositor, recipientUserId } = this.payload;
    const { sdk } = this.deps;

    // If fees are taken in second asset we need access to the user's spending key.
    // Otherwise we can shield from nonce 0 and skip spending key generation.
    const isPayingFeeWithNotes = targetOutput.id !== fee.id;
    if (isPayingFeeWithNotes) {
      this.stateObs.setPhase(ShieldComposerPhase.GENERATE_SPENDING_KEY);
      // TODO - create FeeController to pay the fee for the deposit proof.
    }

    const activeSigner = await this.walletAccountEnforcer.ensure();
    const ethereumProvider = new EthersAdapter(activeSigner.provider!);
    return sdk.createDepositController(
      depositor,
      targetOutput.toAssetValue(),
      fee.toAssetValue(),
      recipientUserId,
      true, // recipientAccountRequired (depositing to a registered account)
      ethereumProvider,
    );
  }

  private async createProof(controller: DepositController) {
    this.stateObs.setPhase(ShieldComposerPhase.CREATE_PROOF);
    await controller.createProof(PROOF_CREATION_TIMEOUT);
  }

  private async deposit(controller: DepositController) {
    this.stateObs.setPhase(ShieldComposerPhase.DEPOSIT);

    const requiredFunds = await controller.getRequiredFunds();
    if (requiredFunds === 0n) {
      // Already enough funds pending on contract
      return;
    }
    const requiredAmount = this.payload.targetOutput.withBaseUnits(requiredFunds);
    await this.approveAndAwaitL1AllowanceIfNecessary(controller, requiredAmount);
    await this.depositAndAwaitConfirmation(controller, requiredAmount);
  }

  private async approveAndAwaitL1AllowanceIfNecessary(controller: DepositController, requiredAmount: Amount) {
    // If the asset is not ETH, the rollup must be approved to pull funds from the user's account.
    const targetAssetIsEth = controller.assetValue.assetId === 0;
    if (!targetAssetIsEth) {
      // Check if allowance is sufficient, and approve more if not.
      const sufficientAllowanceHasBeenApproved = () =>
        controller.getPublicAllowance().then(allowance => allowance >= requiredAmount.baseUnits);
      if (!(await sufficientAllowanceHasBeenApproved())) {
        await this.walletAccountEnforcer.ensure();
        this.stateObs.setPrompt(`Approve the rollup to pull ${requiredAmount.format({ layer: 'L1' })}.`);
        await this.withRetryableSigning(() => controller.approve());
        this.stateObs.setPrompt('Awaiting transaction confirmation...');
        const timeout = 1000 * 60 * 30; // 30 mins
        const interval = this.deps.requiredNetwork.isFrequent ? 1000 : 10 * 1000;
        const approved = await retryUntil(sufficientAllowanceHasBeenApproved, timeout, interval);
        this.stateObs.clearPrompt();
        if (!approved) throw new Error('Failed to grant allowance');
      }
    }
    return requiredAmount;
  }

  private async depositAndAwaitConfirmation(controller: DepositController, requiredAmount: Amount) {
    await this.walletAccountEnforcer.ensure();
    this.stateObs.setPrompt(
      `Deposit of ${requiredAmount.format({
        layer: 'L1',
      })} from your wallet. Important: It is not recommended to pay a low L1 gas fee. If your deposit takes too long to clear, gas prices might change so much as to cause the rollup provider to reject your shield proof.`,
    );
    const expireIn = 60n * 60n * 24n; // 24 hours
    const deadline = BigInt(Math.floor(Date.now() / 1000)) + expireIn;
    await this.withRetryableSigning(() => controller.depositFundsToContract(deadline));
    this.stateObs.setPrompt('Awaiting transaction confirmation...');
    const timeout = 1000 * 60 * 30; // 30 mins
    const confirmed = await withinTimeLimit(controller.awaitDepositFundsToContract(), timeout);
    this.stateObs.clearPrompt();
    if (!confirmed) throw new Error('Deposit confirmation timed out');
  }

  private async approveProof(controller: DepositController) {
    const { sdk } = this.deps;
    const { depositor } = this.payload;
    // Skip this step for contract wallets
    if (!(await sdk.isContract(depositor))) {
      this.stateObs.setPhase(ShieldComposerPhase.APPROVE_PROOF);
      const digest = controller.getProofHash()?.toString('hex');
      if (!digest) throw new Error('Proof digest unavailable');
      await this.walletAccountEnforcer.ensure();
      this.stateObs.setPrompt(
        `Please sign the message in your wallet containing the following transaction ID: 0x${digest}`,
      );
      try {
        await this.withRetryableSigning(() => controller.sign());
      } catch (e) {
        debug(e);
        throw new Error('Failed to sign the proof.');
      }
      this.stateObs.clearPrompt();
    } else if (!(await controller.isProofApproved())) {
      await this.walletAccountEnforcer.ensure();
      this.stateObs.setPrompt('Please approve the proof data in your wallet.');
      try {
        await this.withRetryableSigning(() => controller.approveProof());
      } catch (e) {
        debug(e);
        throw new Error('Failed to approve the proof.');
      }

      this.stateObs.setPrompt('Awaiting transaction confirmation...');
      const timeout = 1000 * 60 * 30;
      const interval = this.deps.requiredNetwork.isFrequent ? 1000 : 10 * 1000;
      const approved = await retryUntil(() => controller.isProofApproved(), timeout, interval);
      if (!approved) throw new Error('Approval confirmation timed out');
    }
  }

  private async sendProof(controller: DepositController) {
    this.stateObs.setPhase(ShieldComposerPhase.SEND_PROOF);
    await this.walletAccountEnforcer.ensure();
    return await controller.send();
  }

  private async showInsufficientFeeMessage() {
    const { sdk } = this.deps;
    const { fee, targetOutput, settlementTime } = this.payload;
    const latestFees = await sdk.getDepositFees(targetOutput.id, { feeSignificantFigures: FEE_SIG_FIGURES });
    const latestFee = latestFees[settlementTime];
    const latestFeeAmount = fee.withBaseUnits(latestFee.value);
    const isPayingFeeWithNotes = targetOutput.id !== fee.id;
    const layer = isPayingFeeWithNotes ? 'L1' : 'L2';
    this.stateObs.error(
      `Gas prices have increased since starting this transaction and the rollup provider has rejected it as a result. You can wait for gas prices to go back down and attempt your transaction again, or start the shielding process again at the higher fee. (Latest fee quote: ${latestFeeAmount.format(
        { layer },
      )})`,
      null,
    );
    this.stateObs.setBackNoRetry(true);
  }
}

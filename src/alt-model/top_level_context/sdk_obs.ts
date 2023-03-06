import {
  AztecSdk,
  createAztecSdk,
  JsonRpcProvider,
  SdkEvent,
  SdkFlavour,
  ClientVersionMismatchError,
} from '@aztec/sdk';
import { chainIdToNetwork } from '../../app/networks.js';
import { Obs } from '../../app/util/index.js';
import createDebug from 'debug';
import { Config } from '../../config.js';
import { ToastsObs } from './toasts_obs.js';
import { ToastType } from '../../ui-components/index.js';

const debug = createDebug('zm:sdk_obs');

const hostedSdkEnabled = !!localStorage.getItem('hosted_sdk_enabled');

type SdkObsValue = AztecSdk | undefined;
export type SdkObs = Obs<SdkObsValue>;

export function createSdkObs(config: Config, toastsObs: ToastsObs): SdkObs {
  const aztecJsonRpcProvider = new JsonRpcProvider(config.ethereumHost);

  const sdkObs = Obs.input<SdkObsValue>(undefined);
  createAztecSdk(aztecJsonRpcProvider, {
    serverUrl: hostedSdkEnabled ? config.hostedSdkUrl : config.rollupProviderUrl,
    debug: config.debugFilter,
    flavour: hostedSdkEnabled ? SdkFlavour.HOSTED : SdkFlavour.PLAIN, // todo put this back when the hosted sdk works
    minConfirmation: chainIdToNetwork(config.chainId)?.isFrequent ? 1 : undefined,
  })
    .then(sdk => {
      sdkObs.next(sdk);
      sdk.addListener(SdkEvent.DESTROYED, async err => {
        debug('SDK destroyed');
        if (!err) {
          handleSdkDestroyedNoMessage(toastsObs);
        } else if (err.includes('QuotaExceededError')) {
          const toast = await getQuotaExceededErrorToast(err);
          toastsObs.addToast(toast);
        } else {
          handleSdkDestroyed(err, toastsObs);
        }
        sdkObs.next(undefined);
      });
      sdk.on(SdkEvent.VERSION_MISMATCH, () => {
        debug('ClientVersionMismatch detected');
        handleVersionMismatch();
      });
    })
    .catch(async err => {
      if (err instanceof ClientVersionMismatchError) {
        debug('ClientVersionMismatch detected');
        handleVersionMismatch();
      }
      if (err.message.includes('QuotaExceededError')) {
        const toast = await getQuotaExceededErrorToast(err);
        toastsObs.addToast(toast);
      }
      debug('Failed to create sdk', err);
      return undefined;
    });
  // Wrapping the input obs hides its `next` method
  return new Obs(sdkObs);
}

function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function handleSdkDestroyedNoMessage(toastsObs) {
  toastsObs.addToast({
    text: 'SDK was destroyed. Please refresh the page.',
    closable: true,
    type: ToastType.ERROR,
  });
}

function handleSdkDestroyed(err, toastsObs) {
  toastsObs.addToast({
    text: err,
    closable: true,
    type: ToastType.ERROR,
  });
}

function getNotEstimatedQuotaExceededErrorToast() {
  debug('Failed to estimate indexedDB storage');
  return {
    text: `Exceeded IndexedDB quota. Please delete some data to continue using the dApp.`,
    closable: true,
    type: ToastType.ERROR,
  };
}

function getEstimatedQuotaExceededErrorToast(est, err) {
  debug('Failed to create sdk', err);
  return {
    text: `Exceeded IndexedDB quota (using ${formatBytes(est.usage)} out of ${formatBytes(
      est.quota,
    )} total capacity). Please delete some data to continue using the dApp.`,
    closable: true,
    type: ToastType.ERROR,
  };
}

export async function getQuotaExceededErrorToast(err) {
  try {
    const est = await navigator.storage.estimate();
    if (!est.usage || !est.quota) throw new Error('Unable to estimate storage');
    return getEstimatedQuotaExceededErrorToast(est, err);
  } catch (e) {
    return getNotEstimatedQuotaExceededErrorToast();
  }
}

function handleVersionMismatch() {
  if (
    window.confirm(
      'Version mismatch between zk.money and rollup server.\n\n' +
        'Press OK to refresh the page!\n\n' +
        '(If this issue persists it may be a problem with your ISP)',
    )
  ) {
    window.location.reload();
  }
}

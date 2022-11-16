import { RollupProviderStatus } from '@aztec/sdk';
import { Poller } from '../../app/util/poller.js';
import { SdkObs } from './sdk_obs.js';

// AztecSdk.getRemoteStatus is a network request, hence this class
// is used to share the polled response and prevent hammering.
type RemoteStatusObsValue = RollupProviderStatus;
export type RemoteStatusPoller = Poller<RemoteStatusObsValue>;
export type RemoteStatusObs = RemoteStatusPoller['obs'];

const REMOTE_STATUS_POLL_INTERVAL = 60 * 1000;
export function createSdkRemoteStatusPoller(sdkObs: SdkObs, initialRollupProviderStatus: RollupProviderStatus) {
  const pollObs = sdkObs.map(sdk => {
    if (!sdk) return undefined;
    return () => sdk.getRemoteStatus();
  });
  return new Poller(pollObs, REMOTE_STATUS_POLL_INTERVAL, initialRollupProviderStatus);
}

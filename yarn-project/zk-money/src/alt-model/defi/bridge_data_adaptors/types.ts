import { EthAddress } from '@aztec/sdk';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { BridgeDataFieldGetters } from '../../../bridge-clients/client/bridge-data.js';
import { SdkObs } from '../../top_level_context/sdk_obs.js';

export type BridgeDataAdaptorCreator = (args: {
  provider: StaticJsonRpcProvider;
  rollupContractAddress: EthAddress;
  bridgeContractAddress: EthAddress;
  bridgeAddressId: number;
  sdkObs: SdkObs;
}) => BridgeDataFieldGetters;

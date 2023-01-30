import '@rainbow-me/rainbowkit/styles.css';
import { connectorsForWallets } from '@rainbow-me/rainbowkit';
import { metaMaskWallet, walletConnectWallet, braveWallet } from '@rainbow-me/rainbowkit/wallets';

import { configureChains, createClient, Chain } from 'wagmi';
import { mainnet, localhost } from 'wagmi/chains';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import type { Config } from '../config.js';

function getChain(config: Config): Chain {
  switch (config.chainId) {
    case 1:
      return mainnet;
    case 1337:
    case 31337:
    case 0xe2e:
      return { ...localhost, id: config.chainId };
    case 0xa57ec:
    case 0x57a93:
    case 0xdef:
      return getForkProvider(config);
    default:
      throw new Error(`Unknown chainId: ${config.chainId}`);
  }
}

function getForkProvider(config: Config): Chain {
  return {
    id: config.chainId,
    name: 'Aztec Ethereum Mainnet Fork',
    network: 'mainnet-fork',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: [config.ethereumHost] }, public: { http: [] } },
  };
}

function getPublicProvider(config: Config) {
  try {
    return jsonRpcProvider({ rpc: () => ({ http: config.ethereumHost }) });
  } catch (e) {
    throw new Error('Could not determine publicProvider');
  }
}

export function getWagmiRainbowConfig(config: Config) {
  const { chains, provider, webSocketProvider } = configureChains([getChain(config)], [getPublicProvider(config)]);

  const wallets = [metaMaskWallet({ chains }), walletConnectWallet({ chains }), braveWallet({ chains })];
  const connectors = connectorsForWallets([{ groupName: 'Supported', wallets }]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
  });
  return { wagmiClient, chains };
}

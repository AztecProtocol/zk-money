import '@rainbow-me/rainbowkit/styles.css';
import { wallet, connectorsForWallets } from '@rainbow-me/rainbowkit';

import { configureChains, createClient, Chain, chain } from 'wagmi';
import { infuraProvider } from 'wagmi/providers/infura';
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc';
import type { Config } from '../config.js';

function getChain(chainId: number): Chain {
  switch (chainId) {
    case 1:
      return chain.mainnet;
    case 1337:
      return chain.localhost;
    case 31337:
      return { ...chain.localhost, id: 31337 };
    case 0xe2e:
      return { ...chain.localhost, id: 0xe2e };
    case 0xa57ec:
      return {
        id: 0xa57ec,
        name: 'Aztec Ethereum Mainnet Fork',
        network: 'mainnet-fork',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: 'https://aztec-connect-testnet-eth-host.aztec.network' },
      };
    case 0x57a93:
      return {
        id: 0x57a93,
        name: 'Aztec Ethereum Mainnet Fork Stage',
        network: 'mainnet-fork',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: 'https://aztec-connect-stage-eth-host.aztec.network' },
      };
    case 0xdef:
      return {
        id: 0xdef,
        name: 'Aztec Ethereum Mainnet Fork Devnet',
        network: 'mainnet-fork',
        nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
        rpcUrls: { default: 'https://aztec-connect-dev-eth-host.aztec.network' },
      };
    default:
      throw new Error(`Unknown chainId: ${chainId}`);
  }
}

function getPublicProvider(config: Config) {
  switch (config.chainId) {
    case 1: {
      // TODO: reshape config to remove this flakey parsing
      const match = config.ethereumHost.match(/[0-9a-z]{32}/);
      const infuraId = match?.[0];
      if (infuraId) {
        return infuraProvider({ infuraId });
      } else {
        return jsonRpcProvider({ rpc: () => ({ http: config.ethereumHost }) });
      }
    }
    case 1337:
    case 31337:
    case 0xe2e:
    case 0xa57ec:
    case 0xdef:
      return jsonRpcProvider({ rpc: () => ({ http: config.ethereumHost }) });
    default:
      throw new Error('Could not determine publicProvider');
  }
}

export function getWagmiRainbowConfig(config: Config) {
  const { chains, provider, webSocketProvider } = configureChains(
    [getChain(config.chainId)],
    [getPublicProvider(config)],
  );

  const wallets = [wallet.metaMask({ chains }), wallet.walletConnect({ chains }), wallet.brave({ chains })];
  const connectors = connectorsForWallets([{ groupName: 'Supported', wallets }]);
  const wagmiClient = createClient({
    autoConnect: true,
    connectors,
    provider,
    webSocketProvider,
  });
  return { wagmiClient, chains };
}

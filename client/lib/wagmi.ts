import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Creditcoin Testnet Configuration
export const creditcoinTestnet = defineChain({
    id: 102031,
    name: 'Creditcoin Testnet',
    nativeCurrency: {
        name: 'Test CTC',
        symbol: 'tCTC',
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.cc3-testnet.creditcoin.network']
        },
    },
    blockExplorers: {
        default: {
            name: 'Blockscout',
            url: 'https://creditcoin-testnet.blockscout.com'
        },
    },
    testnet: true,
});

// Creditcoin Mainnet Configuration
export const creditcoinMainnet = defineChain({
    id: 102030,
    name: 'Creditcoin',
    nativeCurrency: {
        name: 'CTC',
        symbol: 'CTC',
        decimals: 18
    },
    rpcUrls: {
        default: {
            http: ['https://mainnet3.creditcoin.network']
        },
    },
    blockExplorers: {
        default: {
            name: 'Blockscout',
            url: 'https://creditcoin.blockscout.com'
        },
    },
});

// Wagmi Configuration
export const config = getDefaultConfig({
    appName: 'CrediPet',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
    chains: [creditcoinTestnet],
    ssr: true,
});

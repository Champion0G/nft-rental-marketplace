import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig } from 'wagmi';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, goerli } from 'wagmi/chains';

const config = createConfig(
  getDefaultConfig({
    appName: 'NFT Rental Marketplace',
    projectId: 'YOUR_PROJECT_ID', // Get one from https://cloud.walletconnect.com
    chains: [mainnet, goerli],
  })
);

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <Component {...pageProps} />
    </WagmiConfig>
  );
} 
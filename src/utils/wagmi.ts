import { createConfig, http } from "wagmi";
import { hardhat, localhost } from "wagmi/chains";
import { injected } from "wagmi/connectors";

// Configure chains & providers
const chains = [process.env.NODE_ENV === 'development' ? hardhat : localhost];

// Set up wagmi config
export const config = createConfig({
  chains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [chains[0].id]: http(),
  },
}); 
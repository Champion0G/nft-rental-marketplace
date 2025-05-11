This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# NFT Rental Marketplace

A decentralized marketplace for renting NFTs, built with Solidity and Hardhat. This project allows users to list their NFTs for rent, rent NFTs from others, and manage rental periods with automated expiry checks.

## Features

- 🎨 List NFTs for rent with customizable duration and pricing
- 💰 Rent NFTs using ERC20 tokens
- 🤖 AI-powered price suggestions
- ⏰ Automated rental expiry management
- 📱 Mobile-friendly interface
- 🔒 Secure rental contract system

## Live Demo

Visit the live application at: [https://champion0g.github.io/nft-rental-marketplace](https://champion0g.github.io/nft-rental-marketplace)

## Smart Contracts (Goerli Testnet)

- NFT Contract: `0x...`
- Rental Marketplace: `0x...`
- Mock Token: `0x...`

## Technology Stack

- **Smart Contracts**: Solidity, OpenZeppelin
- **Development Environment**: Hardhat
- **Frontend**: Next.js, ethers.js
- **Testing**: Chai, Mocha
- **Deployment**: GitHub Pages

## Local Development

1. Clone the repository:
```bash
git clone https://github.com/Champion0G/nft-rental-marketplace.git
cd nft-rental-marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
GOERLI_URL=your_alchemy_or_infura_url
PRIVATE_KEY=your_wallet_private_key
```

4. Run tests:
```bash
npx hardhat test
```

5. Start local node:
```bash
npx hardhat node
```

6. Deploy contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

## Testing

The project includes comprehensive tests for all smart contract functionality:

- NFT minting and management
- Rental listing and management
- Fee calculations and distributions
- Rental period enforcement
- Access control

Run tests with:
```bash
npx hardhat test
```

## Contract Architecture

### NFTRental.sol
- ERC721 implementation for NFTs
- Rental management functionality
- Duration and fee calculations

### NFTRentalMarketplace.sol
- Central marketplace contract
- Listing management
- Rental processing
- Fee distribution

### MockToken.sol
- ERC20 token for rental payments
- Used for testing and development

## Frontend Features

- Connect wallet (MetaMask)
- Browse available NFTs
- List NFTs for rent
- Rent NFTs
- View rental history
- Manage active rentals

## Security Considerations

- Reentrancy protection
- Access control for admin functions
- Secure fee calculation and distribution
- Rental period enforcement
- Emergency pause functionality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Champion0G - [@Champion0G](https://github.com/Champion0G)

Project Link: [https://github.com/Champion0G/nft-rental-marketplace](https://github.com/Champion0G/nft-rental-marketplace)

## Local Development Setup

1. Start the Hardhat node:
```bash
npx hardhat node
```

2. Deploy the contracts:
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. Start the Next.js development server:
```bash
npm run dev
```

4. Configure MetaMask:

a. Add Hardhat Network:
- Network Name: Hardhat Local
- RPC URL: http://localhost:8545
- Chain ID: 31337
- Currency Symbol: ETH

b. Import Test Account:
- Copy a private key from the Hardhat node output
- In MetaMask: Click account circle > Import Account
- Paste the private key

c. Add MockToken (MTK):
- In MetaMask, click "Import tokens"
- Token Contract Address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- Token Symbol: MTK
- Decimals: 18

5. Get Test MTK:
- The deployed contract automatically mints 1000 MTK to test accounts
- You can mint more using the contract's mint function

## Using the Marketplace

1. Connect your wallet using the button at the top of the page

2. List an NFT:
- Enter Token ID (1-5 are pre-minted)
- Set price in MTK
- Click "List NFT"

3. Rent an NFT:
- Browse available NFTs
- Choose rental duration
- Click "Rent"
- Approve MTK spending
- Confirm rental transaction

4. View Your Activity:
- Check "Active Rentals" for current rentals
- View "Rental History" for past rentals
- See marketplace stats at the top

## Troubleshooting

1. If transactions fail:
- Ensure Hardhat node is running
- Verify you're on Hardhat Local network in MetaMask
- Check if contracts are deployed
- Make sure you have enough MTK tokens

2. If NFTs don't show up:
- Confirm contracts are deployed
- Check if you own any NFTs (Token IDs 1-5)
- Refresh the page

3. If MTK balance is wrong:
- Verify the token contract address
- Try removing and re-adding the token
- Check if you're connected to the right network

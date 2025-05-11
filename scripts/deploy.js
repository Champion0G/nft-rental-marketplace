const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  try {
    // Deploy MockToken
    console.log("\nDeploying MockToken...");
    const MockToken = await hre.ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log("MockToken deployed to:", mockTokenAddress);

    // Verify ownership
    const owner = await mockToken.owner();
    console.log("MockToken owner:", owner);
    console.log("Deployer address:", deployer.address);
    console.log("Is deployer the owner?", owner.toLowerCase() === deployer.address.toLowerCase());

    // Deploy NFT
    console.log("\nDeploying NFT...");
    const NFT = await hre.ethers.getContractFactory("NFT");
    const nft = await NFT.deploy();
    await nft.waitForDeployment();
    const nftAddress = await nft.getAddress();
    console.log("NFT deployed to:", nftAddress);

    // Deploy NFT Rental Marketplace
    console.log("\nDeploying NFTRentalMarketplace...");
    const marketplaceFeePercentage = 100; // 1%
    const NFTRentalMarketplace = await hre.ethers.getContractFactory("NFTRentalMarketplace");
    const marketplace = await NFTRentalMarketplace.deploy(
      marketplaceFeePercentage,
      deployer.address, // Temporary oracle address
      mockTokenAddress
    );
    await marketplace.waitForDeployment();
    const marketplaceAddress = await marketplace.getAddress();
    console.log("NFTRental Marketplace deployed to:", marketplaceAddress);

    // Deploy MockAIOracle
    console.log("\nDeploying MockAIOracle...");
    const MockAIOracle = await hre.ethers.getContractFactory("MockAIOracle");
    const mockAIOracle = await MockAIOracle.deploy(marketplaceAddress);
    await mockAIOracle.waitForDeployment();
    const mockAIOracleAddress = await mockAIOracle.getAddress();
    console.log("MockAIOracle deployed to:", mockAIOracleAddress);

    // Update marketplace's oracle address
    await marketplace.setAIOracle(mockAIOracleAddress);
    console.log("Updated marketplace oracle address");

    // Mint some NFTs for testing
    console.log("\nMinting NFTs for testing...");
    const mintedTokenIds = [];
    for (let i = 1; i <= 5; i++) {
      try {
        console.log(`Minting NFT #${i}...`);
        const mintTx = await nft.safeMint(deployer.address, `ipfs://QmTest/${i}`);
        const mintReceipt = await mintTx.wait();
        
        const transferEvent = mintReceipt.logs.find(
          log => log.fragment && log.fragment.name === 'Transfer'
        );
        const tokenId = transferEvent.args.tokenId;
        mintedTokenIds.push(tokenId);
        console.log(`NFT #${i} minted successfully with token ID ${tokenId}`);

        const owner = await nft.ownerOf(tokenId);
        console.log(`NFT #${i} owner: ${owner}`);

        const approved = await nft.getApproved(tokenId);
        console.log(`Current approval for NFT #${i}: ${approved}`);

        console.log(`Setting approval for NFT #${i}...`);
        const approveTx = await nft.approve(marketplaceAddress, tokenId);
        const approveReceipt = await approveTx.wait();
        console.log(`NFT #${i} approval confirmed in block ${approveReceipt.blockNumber}`);

        const newApproved = await nft.getApproved(tokenId);
        if (newApproved.toLowerCase() !== marketplaceAddress.toLowerCase()) {
          throw new Error(`Approval verification failed for NFT #${i}`);
        }
        console.log(`NFT #${i} approval verified`);

        console.log(`Listing NFT #${i} for rent...`);
        const pricePerDay = hre.ethers.parseEther("0.01");
        const maxRentDurationDays = 30;
        const useAISuggestedPrice = false;
        const minPriceLimit = hre.ethers.parseEther("0.005");
        const maxPriceLimit = hre.ethers.parseEther("0.05");

        const listTx = await marketplace.listNFT(
          nftAddress,
          tokenId,
          pricePerDay,
          maxRentDurationDays,
          useAISuggestedPrice,
          minPriceLimit,
          maxPriceLimit
        );
        await listTx.wait();
        console.log(`NFT #${i} listed for rent successfully`);
      } catch (error) {
        console.error(`Error processing NFT #${i}:`, error);
        continue;
      }
    }

    // Mint MTK tokens to the deployer
    console.log("\nMinting MTK tokens...");
    try {
      const mintAmount = hre.ethers.parseEther("1000");
      console.log("Attempting to mint", hre.ethers.formatEther(mintAmount), "MTK tokens to", deployer.address);
      const tokenMintTx = await mockToken.mint(deployer.address, mintAmount);
      const mintReceipt = await tokenMintTx.wait();
      console.log("Token mint transaction confirmed in block:", mintReceipt.blockNumber);
      
      // Verify the balance
      const balance = await mockToken.balanceOf(deployer.address);
      console.log("Current MTK balance:", hre.ethers.formatEther(balance));
    } catch (error) {
      console.error("Error minting tokens:", error);
      throw error;
    }

    // Save the contract addresses
    console.log("\nContract Addresses:");
    console.log("MockToken:", mockTokenAddress);
    console.log("NFT:", nftAddress);
    console.log("MockAIOracle:", mockAIOracleAddress);
    console.log("NFTRental Marketplace:", marketplaceAddress);

  } catch (error) {
    console.error("Deployment failed:", error);
    throw error;
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
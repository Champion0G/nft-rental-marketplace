const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockToken
  const MockToken = await hre.ethers.getContractFactory("MockToken");
  const mockToken = await MockToken.deploy();
  await mockToken.waitForDeployment();
  console.log("MockToken deployed to:", await mockToken.getAddress());

  // Deploy NFT
  const NFT = await hre.ethers.getContractFactory("NFT");
  const nft = await NFT.deploy();
  await nft.waitForDeployment();
  console.log("NFT deployed to:", await nft.getAddress());

  // Deploy NFTRentalMarketplace with 2.5% fee
  const NFTRentalMarketplace = await hre.ethers.getContractFactory("NFTRentalMarketplace");
  const marketplace = await NFTRentalMarketplace.deploy(
    250, // 2.5% fee
    deployer.address, // temporary AI oracle
    await mockToken.getAddress() // accepted token
  );
  await marketplace.waitForDeployment();
  console.log("NFTRentalMarketplace deployed to:", await marketplace.getAddress());

  // Deploy MockAIOracle
  const MockAIOracle = await hre.ethers.getContractFactory("MockAIOracle");
  const mockAIOracle = await MockAIOracle.deploy(await marketplace.getAddress());
  await mockAIOracle.waitForDeployment();
  console.log("MockAIOracle deployed to:", await mockAIOracle.getAddress());

  // Set the real AI oracle address
  await marketplace.setAIOracle(await mockAIOracle.getAddress());
  console.log("AI Oracle set in marketplace");

  // Mint some test NFTs
  for (let i = 0; i < 5; i++) {
    await nft.safeMint(deployer.address, `ipfs://test/${i}`);
    console.log(`Minted NFT #${i} to deployer`);
  }

  // Mint some test tokens
  const mintAmount = hre.ethers.parseEther("1000");
  await mockToken.mint(deployer.address, mintAmount);
  console.log(`Minted ${hre.ethers.formatEther(mintAmount)} tokens to deployer`);

  console.log("\nDeployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
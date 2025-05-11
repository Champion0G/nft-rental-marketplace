const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTRentalMarketplace", function () {
  let nft;
  let marketplace;
  let mockToken;
  let mockAIOracle;
  let owner;
  let addr1;
  let addr2;
  let tokenId;
  let listingId;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy MockToken
    const MockToken = await ethers.getContractFactory("MockToken");
    mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();

    // Deploy NFT
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
    await nft.waitForDeployment();

    // Deploy MockAIOracle
    const MockAIOracle = await ethers.getContractFactory("MockAIOracle");
    mockAIOracle = await MockAIOracle.deploy();
    await mockAIOracle.waitForDeployment();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("NFTRentalMarketplace");
    marketplace = await Marketplace.deploy(
      500, // 5% marketplace fee
      await mockAIOracle.getAddress(),
      await mockToken.getAddress()
    );
    await marketplace.waitForDeployment();

    // Mint an NFT for testing
    const tx = await nft.safeMint(addr1.address, "test-uri");
    const receipt = await tx.wait();
    const transferEvent = receipt.logs.find(
      (log) => log.fragment && log.fragment.name === "Transfer"
    );
    tokenId = transferEvent.args[2];

    // List the NFT
    await nft.connect(addr1).setApprovalForAll(await marketplace.getAddress(), true);
    await marketplace.connect(addr1).listNFT(
      await nft.getAddress(),
      tokenId,
      ethers.parseEther("1"), // 1 ETH per day
      7, // 7 days max duration
      false, // don't use AI price
      0, // no min price
      0 // no max price
    );
    listingId = 0;

    // Mint tokens for renting
    await mockToken.mint(addr2.address, ethers.parseEther("1000"));
    await mockToken.connect(addr2).approve(await marketplace.getAddress(), ethers.parseEther("1000"));
  });

  describe("Listing NFTs", function () {
    it("Should allow NFT owner to list NFT for rent", async function () {
      // Mint a new NFT
      const tx = await nft.safeMint(addr1.address, "test-uri-2");
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
      );
      const newTokenId = transferEvent.args[2];

      // Approve marketplace
      await nft.connect(addr1).setApprovalForAll(await marketplace.getAddress(), true);

      // List NFT
      await expect(
        marketplace.connect(addr1).listNFT(
          await nft.getAddress(),
          newTokenId,
          ethers.parseEther("1"), // 1 ETH per day
          7, // 7 days max duration
          false, // don't use AI price
          0, // no min price
          0 // no max price
        )
      )
        .to.emit(marketplace, "NFTListed")
        .withArgs(
          1, // listingId
          await nft.getAddress(),
          newTokenId,
          addr1.address,
          ethers.parseEther("1"),
          7
        );

      // Verify listing details
      const listing = await marketplace.getListingDetails(1);
      expect(listing.nftContract).to.equal(await nft.getAddress());
      expect(listing.tokenId).to.equal(newTokenId);
      expect(listing.lister).to.equal(addr1.address);
      expect(listing.rentalPricePerDay).to.equal(ethers.parseEther("1"));
      expect(listing.maxRentDurationDays).to.equal(7);
      expect(listing.status).to.equal(0); // Available
    });

    it("Should not allow non-owner to list NFT", async function () {
      await expect(
        marketplace.connect(addr2).listNFT(
          await nft.getAddress(),
          tokenId,
          ethers.parseEther("1"),
          7,
          false,
          0,
          0
        )
      ).to.be.revertedWith("Not token owner");
    });

    it("Should not allow listing without approval", async function () {
      // Mint a new NFT
      const tx = await nft.safeMint(addr1.address, "test-uri-2");
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
      );
      const newTokenId = transferEvent.args[2];

      // Ensure no approval
      await nft.connect(addr1).setApprovalForAll(await marketplace.getAddress(), false);

      // Try to list without approval
      await expect(
        marketplace.connect(addr1).listNFT(
          await nft.getAddress(),
          newTokenId,
          ethers.parseEther("1"),
          7,
          false,
          0,
          0
        )
      ).to.be.revertedWith("Not approved");
    });

    it("Should validate listing parameters", async function () {
      // Mint a new NFT
      const tx = await nft.safeMint(addr1.address, "test-uri-2");
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
      );
      const newTokenId = transferEvent.args[2];

      // Approve marketplace
      await nft.connect(addr1).setApprovalForAll(await marketplace.getAddress(), true);

      // Test invalid duration
      await expect(
        marketplace.connect(addr1).listNFT(
          await nft.getAddress(),
          newTokenId,
          ethers.parseEther("1"),
          0, // invalid duration
          false,
          0,
          0
        )
      ).to.be.revertedWith("Invalid duration");

      // Test invalid price
      await expect(
        marketplace.connect(addr1).listNFT(
          await nft.getAddress(),
          newTokenId,
          0, // invalid price
          7,
          false,
          0,
          0
        )
      ).to.be.revertedWith("Invalid price");
    });
  });

  describe("Renting NFTs", function () {
    it("Should allow renting an available NFT", async function () {
      const durationDays = 3;
      const totalFee = ethers.parseEther("3"); // 1 ETH per day * 3 days
      const marketplaceFee = totalFee * 500n / 10000n; // 5% fee
      const listerFee = totalFee - marketplaceFee;

      // Rent NFT
      const tx = await marketplace.connect(addr2).rentNFT(listingId, durationDays);
      const receipt = await tx.wait();

      // Get block timestamp
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const endTimestamp = block.timestamp + (durationDays * 24 * 60 * 60);

      // Verify event
      const rentedEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "NFTRented"
      );
      expect(rentedEvent.args[0]).to.equal(listingId);
      expect(rentedEvent.args[1]).to.equal(addr2.address);
      expect(rentedEvent.args[2]).to.equal(endTimestamp);
      expect(rentedEvent.args[3]).to.equal(totalFee);

      // Verify rental details
      const rental = await marketplace.getRentalDetails(listingId);
      expect(rental.renter).to.equal(addr2.address);
      expect(rental.totalFee).to.equal(totalFee);
      expect(rental.isActive).to.equal(true);

      // Verify token transfers
      expect(await mockToken.balanceOf(addr1.address)).to.equal(listerFee);
      expect(await mockToken.balanceOf(await marketplace.getAddress())).to.equal(marketplaceFee);
    });

    it("Should not allow renting an already rented NFT", async function () {
      // First rental
      await marketplace.connect(addr2).rentNFT(listingId, 3);

      // Second rental attempt
      await expect(
        marketplace.connect(addr2).rentNFT(listingId, 3)
      ).to.be.revertedWith("Not available");
    });

    it("Should not allow renting for invalid duration", async function () {
      await expect(
        marketplace.connect(addr2).rentNFT(listingId, 0)
      ).to.be.revertedWith("Invalid duration");

      await expect(
        marketplace.connect(addr2).rentNFT(listingId, 8) // Max duration is 7 days
      ).to.be.revertedWith("Invalid duration");
    });

    it("Should allow ending a rental after duration", async function () {
      // Rent the NFT
      await marketplace.connect(addr2).rentNFT(listingId, 3);

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [3 * 24 * 60 * 60]); // 3 days
      await ethers.provider.send("evm_mine");

      // End the rental
      await expect(
        marketplace.connect(addr2).endRental(listingId)
      )
        .to.emit(marketplace, "RentalEnded")
        .withArgs(listingId, tokenId);

      // Verify rental status
      const rental = await marketplace.getRentalDetails(listingId);
      expect(rental.isActive).to.equal(false);

      // Verify NFT ownership
      expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
    });

    it("Should not allow ending a rental before duration", async function () {
      // Rent the NFT
      await marketplace.connect(addr2).rentNFT(listingId, 3);

      // Try to end the rental immediately
      await expect(
        marketplace.connect(owner).endRental(listingId)
      ).to.be.revertedWith("Not authorized");
    });
  });
});
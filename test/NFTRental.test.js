const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTRental", function () {
  let nftRental;
  let owner;
  let renter;
  let addr2;
  let tokenId;

  beforeEach(async function () {
    [owner, renter, addr2] = await ethers.getSigners();

    // Deploy NFTRental
    const NFTRental = await ethers.getContractFactory("NFTRental");
    nftRental = await NFTRental.deploy();
    await nftRental.waitForDeployment();

    // Mint an NFT for testing
    await nftRental.mint();
    tokenId = 1; // First token ID
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nftRental.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nftRental.name()).to.equal("NFT Rental");
      expect(await nftRental.symbol()).to.equal("NFTR");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint NFTs", async function () {
      await nftRental.mint();
      expect(await nftRental.ownerOf(2)).to.equal(owner.address);
      expect(await nftRental.lastTokenId()).to.equal(2);
    });

    it("Should not allow non-owner to mint NFTs", async function () {
      await expect(
        nftRental.connect(renter).mint()
      ).to.be.revertedWithCustomError(nftRental, "OwnableUnauthorizedAccount");
    });
  });

  describe("Rental Features", function () {
    it("Should calculate rental fee correctly", async function () {
      const oneDayFee = await nftRental.BASE_FEE_PER_DAY();
      
      // Test 1 day rental
      const oneDayDuration = 24 * 60 * 60; // 1 day in seconds
      expect(await nftRental.calculateRentalFee(oneDayDuration)).to.equal(oneDayFee);

      // Test 3 day rental
      const threeDayDuration = 3 * 24 * 60 * 60;
      expect(await nftRental.calculateRentalFee(threeDayDuration)).to.equal(oneDayFee * 3n);
    });

    it("Should not allow rental duration less than minimum", async function () {
      const minDuration = await nftRental.MINIMUM_RENTAL_DURATION();
      await expect(
        nftRental.calculateRentalFee(minDuration - 1n)
      ).to.be.revertedWith("Duration too short");
    });

    it("Should not allow rental duration more than maximum", async function () {
      const maxDuration = await nftRental.MAXIMUM_RENTAL_DURATION();
      await expect(
        nftRental.calculateRentalFee(maxDuration + 1n)
      ).to.be.revertedWith("Duration too long");
    });

    it("Should allow renting an NFT", async function () {
      const duration = 24 * 60 * 60; // 1 day
      const fee = await nftRental.calculateRentalFee(duration);
      const renterEmail = "test@example.com";

      await expect(
        nftRental.connect(renter).rentNFT(tokenId, duration, renterEmail, { value: fee })
      )
        .to.emit(nftRental, "NFTRented")
        .withArgs(tokenId, renter.address, duration, fee);

      const rental = await nftRental.getRentalDetails(tokenId);
      expect(rental.renter).to.equal(renter.address);
      expect(rental.renterEmail).to.equal(renterEmail);
      expect(rental.duration).to.equal(duration);
      expect(rental.rentalFee).to.equal(fee);
      expect(rental.isRented).to.equal(true);
    });

    it("Should not allow renting an already rented NFT", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // First rental
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Second rental attempt
      await expect(
        nftRental.connect(addr2).rentNFT(tokenId, duration, "test2@example.com", { value: fee })
      ).to.be.revertedWith("Token is already rented");
    });

    it("Should not allow renting with insufficient fee", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      await expect(
        nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee - 1n })
      ).to.be.revertedWith("Insufficient rental fee");
    });

    it("Should refund excess rental fee", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);
      const excess = ethers.parseEther("1");

      const initialBalance = await ethers.provider.getBalance(renter.address);
      
      // Rent with excess payment
      const tx = await nftRental.connect(renter).rentNFT(
        tokenId, 
        duration, 
        "test@example.com", 
        { value: fee + excess }
      );
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(renter.address);
      
      // Final balance should be initial balance minus fee and gas, but with excess refunded
      expect(finalBalance).to.equal(initialBalance - fee - gasUsed);
    });

    it("Should allow returning an NFT after rental period", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // Rent NFT
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [duration]);
      await ethers.provider.send("evm_mine");

      // Return NFT
      await expect(
        nftRental.connect(renter).returnNFT(tokenId)
      )
        .to.emit(nftRental, "NFTReturned")
        .withArgs(tokenId, renter.address);

      const rental = await nftRental.getRentalDetails(tokenId);
      expect(rental.isRented).to.equal(false);
    });

    it("Should not allow returning an NFT before rental period ends", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // Rent NFT
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Try to return immediately
      await expect(
        nftRental.connect(renter).returnNFT(tokenId)
      ).to.be.revertedWith("Rental period is not over yet");
    });

    it("Should allow checking expired rentals", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // Rent NFT
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [duration]);
      await ethers.provider.send("evm_mine");

      // Check expired rental
      await expect(
        nftRental.checkExpiredRentals(tokenId)
      )
        .to.emit(nftRental, "RentalExpired")
        .withArgs(tokenId, renter.address);

      const rental = await nftRental.getRentalDetails(tokenId);
      expect(rental.isRented).to.equal(false);
    });

    it("Should track user rentals correctly", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // Rent first NFT
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Mint and rent second NFT
      await nftRental.mint();
      await nftRental.connect(renter).rentNFT(2, duration, "test@example.com", { value: fee });

      // Check user rentals
      const userRentals = await nftRental.getRentalsByUser(renter.address);
      expect(userRentals.length).to.equal(2);
      expect(userRentals[0]).to.equal(tokenId);
      expect(userRentals[1]).to.equal(2);
    });

    it("Should return active rentals correctly", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      // Rent first NFT
      await nftRental.connect(renter).rentNFT(tokenId, duration, "test@example.com", { value: fee });

      // Mint and rent second NFT with longer duration
      await nftRental.mint();
      await nftRental.connect(renter).rentNFT(2, duration * 2, "test@example.com", { value: fee * 2n });

      // Fast forward time to expire first rental
      await ethers.provider.send("evm_increaseTime", [duration]);
      await ethers.provider.send("evm_mine");

      // Return first NFT
      await nftRental.checkExpiredRentals(tokenId);

      // Check active rentals
      const activeRentals = await nftRental.getActiveRentals();
      expect(activeRentals.length).to.equal(1);
      expect(activeRentals[0]).to.equal(2);
    });
  });

  describe("Viewing Rental Listings", function () {
    beforeEach(async function () {
      // Mint multiple NFTs
      await nftRental.mint(); // tokenId 2
      await nftRental.mint(); // tokenId 3

      const duration = 24 * 60 * 60; // 1 day
      const fee = await nftRental.calculateRentalFee(duration);

      // Create some rentals
      await nftRental.connect(renter).rentNFT(1, duration, "renter1@example.com", { value: fee });
      await nftRental.connect(addr2).rentNFT(2, duration * 2, "renter2@example.com", { value: fee * 2n });
      // Leave tokenId 3 unrented
    });

    it("Should get rental details for a specific NFT", async function () {
      const duration = 24 * 60 * 60;
      const fee = await nftRental.calculateRentalFee(duration);

      const rental = await nftRental.getRentalDetails(1);
      expect(rental.renter).to.equal(renter.address);
      expect(rental.renterEmail).to.equal("renter1@example.com");
      expect(rental.duration).to.equal(duration);
      expect(rental.rentalFee).to.equal(fee);
      expect(rental.isRented).to.equal(true);
    });

    it("Should get all rentals for a specific user", async function () {
      const [tokenIds, isActive, endTimes] = await nftRental.getUserRentals(renter.address);
      
      // Should have one rental
      expect(tokenIds.length).to.equal(1);
      expect(tokenIds[0]).to.equal(1);
      expect(isActive[0]).to.equal(true);
      
      // End time should be start time + duration
      const rental = await nftRental.getRentalDetails(1);
      expect(endTimes[0]).to.equal(rental.startTime + rental.duration);
    });

    it("Should get all active rentals", async function () {
      const activeRentals = await nftRental.getActiveRentals();
      expect(activeRentals.length).to.equal(2); // Two active rentals
      expect(activeRentals.map(n => Number(n))).to.include(1); // First rental
      expect(activeRentals.map(n => Number(n))).to.include(2); // Second rental
    });

    it("Should show expired rentals as inactive", async function () {
      // Fast forward time to expire first rental
      const duration = 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [duration]);
      await ethers.provider.send("evm_mine");

      // Get active rentals
      const activeRentals = await nftRental.getActiveRentals();
      expect(activeRentals.length).to.equal(1); // Only the second rental should be active
      expect(activeRentals[0]).to.equal(2); // Second rental with longer duration

      // Check user rentals
      const [tokenIds, isActive, endTimes] = await nftRental.getUserRentals(renter.address);
      expect(tokenIds[0]).to.equal(1);
      expect(isActive[0]).to.equal(true); // Still marked as rented until explicitly returned
    });

    it("Should check all expired rentals at once", async function () {
      // Fast forward time to expire first rental
      const duration = 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [duration]);
      await ethers.provider.send("evm_mine");

      // Check all expired rentals
      await nftRental.checkAllExpiredRentals();

      // Get active rentals
      const activeRentals = await nftRental.getActiveRentals();
      expect(activeRentals.length).to.equal(1); // Only the second rental should be active
      expect(activeRentals[0]).to.equal(2); // Second rental with longer duration

      // Check first rental details
      const rental = await nftRental.getRentalDetails(1);
      expect(rental.isRented).to.equal(false); // Should be marked as not rented
    });
  });
}); 
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory("NFT");
    nft = await NFT.deploy();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await nft.name()).to.equal("Test NFT");
      expect(await nft.symbol()).to.equal("TNFT");
    });
  });

  describe("Minting", function () {
    it("Should allow owner to mint NFTs", async function () {
      const tx = await nft.safeMint(addr1.address, "test-uri");
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
      );
      const tokenId = transferEvent.args[2];
      
      expect(await nft.ownerOf(tokenId)).to.equal(addr1.address);
      expect(await nft.tokenURI(tokenId)).to.equal("test-uri");
    });

    it("Should not allow non-owner to mint NFTs", async function () {
      await expect(
        nft.connect(addr1).safeMint(addr2.address, "test-uri")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("ERC721 Compliance", function () {
    let tokenId;

    beforeEach(async function () {
      const tx = await nft.safeMint(addr1.address, "test-uri");
      const receipt = await tx.wait();
      const transferEvent = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "Transfer"
      );
      tokenId = transferEvent.args[2];
    });

    it("Should support ERC721 interface", async function () {
      expect(await nft.supportsInterface("0x80ac58cd")).to.equal(true); // ERC721
    });

    it("Should allow token transfers", async function () {
      await nft.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId);
      expect(await nft.ownerOf(tokenId)).to.equal(addr2.address);
    });

    it("Should emit Transfer event", async function () {
      await expect(nft.connect(addr1).transferFrom(addr1.address, addr2.address, tokenId))
        .to.emit(nft, "Transfer")
        .withArgs(addr1.address, addr2.address, tokenId);
    });

    it("Should handle approvals correctly", async function () {
      await nft.connect(addr1).approve(addr2.address, tokenId);
      expect(await nft.getApproved(tokenId)).to.equal(addr2.address);
    });
  });
}); 
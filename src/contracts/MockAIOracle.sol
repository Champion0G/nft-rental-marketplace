// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./NFTRentalMarketplace.sol";

contract MockAIOracle is Ownable {
    NFTRentalMarketplace public marketplace;

    constructor(address _marketplace) Ownable(msg.sender) {
        marketplace = NFTRentalMarketplace(_marketplace);
    }

    function updateSuggestedPrice(uint256 listingId, uint256 suggestedPrice) external onlyOwner {
        marketplace.updateAISuggestedPrice(listingId, suggestedPrice);
    }

    function updateNFTScore(address nftContract, uint256 tokenId, uint8 score) external onlyOwner {
        marketplace.updateNFTAIScore(nftContract, tokenId, score);
    }
} 
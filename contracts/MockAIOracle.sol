// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MockAIOracle is Ownable {
    constructor() Ownable(msg.sender) {}

    function updateAISuggestedPrice(uint256 listingId, uint256 suggestedPrice) external {
        // Mock implementation
    }

    function updateNFTAIScore(address nftContract, uint256 tokenId, uint8 score) external {
        // Mock implementation
    }
} 
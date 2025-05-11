// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract HoardingRental is ERC721, Ownable {
    struct RentalData {
        address renter;
        uint256 rentalStartTime;
        uint256 rentalDuration;
        uint256 rentalFee;
        bool isRented;
    }

    mapping(uint256 => RentalData) private _rentalData;
    uint256 private _nextTokenId;

    event NFTListedForRent(uint256 indexed tokenId, uint256 duration, uint256 rentalFee);
    event NFTRented(uint256 indexed tokenId, address indexed renter, uint256 duration, uint256 rentalFee);
    event NFTRentalEnded(uint256 indexed tokenId, address indexed renter);

    constructor() ERC721("HoardingRental", "HRENT") Ownable(msg.sender) {}

    function listNFTForRent(uint256 tokenId, uint256 rentalDuration, uint256 rentalFee) external {
        require(ownerOf(tokenId) == msg.sender, "Only the owner can list the NFT for rent");
        require(_rentalData[tokenId].isRented == false, "NFT is already rented");

        _rentalData[tokenId] = RentalData({
            renter: address(0),
            rentalStartTime: 0,
            rentalDuration: rentalDuration,
            rentalFee: rentalFee,
            isRented: false
        });

        emit NFTListedForRent(tokenId, rentalDuration, rentalFee);
    }

    function rentNFT(uint256 tokenId) public payable {
        try this.ownerOf(tokenId) returns (address) {} catch {
            revert("Token does not exist");
        }
        
        RentalData storage rentalData = _rentalData[tokenId];

        require(rentalData.isRented == false, "NFT is already rented");
        require(rentalData.rentalFee > 0, "This NFT is not available for rent");
        require(msg.value == rentalData.rentalFee, "Incorrect rental fee sent");

        // Transfer the rental fee to the owner
        address owner = ownerOf(tokenId);
        payable(owner).transfer(msg.value);

        // Update rental data
        rentalData.renter = msg.sender;
        rentalData.rentalStartTime = block.timestamp;
        rentalData.isRented = true;

        emit NFTRented(tokenId, msg.sender, rentalData.rentalDuration, rentalData.rentalFee);
    }

    function endRental(uint256 tokenId) public {
        try this.ownerOf(tokenId) returns (address) {} catch {
            revert("Token does not exist");
        }
        
        RentalData storage rentalData = _rentalData[tokenId];

        require(rentalData.isRented == true, "NFT is not currently rented");
        require(msg.sender == rentalData.renter || msg.sender == ownerOf(tokenId), "Not authorized to end rental");

        uint256 rentalEndTime = rentalData.rentalStartTime + rentalData.rentalDuration;
        require(block.timestamp >= rentalEndTime, "Rental period is not over yet");

        // Reset the rental data
        rentalData.renter = address(0);
        rentalData.rentalStartTime = 0;
        rentalData.isRented = false;

        emit NFTRentalEnded(tokenId, msg.sender);
    }

    function getRentalData(uint256 tokenId) public view returns (
        address renter,
        uint256 rentalStartTime,
        uint256 rentalDuration,
        bool isRented,
        uint256 rentalFee
    ) {
        try this.ownerOf(tokenId) returns (address) {} catch {
            revert("Token does not exist");
        }
        
        RentalData storage rentalData = _rentalData[tokenId];
        return (
            rentalData.renter,
            rentalData.rentalStartTime,
            rentalData.rentalDuration,
            rentalData.isRented,
            rentalData.rentalFee
        );
    }

    function mint() public {
        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract NFTRentalMarketplace is ERC721Holder, Ownable, ReentrancyGuard {
    // Structs
    struct Listing {
        address nftContract;
        uint256 tokenId;
        address lister;
        uint256 rentalPricePerDay;
        uint256 maxRentDurationDays;
        ListingStatus status;
        uint256 aiSuggestedPricePerDay;
        bool useAISuggestedPrice;
        uint256 minPriceLimit;
        uint256 maxPriceLimit;
    }

    struct Rental {
        address renter;
        uint256 startTime;
        uint256 endTime;
        uint256 totalFee;
        bool isActive;
    }

    // Enums
    enum ListingStatus { Available, Rented, Expired }

    // State variables
    uint256 private _nextListingId;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Rental) public rentals;
    mapping(address => mapping(uint256 => uint8)) public nftAIScore;
    uint256 public marketplaceFeePercentage;
    address public aiOracle;
    IERC20 public acceptedToken;

    // Events
    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address lister,
        uint256 pricePerDay,
        uint256 maxDuration
    );

    event NFTRented(
        uint256 indexed listingId,
        address indexed renter,
        uint256 rentalEndTime,
        uint256 totalFee
    );

    event RentalEnded(uint256 indexed listingId, uint256 tokenId);
    event NFTDelisted(uint256 indexed listingId);
    event AISuggestedPriceUpdated(uint256 indexed listingId, uint256 suggestedPrice);
    event NFTAIScoreUpdated(address indexed nftContract, uint256 indexed tokenId, uint8 score);

    // Constructor
    constructor(uint256 _marketplaceFeePercentage, address _aiOracle, address _acceptedToken) Ownable(msg.sender) ReentrancyGuard() {
        require(_marketplaceFeePercentage <= 500, "Fee cannot exceed 5%");
        marketplaceFeePercentage = _marketplaceFeePercentage;
        aiOracle = _aiOracle;
        acceptedToken = IERC20(_acceptedToken);
    }

    // Core functions
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 rentalPricePerDay,
        uint256 maxRentDurationDays,
        bool useAISuggestedPrice,
        uint256 minPriceLimit,
        uint256 maxPriceLimit
    ) external returns (uint256) {
        require(maxRentDurationDays > 0, "Invalid duration");
        require(rentalPricePerDay > 0, "Invalid price");

        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            nft.getApproved(tokenId) == address(this) || 
            nft.isApprovedForAll(msg.sender, address(this)), 
            "Not approved"
        );

        uint256 listingId = _nextListingId++;
        listings[listingId] = Listing({
            nftContract: nftContract,
            tokenId: tokenId,
            lister: msg.sender,
            rentalPricePerDay: rentalPricePerDay,
            maxRentDurationDays: maxRentDurationDays,
            status: ListingStatus.Available,
            aiSuggestedPricePerDay: 0,
            useAISuggestedPrice: useAISuggestedPrice,
            minPriceLimit: minPriceLimit,
            maxPriceLimit: maxPriceLimit
        });

        nft.safeTransferFrom(msg.sender, address(this), tokenId);

        emit NFTListed(
            listingId,
            nftContract,
            tokenId,
            msg.sender,
            rentalPricePerDay,
            maxRentDurationDays
        );

        return listingId;
    }

    function rentNFT(uint256 listingId, uint256 durationDays) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Available, "Not available");
        require(durationDays > 0 && durationDays <= listing.maxRentDurationDays, "Invalid duration");

        uint256 pricePerDay = listing.useAISuggestedPrice ? listing.aiSuggestedPricePerDay : listing.rentalPricePerDay;
        if (listing.useAISuggestedPrice) {
            require(pricePerDay >= listing.minPriceLimit && pricePerDay <= listing.maxPriceLimit, "Price out of bounds");
        }

        uint256 totalFee = pricePerDay * durationDays;
        uint256 marketplaceFee = (totalFee * marketplaceFeePercentage) / 10000;
        uint256 listerFee = totalFee - marketplaceFee;

        // Transfer fees
        require(acceptedToken.transferFrom(msg.sender, address(this), marketplaceFee), "Fee transfer failed");
        require(acceptedToken.transferFrom(msg.sender, listing.lister, listerFee), "Fee transfer failed");

        // Update listing and rental status
        listing.status = ListingStatus.Rented;
        rentals[listingId] = Rental({
            renter: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDays * 1 days),
            totalFee: totalFee,
            isActive: true
        });

        emit NFTRented(listingId, msg.sender, rentals[listingId].endTime, totalFee);
    }

    function endRental(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        Rental storage rental = rentals[listingId];

        require(listing.status == ListingStatus.Rented, "Not rented");
        require(rental.isActive, "Rental not active");
        require(
            msg.sender == rental.renter || msg.sender == listing.lister || block.timestamp >= rental.endTime,
            "Not authorized"
        );

        // Return NFT to lister
        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.lister, listing.tokenId);

        // Update status
        listing.status = ListingStatus.Expired;
        rental.isActive = false;

        emit RentalEnded(listingId, listing.tokenId);
    }

    function delistNFT(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.lister == msg.sender, "Not lister");
        require(listing.status == ListingStatus.Available, "Not available");

        // Return NFT to lister
        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.lister, listing.tokenId);

        // Update status
        listing.status = ListingStatus.Expired;

        emit NFTDelisted(listingId);
    }

    // AI Oracle functions
    function updateAISuggestedPrice(uint256 listingId, uint256 suggestedPrice) external {
        require(msg.sender == aiOracle, "Not oracle");
        listings[listingId].aiSuggestedPricePerDay = suggestedPrice;
        emit AISuggestedPriceUpdated(listingId, suggestedPrice);
    }

    function updateNFTAIScore(address nftContract, uint256 tokenId, uint8 score) external {
        require(msg.sender == aiOracle, "Not oracle");
        nftAIScore[nftContract][tokenId] = score;
        emit NFTAIScoreUpdated(nftContract, tokenId, score);
    }

    // View functions
    function getListingDetails(uint256 listingId) external view returns (
        address nftContract,
        uint256 tokenId,
        address lister,
        uint256 rentalPricePerDay,
        uint256 maxRentDurationDays,
        ListingStatus status,
        uint256 aiSuggestedPricePerDay,
        bool useAISuggestedPrice,
        uint256 minPriceLimit,
        uint256 maxPriceLimit
    ) {
        Listing storage listing = listings[listingId];
        return (
            listing.nftContract,
            listing.tokenId,
            listing.lister,
            listing.rentalPricePerDay,
            listing.maxRentDurationDays,
            listing.status,
            listing.aiSuggestedPricePerDay,
            listing.useAISuggestedPrice,
            listing.minPriceLimit,
            listing.maxPriceLimit
        );
    }

    function getRentalDetails(uint256 listingId) external view returns (
        address renter,
        uint256 startTime,
        uint256 endTime,
        uint256 totalFee,
        bool isActive
    ) {
        Rental storage rental = rentals[listingId];
        return (
            rental.renter,
            rental.startTime,
            rental.endTime,
            rental.totalFee,
            rental.isActive
        );
    }

    // Admin functions
    function setAIOracle(address _aiOracle) external onlyOwner {
        aiOracle = _aiOracle;
    }

    function setMarketplaceFee(uint256 _marketplaceFeePercentage) external onlyOwner {
        require(_marketplaceFeePercentage <= 500, "Fee cannot exceed 5%");
        marketplaceFeePercentage = _marketplaceFeePercentage;
    }

    function withdrawMarketplaceFees() external onlyOwner {
        uint256 balance = acceptedToken.balanceOf(address(this));
        require(balance > 0, "No fees to withdraw");
        require(acceptedToken.transfer(msg.sender, balance), "Transfer failed");
    }
} 
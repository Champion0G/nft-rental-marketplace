// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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
    constructor(uint256 _marketplaceFeePercentage, address _aiOracle, address _acceptedToken) Ownable(msg.sender) {
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
        require(nft.getApproved(tokenId) == address(this), "Not approved");

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

    function rentNFT(uint256 listingId, uint256 durationDaysToRent) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.status == ListingStatus.Available, "Not available");
        require(durationDaysToRent <= listing.maxRentDurationDays, "Duration too long");

        uint256 rentalPrice = listing.useAISuggestedPrice ? 
            listing.aiSuggestedPricePerDay : 
            listing.rentalPricePerDay;

        if (listing.useAISuggestedPrice) {
            require(rentalPrice >= listing.minPriceLimit && rentalPrice <= listing.maxPriceLimit, "AI price out of bounds");
        }

        uint256 totalFee = rentalPrice * durationDaysToRent;
        uint256 marketplaceFee = (totalFee * marketplaceFeePercentage) / 10000;
        uint256 listerFee = totalFee - marketplaceFee;

        // Handle payment
        if (msg.value > 0) {
            require(msg.value == totalFee, "Incorrect ETH amount");
            payable(listing.lister).transfer(listerFee);
            payable(owner()).transfer(marketplaceFee);
        } else {
            require(acceptedToken.transferFrom(msg.sender, listing.lister, listerFee), "Token transfer failed");
            require(acceptedToken.transferFrom(msg.sender, owner(), marketplaceFee), "Fee transfer failed");
        }

        // Handle royalties if supported
        if (_supportsRoyalties(listing.nftContract)) {
            (address receiver, uint256 royaltyAmount) = IERC2981(listing.nftContract).royaltyInfo(listing.tokenId, totalFee);
            if (royaltyAmount > 0) {
                if (msg.value > 0) {
                    payable(receiver).transfer(royaltyAmount);
                } else {
                    require(acceptedToken.transferFrom(msg.sender, receiver, royaltyAmount), "Royalty transfer failed");
                }
                listerFee -= royaltyAmount;
            }
        }

        // Create rental
        rentals[listingId] = Rental({
            renter: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + (durationDaysToRent * 1 days),
            totalFee: totalFee,
            isActive: true
        });

        listing.status = ListingStatus.Rented;

        emit NFTRented(listingId, msg.sender, rentals[listingId].endTime, totalFee);
    }

    function endRental(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        Rental storage rental = rentals[listingId];
        require(listing.status == ListingStatus.Rented, "Not rented");
        require(block.timestamp >= rental.endTime, "Rental not expired");

        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.lister, listing.tokenId);
        listing.status = ListingStatus.Available;
        rental.isActive = false;

        emit RentalEnded(listingId, listing.tokenId);
    }

    function delistNFT(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(msg.sender == listing.lister, "Not lister");
        require(listing.status != ListingStatus.Rented, "Currently rented");

        IERC721(listing.nftContract).safeTransferFrom(address(this), listing.lister, listing.tokenId);
        delete listings[listingId];

        emit NFTDelisted(listingId);
    }

    // AI Integration functions
    function updateAISuggestedPrice(uint256 listingId, uint256 suggestedPrice) external {
        require(msg.sender == aiOracle, "Not AI oracle");
        listings[listingId].aiSuggestedPricePerDay = suggestedPrice;
        emit AISuggestedPriceUpdated(listingId, suggestedPrice);
    }

    function updateNFTAIScore(address nftContract, uint256 tokenId, uint8 score) external {
        require(msg.sender == aiOracle, "Not AI oracle");
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
    function setMarketplaceFeePercentage(uint256 _marketplaceFeePercentage) external onlyOwner {
        require(_marketplaceFeePercentage <= 500, "Fee cannot exceed 5%");
        marketplaceFeePercentage = _marketplaceFeePercentage;
    }

    function setAIOracle(address _aiOracle) external onlyOwner {
        aiOracle = _aiOracle;
    }

    function setAcceptedToken(address _acceptedToken) external onlyOwner {
        acceptedToken = IERC20(_acceptedToken);
    }

    // Internal functions
    function _supportsRoyalties(address nftContract) internal view returns (bool) {
        try IERC2981(nftContract).royaltyInfo(0, 100) returns (address, uint256) {
            return true;
        } catch {
            return false;
        }
    }
} 
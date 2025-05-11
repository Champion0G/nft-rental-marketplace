// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract NFTRental is ERC721Enumerable, Ownable {
    using Address for address;
    
    uint256 public lastTokenId;
    uint256 public constant BASE_FEE_PER_DAY = 0.01 ether;
    uint256 public constant MINIMUM_RENTAL_DURATION = 1 hours;
    uint256 public constant MAXIMUM_RENTAL_DURATION = 30 days;

    struct Rental {
        address renter;
        string renterEmail;
        uint256 startTime;
        uint256 duration;
        uint256 rentalFee;
        bool isRented;
    }

    mapping(uint256 => Rental) public rentals;
    mapping(address => uint256[]) private userRentals;

    event NFTRented(uint256 indexed tokenId, address indexed renter, uint256 duration, uint256 rentalFee);
    event NFTReturned(uint256 indexed tokenId, address indexed renter);
    event RentalExpired(uint256 indexed tokenId, address indexed renter);

    constructor() ERC721("NFT Rental", "NFTR") Ownable(msg.sender) {}

    function mint() external onlyOwner {
        lastTokenId++;
        _safeMint(msg.sender, lastTokenId);
    }

    function calculateRentalFee(uint256 duration) public pure returns (uint256) {
        require(duration >= MINIMUM_RENTAL_DURATION, "Duration too short");
        require(duration <= MAXIMUM_RENTAL_DURATION, "Duration too long");
        
        uint256 daysCount = (duration + 1 days - 1) / 1 days; // Round up to nearest day
        return daysCount * BASE_FEE_PER_DAY;
    }

    function rentNFT(uint256 tokenId, uint256 duration, string calldata renterEmail) external payable {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!rentals[tokenId].isRented, "Token is already rented");
        
        uint256 rentalFee = calculateRentalFee(duration);
        require(msg.value >= rentalFee, "Insufficient rental fee");

        rentals[tokenId] = Rental({
            renter: msg.sender,
            renterEmail: renterEmail,
            startTime: block.timestamp,
            duration: duration,
            rentalFee: rentalFee,
            isRented: true
        });

        userRentals[msg.sender].push(tokenId);
        
        // Transfer fee to owner
        payable(ownerOf(tokenId)).transfer(rentalFee);
        
        // Refund excess payment if any
        if (msg.value > rentalFee) {
            payable(msg.sender).transfer(msg.value - rentalFee);
        }

        emit NFTRented(tokenId, msg.sender, duration, rentalFee);
    }

    function returnNFT(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(rentals[tokenId].isRented, "Token is not rented");
        require(rentals[tokenId].renter == msg.sender, "Not the renter");
        require(block.timestamp >= rentals[tokenId].startTime + rentals[tokenId].duration, "Rental period is not over yet");

        _returnNFT(tokenId);
        emit NFTReturned(tokenId, msg.sender);
    }

    function checkExpiredRentals(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        if (isRentalExpired(tokenId)) {
            address renter = rentals[tokenId].renter;
            _returnNFT(tokenId);
            emit RentalExpired(tokenId, renter);
        }
    }

    function _returnNFT(uint256 tokenId) internal {
        delete rentals[tokenId];
    }

    function isRentalExpired(uint256 tokenId) public view returns (bool) {
        if (!rentals[tokenId].isRented) {
            return false;
        }
        return block.timestamp >= rentals[tokenId].startTime + rentals[tokenId].duration;
    }

    function getRentalsByUser(address user) external view returns (uint256[] memory) {
        return userRentals[user];
    }

    function getRentalDetails(uint256 tokenId) external view returns (
        address renter,
        string memory renterEmail,
        uint256 startTime,
        uint256 duration,
        uint256 rentalFee,
        bool isRented
    ) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        Rental storage rental = rentals[tokenId];
        return (
            rental.renter,
            rental.renterEmail,
            rental.startTime,
            rental.duration,
            rental.rentalFee,
            rental.isRented
        );
    }

    function checkAllExpiredRentals() external {
        for (uint256 i = 1; i <= lastTokenId; i++) {
            if (_ownerOf(i) != address(0) && isRentalExpired(i)) {
                address renter = rentals[i].renter;
                _returnNFT(i);
                emit RentalExpired(i, renter);
            }
        }
    }

    function getUserRentals(address user) external view returns (
        uint256[] memory tokenIds,
        bool[] memory isActive,
        uint256[] memory endTimes
    ) {
        uint256[] memory userTokens = userRentals[user];
        uint256 length = userTokens.length;
        
        tokenIds = new uint256[](length);
        isActive = new bool[](length);
        endTimes = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            uint256 tokenId = userTokens[i];
            require(_ownerOf(tokenId) != address(0), "Token does not exist");
            
            tokenIds[i] = tokenId;
            isActive[i] = rentals[tokenId].isRented;
            endTimes[i] = rentals[tokenId].startTime + rentals[tokenId].duration;
        }
        
        return (tokenIds, isActive, endTimes);
    }

    function getActiveRentals() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= lastTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                if (rentals[i].isRented && !isRentalExpired(i)) {
                    count++;
                }
            }
        }
        
        uint256[] memory activeRentals = new uint256[](count);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= lastTokenId; i++) {
            if (_ownerOf(i) != address(0)) {
                if (rentals[i].isRented && !isRentalExpired(i)) {
                    activeRentals[index] = i;
                    index++;
                }
            }
        }
        
        return activeRentals;
    }
} 
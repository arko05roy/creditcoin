// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface ICrediPet {
    struct Pet {
        uint8 stage;        // 0=Egg, 1=Hatchling, 2=Juvenile, 3=Adult, 4=Legendary
        bool isWeakened;    // health status
        uint256 mintedAt;   // timestamp
    }

    // Events
    event PetMinted(address indexed owner, uint256 indexed tokenId);
    event PetEvolved(address indexed owner, uint256 indexed tokenId, uint8 oldStage, uint8 newStage);
    event PetHealthChanged(address indexed owner, uint256 indexed tokenId, bool isWeakened);

    // View functions
    function petOfOwner(address owner) external view returns (uint256);
    function getPet(uint256 tokenId) external view returns (Pet memory);
    function hasPet(address owner) external view returns (bool);
    
    // State-changing functions
    function mint() external returns (uint256);
    function evolve(address owner, uint8 newStage) external;
    function setWeakened(address owner, bool weakened) external;
}

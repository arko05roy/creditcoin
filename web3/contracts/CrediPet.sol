// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICrediPet.sol";

/**
 * @title CrediPet
 * @notice Soulbound NFT representing a user's credit reputation as an evolving creature
 * @dev One pet per wallet, non-transferable, evolves based on credit score
 */
contract CrediPet is ERC721, Ownable, ICrediPet {
    // ============ State Variables ============
    
    mapping(address => uint256) public petOfOwner;
    mapping(uint256 => Pet) private _pets;
    uint256 private _nextTokenId = 1; // Start from 1, 0 = no pet
    
    address public creditScoreContract;
    string public baseURI;
    
    // Stage names for metadata
    string[5] private _stageNames = ["egg", "hatchling", "juvenile", "adult", "legendary"];
    
    // ============ Modifiers ============
    
    modifier onlyCreditScore() {
        require(msg.sender == creditScoreContract, "CrediPet: caller is not CreditScore");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(string memory _baseURI) ERC721("CrediPet", "CPET") Ownable(msg.sender) {
        baseURI = _baseURI;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Mint a new pet for the caller
     * @dev Can only mint one pet per wallet
     * @return tokenId The ID of the newly minted pet
     */
    function mint() external returns (uint256) {
        require(petOfOwner[msg.sender] == 0, "CrediPet: already owns a pet");
        
        uint256 tokenId = _nextTokenId++;
        
        _pets[tokenId] = Pet({
            stage: 0,
            isWeakened: false,
            mintedAt: block.timestamp
        });
        
        petOfOwner[msg.sender] = tokenId;
        _safeMint(msg.sender, tokenId);
        
        emit PetMinted(msg.sender, tokenId);
        
        return tokenId;
    }
    
    /**
     * @notice Evolve a pet to a new stage
     * @dev Only callable by CreditScore contract
     * @param owner Address of the pet owner
     * @param newStage The new evolution stage (must be higher than current)
     */
    function evolve(address owner, uint8 newStage) external onlyCreditScore {
        require(newStage <= 4, "CrediPet: invalid stage");
        
        uint256 tokenId = petOfOwner[owner];
        require(tokenId != 0, "CrediPet: user has no pet");
        
        Pet storage pet = _pets[tokenId];
        require(newStage > pet.stage, "CrediPet: can only evolve forward");
        
        uint8 oldStage = pet.stage;
        pet.stage = newStage;
        
        emit PetEvolved(owner, tokenId, oldStage, newStage);
    }
    
    /**
     * @notice Set the weakened state of a pet
     * @dev Only callable by CreditScore contract
     * @param owner Address of the pet owner
     * @param weakened True to weaken, false to heal
     */
    function setWeakened(address owner, bool weakened) external onlyCreditScore {
        uint256 tokenId = petOfOwner[owner];
        require(tokenId != 0, "CrediPet: user has no pet");
        
        Pet storage pet = _pets[tokenId];
        pet.isWeakened = weakened;
        
        emit PetHealthChanged(owner, tokenId, weakened);
    }
    
    /**
     * @notice Get pet data
     * @param tokenId The token ID
     * @return Pet struct containing stage, health, and mint time
     */
    function getPet(uint256 tokenId) external view returns (Pet memory) {
        require(_ownerOf(tokenId) != address(0), "CrediPet: invalid token ID");
        return _pets[tokenId];
    }
    
    /**
     * @notice Check if an address owns a pet
     * @param owner Address to check
     * @return True if the address owns a pet
     */
    function hasPet(address owner) external view returns (bool) {
        return petOfOwner[owner] != 0;
    }
    
    /**
     * @notice Generate token URI based on stage and health
     * @param tokenId The token ID
     * @return URI string for metadata
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "CrediPet: invalid token ID");
        
        Pet memory pet = _pets[tokenId];
        string memory stageName = _stageNames[pet.stage];
        string memory healthSuffix = pet.isWeakened ? "-weak" : "";
        
        return string(abi.encodePacked(baseURI, stageName, healthSuffix, ".json"));
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the CreditScore contract address
     * @param _creditScore Address of the CreditScore contract
     */
    function setCreditScoreContract(address _creditScore) external onlyOwner {
        require(_creditScore != address(0), "CrediPet: zero address");
        creditScoreContract = _creditScore;
    }
    
    /**
     * @notice Update base URI for metadata
     * @param _baseURI New base URI
     */
    function setBaseURI(string memory _baseURI) external onlyOwner {
        baseURI = _baseURI;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Block all transfers (soulbound)
     * @dev Override to prevent transfers after minting
     */
    function _update(address to, uint256 tokenId, address auth) 
        internal 
        virtual 
        override 
        returns (address) 
    {
        address from = _ownerOf(tokenId);
        
        // Only allow minting (from == address(0))
        require(from == address(0), "CrediPet: soulbound token - transfers disabled");
        
        return super._update(to, tokenId, auth);
    }
}

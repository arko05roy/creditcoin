# CrediPet - Detailed Day-by-Day Implementation Plan

## 21-Day Sprint Breakdown

---

## **WEEK 1: Foundation & Smart Contracts**

---

### **DAY 1: Project Setup & Interface Definitions (4 hours)**

#### Morning Session (2 hours)
**Task 1.1: Repository Setup**
- [ ] Initialize monorepo structure
- [ ] Set up Hardhat project in `/contracts`
- [ ] Configure TypeScript + Solidity linter
- [ ] Install dependencies:
  ```bash
  npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
  npm install @openzeppelin/contracts
  ```

**Task 1.2: Network Configuration**
```typescript
// hardhat.config.ts
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    creditcoinTestnet: {
      url: "https://rpc.cc3-testnet.creditcoin.network",
      chainId: 102031,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      gasPrice: 20000000000, // 20 gwei
    },
    creditcoinMainnet: {
      url: "https://mainnet3.creditcoin.network",
      chainId: 102030,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: {
      creditcoinTestnet: "no-api-key-needed",
      creditcoinMainnet: "no-api-key-needed",
    },
    customChains: [
      {
        network: "creditcoinTestnet",
        chainId: 102031,
        urls: {
          apiURL: "https://creditcoin-testnet.blockscout.com/api",
          browserURL: "https://creditcoin-testnet.blockscout.com"
        }
      },
      {
        network: "creditcoinMainnet",
        chainId: 102030,
        urls: {
          apiURL: "https://creditcoin.blockscout.com/api",
          browserURL: "https://creditcoin.blockscout.com"
        }
      }
    ]
  }
};

export default config;
```

#### Afternoon Session (2 hours)
**Task 1.3: Write All Interface Definitions**

```solidity
// contracts/interfaces/ICrediPet.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
```

```solidity
// contracts/interfaces/ICreditScore.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ICreditScore {
    struct CreditProfile {
        uint256 totalLoans;
        uint256 totalRepaidOnTime;
        uint256 totalDefaulted;
        uint256 currentStreak;
        uint8 currentTier;
    }

    // Events
    event RepaymentRecorded(address indexed user, uint256 totalRepaid);
    event DefaultRecorded(address indexed user, uint256 totalDefaults);
    event LoanRecorded(address indexed user, uint256 totalLoans);
    event CreditTierUpgraded(address indexed user, uint8 oldTier, uint8 newTier);

    // View functions
    function getProfile(address user) external view returns (CreditProfile memory);
    function getCreditTier(address user) external view returns (uint8);
    function getCollateralRatio(address user) external view returns (uint256);
    function getInterestRate(address user) external view returns (uint256);
    function getTierThresholds() external view returns (uint256[5] memory);
    
    // State-changing functions
    function recordRepayment(address user) external;
    function recordDefault(address user) external;
    function recordLoanTaken(address user) external;
}
```

```solidity
// contracts/interfaces/ILendingPool.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILendingPool {
    struct Loan {
        uint256 principal;
        uint256 collateral;
        uint256 interestRate;
        uint256 borrowBlock;
        uint256 dueBlock;
        bool isActive;
        bool isDefaulted;
    }

    // Events
    event Supplied(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 dueBlock);
    event Repaid(address indexed user, uint256 principal, uint256 interest, bool onTime);
    event Liquidated(address indexed borrower, uint256 collateralSeized);

    // View functions
    function deposits(address user) external view returns (uint256);
    function loans(address user) external view returns (Loan memory);
    function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256);
    function getPoolStats() external view returns (uint256 totalDeposits, uint256 totalBorrowed, uint256 available);
    
    // State-changing functions
    function supply() external payable;
    function withdraw(uint256 amount) external;
    function borrow(uint256 borrowAmount) external payable;
    function repay() external payable;
    function liquidate(address borrower) external;
}
```

```solidity
// contracts/interfaces/IQuestBoard.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IQuestBoard {
    enum QuestId { 
        HatchPet,           // 0
        FirstDeposit,       // 1
        FirstBorrow,        // 2
        FirstRepay,         // 3
        SupplyLiquidity,    // 4
        StreakBuilder,      // 5
        TrustFall,          // 6
        Legend              // 7
    }

    struct Quest {
        string name;
        string description;
        uint256 xpReward;
    }

    // Events
    event QuestCompleted(address indexed user, uint8 indexed questId, uint256 xpAwarded, uint256 totalXP);

    // View functions
    function getQuest(uint8 questId) external view returns (Quest memory);
    function getQuestStatus(address user) external view returns (bool[8] memory);
    function totalXP(address user) external view returns (uint256);
    
    // State-changing functions
    function claimQuest(uint8 questId) external;
}
```

**Task 1.4: Environment Setup**
```bash
# .env.example
DEPLOYER_PRIVATE_KEY=your_private_key_here
CREDITCOIN_TESTNET_RPC=https://rpc.cc3-testnet.creditcoin.network
CREDITCOIN_MAINNET_RPC=https://mainnet3.creditcoin.network
```

---

### **DAY 2: CrediPet.sol Implementation (4 hours)**

#### Full Contract Implementation

```solidity
// contracts/CrediPet.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

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
```

#### Test Suite for CrediPet

```typescript
// test/CrediPet.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { CrediPet } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CrediPet", function () {
    let crediPet: CrediPet;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    let creditScore: SignerWithAddress; // Mock CreditScore contract

    const BASE_URI = "https://credipet.xyz/metadata/";

    beforeEach(async function () {
        [owner, user1, user2, creditScore] = await ethers.getSigners();

        const CrediPetFactory = await ethers.getContractFactory("CrediPet");
        crediPet = await CrediPetFactory.deploy(BASE_URI);
        await crediPet.waitForDeployment();

        // Set mock CreditScore contract
        await crediPet.setCreditScoreContract(creditScore.address);
    });

    describe("Deployment", function () {
        it("Should set the correct base URI", async function () {
            expect(await crediPet.baseURI()).to.equal(BASE_URI);
        });

        it("Should set the correct owner", async function () {
            expect(await crediPet.owner()).to.equal(owner.address);
        });

        it("Should start with tokenId 1", async function () {
            await crediPet.connect(user1).mint();
            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
        });
    });

    describe("Minting", function () {
        it("Should mint a pet for a new user", async function () {
            const tx = await crediPet.connect(user1).mint();
            const receipt = await tx.wait();

            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
            expect(await crediPet.hasPet(user1.address)).to.be.true;

            // Check event
            const event = receipt?.logs.find(
                (log: any) => log.fragment?.name === "PetMinted"
            );
            expect(event).to.not.be.undefined;
        });

        it("Should start pet at stage 0 (Egg)", async function () {
            await crediPet.connect(user1).mint();
            const pet = await crediPet.getPet(1);

            expect(pet.stage).to.equal(0);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should revert if user already owns a pet", async function () {
            await crediPet.connect(user1).mint();

            await expect(
                crediPet.connect(user1).mint()
            ).to.be.revertedWith("CrediPet: already owns a pet");
        });

        it("Should mint unique token IDs for different users", async function () {
            await crediPet.connect(user1).mint();
            await crediPet.connect(user2).mint();

            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
            expect(await crediPet.petOfOwner(user2.address)).to.equal(2);
        });

        it("Should set mintedAt timestamp correctly", async function () {
            const tx = await crediPet.connect(user1).mint();
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt!.blockNumber);

            const pet = await crediPet.getPet(1);
            expect(pet.mintedAt).to.equal(block!.timestamp);
        });
    });

    describe("Evolution", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should evolve pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 1);
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1);
        });

        it("Should emit PetEvolved event", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 1)
            ).to.emit(crediPet, "PetEvolved")
              .withArgs(user1.address, 1, 0, 1);
        });

        it("Should revert if caller is not CreditScore", async function () {
            await expect(
                crediPet.connect(user1).evolve(user1.address, 1)
            ).to.be.revertedWith("CrediPet: caller is not CreditScore");
        });

        it("Should revert if user has no pet", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user2.address, 1)
            ).to.be.revertedWith("CrediPet: user has no pet");
        });

        it("Should revert if trying to evolve backwards", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 2);

            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 1)
            ).to.be.revertedWith("CrediPet: can only evolve forward");
        });

        it("Should revert if stage exceeds maximum", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 5)
            ).to.be.revertedWith("CrediPet: invalid stage");
        });

        it("Should allow skipping stages", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 4);
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4);
        });
    });

    describe("Health Status", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should weaken pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;
        });

        it("Should heal pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            await crediPet.connect(creditScore).setWeakened(user1.address, false);
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should emit PetHealthChanged event", async function () {
            await expect(
                crediPet.connect(creditScore).setWeakened(user1.address, true)
            ).to.emit(crediPet, "PetHealthChanged")
              .withArgs(user1.address, 1, true);
        });

        it("Should revert if caller is not CreditScore", async function () {
            await expect(
                crediPet.connect(user1).setWeakened(user1.address, true)
            ).to.be.revertedWith("CrediPet: caller is not CreditScore");
        });
    });

    describe("Token URI", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should return correct URI for healthy egg", async function () {
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/egg.json"
            );
        });

        it("Should return correct URI for weakened egg", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/egg-weak.json"
            );
        });

        it("Should return correct URI for evolved stage", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 2);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/juvenile.json"
            );
        });

        it("Should return correct URI for weakened evolved stage", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 4);
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/legendary-weak.json"
            );
        });

        it("Should revert for invalid token ID", async function () {
            await expect(
                crediPet.tokenURI(999)
            ).to.be.revertedWith("CrediPet: invalid token ID");
        });
    });

    describe("Soulbound Behavior", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should prevent transfers", async function () {
            await expect(
                crediPet.connect(user1).transferFrom(user1.address, user2.address, 1)
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });

        it("Should prevent safeTransferFrom", async function () {
            await expect(
                crediPet.connect(user1)["safeTransferFrom(address,address,uint256)"](
                    user1.address,
                    user2.address,
                    1
                )
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });

        it("Should prevent approve", async function () {
            // Approve doesn't revert, but transfer will
            await crediPet.connect(user1).approve(user2.address, 1);
            
            await expect(
                crediPet.connect(user2).transferFrom(user1.address, user2.address, 1)
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update CreditScore contract", async function () {
            const newCreditScore = user2.address;
            await crediPet.setCreditScoreContract(newCreditScore);
            expect(await crediPet.creditScoreContract()).to.equal(newCreditScore);
        });

        it("Should revert if non-owner tries to update CreditScore", async function () {
            await expect(
                crediPet.connect(user1).setCreditScoreContract(user2.address)
            ).to.be.revertedWithCustomError(crediPet, "OwnableUnauthorizedAccount");
        });

        it("Should revert if setting CreditScore to zero address", async function () {
            await expect(
                crediPet.setCreditScoreContract(ethers.ZeroAddress)
            ).to.be.revertedWith("CrediPet: zero address");
        });

        it("Should allow owner to update base URI", async function () {
            const newURI = "https://new.credipet.xyz/";
            await crediPet.setBaseURI(newURI);
            expect(await crediPet.baseURI()).to.equal(newURI);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle getPet with zero address owner", async function () {
            await expect(
                crediPet.getPet(999)
            ).to.be.revertedWith("CrediPet: invalid token ID");
        });

        it("Should return false for hasPet with unminted address", async function () {
            expect(await crediPet.hasPet(user2.address)).to.be.false;
        });

        it("Should handle multiple users minting sequentially", async function () {
            const users = [user1, user2, owner];
            
            for (let i = 0; i < users.length; i++) {
                await crediPet.connect(users[i]).mint();
                expect(await crediPet.petOfOwner(users[i].address)).to.equal(i + 1);
            }
        });

        it("Should handle evolution to max stage correctly", async function () {
            await crediPet.connect(user1).mint();
            await crediPet.connect(creditScore).evolve(user1.address, 4);
            
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4);
            
            // Can't evolve further
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 5)
            ).to.be.revertedWith("CrediPet: invalid stage");
        });
    });
});
```

#### Edge Cases to Test

1. **Reentrancy:** Not applicable (no ETH transfers in CrediPet)
2. **Integer Overflow:** Protected by Solidity 0.8+
3. **Zero Address:** Covered in tests
4. **Gas Limits:** Token URI generation is bounded (5 stages)
5. **Race Conditions:** Single pet per wallet prevents double minting

---

### **DAY 3: CreditScore.sol Implementation (4 hours)**

```solidity
// contracts/CreditScore.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ICreditScore.sol";
import "./interfaces/ICrediPet.sol";

/**
 * @title CreditScore
 * @notice Core credit reputation engine that tracks user credit history
 * @dev Manages tier upgrades, collateral ratios, and interest rates
 */
contract CreditScore is ICreditScore, Ownable {
    // ============ State Variables ============
    
    mapping(address => CreditProfile) public profiles;
    
    // Tier requirements (repayments needed to reach each tier)
    uint256[5] public tierThresholds = [0, 1, 3, 7, 15];
    
    // Collateral ratios in basis points (10000 = 100%)
    uint256[5] public collateralRatios = [15000, 13000, 11000, 8500, 6000]; // 150%, 130%, 110%, 85%, 60%
    
    // Interest rates in basis points per loan period
    uint256[5] public interestRates = [500, 400, 300, 200, 100]; // 5%, 4%, 3%, 2%, 1%
    
    ICrediPet public crediPet;
    address public lendingPool;
    
    // ============ Modifiers ============
    
    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "CreditScore: caller is not LendingPool");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(address _crediPet) Ownable(msg.sender) {
        require(_crediPet != address(0), "CreditScore: zero address");
        crediPet = ICrediPet(_crediPet);
    }
    
    // ============ External Functions - Called by LendingPool ============
    
    /**
     * @notice Record an on-time loan repayment
     * @param user Address of the borrower
     */
    function recordRepayment(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        
        profile.totalRepaidOnTime++;
        profile.currentStreak++;
        
        // Check for tier upgrade
        bool upgraded = _checkTierUpgrade(user);
        
        // If user's pet was weakened, heal it
        if (crediPet.hasPet(user)) {
            ICrediPet.Pet memory pet = crediPet.getPet(crediPet.petOfOwner(user));
            if (pet.isWeakened) {
                crediPet.setWeakened(user, false);
            }
        }
        
        emit RepaymentRecorded(user, profile.totalRepaidOnTime);
    }
    
    /**
     * @notice Record a loan default or late payment
     * @param user Address of the borrower
     */
    function recordDefault(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        
        profile.totalDefaulted++;
        profile.currentStreak = 0;
        
        // Weaken the pet if it exists
        if (crediPet.hasPet(user)) {
            crediPet.setWeakened(user, true);
        }
        
        emit DefaultRecorded(user, profile.totalDefaulted);
    }
    
    /**
     * @notice Record a new loan being taken
     * @param user Address of the borrower
     */
    function recordLoanTaken(address user) external onlyLendingPool {
        CreditProfile storage profile = profiles[user];
        profile.totalLoans++;
        
        emit LoanRecorded(user, profile.totalLoans);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get the complete credit profile for a user
     * @param user Address to query
     * @return CreditProfile struct
     */
    function getProfile(address user) external view returns (CreditProfile memory) {
        return profiles[user];
    }
    
    /**
     * @notice Get the current credit tier for a user
     * @param user Address to query
     * @return Tier level (0-4)
     */
    function getCreditTier(address user) external view returns (uint8) {
        return profiles[user].currentTier;
    }
    
    /**
     * @notice Get the collateral ratio for a user's tier
     * @param user Address to query
     * @return Collateral ratio in basis points
     */
    function getCollateralRatio(address user) external view returns (uint256) {
        return collateralRatios[profiles[user].currentTier];
    }
    
    /**
     * @notice Get the interest rate for a user's tier
     * @param user Address to query
     * @return Interest rate in basis points
     */
    function getInterestRate(address user) external view returns (uint256) {
        return interestRates[profiles[user].currentTier];
    }
    
    /**
     * @notice Get tier thresholds array
     * @return Array of repayment thresholds for each tier
     */
    function getTierThresholds() external view returns (uint256[5] memory) {
        return tierThresholds;
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Check if user qualifies for tier upgrade and execute if so
     * @param user Address to check
     * @return True if user was upgraded
     */
    function _checkTierUpgrade(address user) internal returns (bool) {
        CreditProfile storage profile = profiles[user];
        uint8 currentTier = profile.currentTier;
        
        // Already at max tier
        if (currentTier == 4) {
            return false;
        }
        
        uint8 nextTier = currentTier + 1;
        
        // Check if eligible for next tier
        bool eligible = false;
        
        if (nextTier == 4) {
            // Legendary tier: requires 15 repayments AND zero defaults
            eligible = profile.totalRepaidOnTime >= tierThresholds[4] && 
                      profile.totalDefaulted == 0;
        } else {
            // Other tiers: just check repayment threshold
            eligible = profile.totalRepaidOnTime >= tierThresholds[nextTier];
        }
        
        if (eligible) {
            profile.currentTier = nextTier;
            
            // Evolve the pet if it exists
            if (crediPet.hasPet(user)) {
                crediPet.evolve(user, nextTier);
            }
            
            emit CreditTierUpgraded(user, currentTier, nextTier);
            return true;
        }
        
        return false;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Set the lending pool contract address
     * @param _lendingPool Address of the LendingPool contract
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(_lendingPool != address(0), "CreditScore: zero address");
        lendingPool = _lendingPool;
    }
    
    /**
     * @notice Update collateral ratio for a specific tier
     * @param tier Tier level (0-4)
     * @param ratio New collateral ratio in basis points
     */
    function setCollateralRatio(uint8 tier, uint256 ratio) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        require(ratio >= 1000 && ratio <= 20000, "CreditScore: ratio out of bounds");
        collateralRatios[tier] = ratio;
    }
    
    /**
     * @notice Update interest rate for a specific tier
     * @param tier Tier level (0-4)
     * @param rate New interest rate in basis points
     */
    function setInterestRate(uint8 tier, uint256 rate) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        require(rate <= 1000, "CreditScore: rate too high"); // Max 10%
        interestRates[tier] = rate;
    }
    
    /**
     * @notice Update tier threshold
     * @param tier Tier level (0-4)
     * @param threshold New repayment threshold
     */
    function setTierThreshold(uint8 tier, uint256 threshold) external onlyOwner {
        require(tier <= 4, "CreditScore: invalid tier");
        tierThresholds[tier] = threshold;
    }
}
```

#### Test Suite for CreditScore

```typescript
// test/CreditScore.test.ts
import { expect } from "chai";
import { ethers } from "hardhat";
import { CreditScore, CrediPet } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CreditScore", function () {
    let creditScore: CreditScore;
    let crediPet: CrediPet;
    let owner: SignerWithAddress;
    let lendingPool: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    beforeEach(async function () {
        [owner, lendingPool, user1, user2] = await ethers.getSigners();

        // Deploy CrediPet first
        const CrediPetFactory = await ethers.getContractFactory("CrediPet");
        crediPet = await CrediPetFactory.deploy("https://credipet.xyz/metadata/");
        await crediPet.waitForDeployment();

        // Deploy CreditScore
        const CreditScoreFactory = await ethers.getContractFactory("CreditScore");
        creditScore = await CreditScoreFactory.deploy(await crediPet.getAddress());
        await creditScore.waitForDeployment();

        // Link contracts
        await crediPet.setCreditScoreContract(await creditScore.getAddress());
        await creditScore.setLendingPool(lendingPool.address);

        // Mint pets for test users
        await crediPet.connect(user1).mint();
        await crediPet.connect(user2).mint();
    });

    describe("Deployment", function () {
        it("Should set correct CrediPet address", async function () {
            expect(await creditScore.crediPet()).to.equal(await crediPet.getAddress());
        });

        it("Should initialize with correct tier thresholds", async function () {
            const thresholds = await creditScore.getTierThresholds();
            expect(thresholds[0]).to.equal(0);
            expect(thresholds[1]).to.equal(1);
            expect(thresholds[2]).to.equal(3);
            expect(thresholds[3]).to.equal(7);
            expect(thresholds[4]).to.equal(15);
        });

        it("Should initialize with correct collateral ratios", async function () {
            expect(await creditScore.collateralRatios(0)).to.equal(15000); // 150%
            expect(await creditScore.collateralRatios(1)).to.equal(13000); // 130%
            expect(await creditScore.collateralRatios(2)).to.equal(11000); // 110%
            expect(await creditScore.collateralRatios(3)).to.equal(8500);  // 85%
            expect(await creditScore.collateralRatios(4)).to.equal(6000);  // 60%
        });

        it("Should initialize with correct interest rates", async function () {
            expect(await creditScore.interestRates(0)).to.equal(500); // 5%
            expect(await creditScore.interestRates(1)).to.equal(400); // 4%
            expect(await creditScore.interestRates(2)).to.equal(300); // 3%
            expect(await creditScore.interestRates(3)).to.equal(200); // 2%
            expect(await creditScore.interestRates(4)).to.equal(100); // 1%
        });
    });

    describe("Repayment Recording", function () {
        it("Should record repayment and increment counters", async function () {
            await creditScore.connect(lendingPool).recordLoanTaken(user1.address);
            await creditScore.connect(lendingPool).recordRepayment(user1.address);

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalRepaidOnTime).to.equal(1);
            expect(profile.currentStreak).to.equal(1);
        });

        it("Should emit RepaymentRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordRepayment(user1.address)
            ).to.emit(creditScore, "RepaymentRecorded")
              .withArgs(user1.address, 1);
        });

        it("Should upgrade tier after 1 repayment", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentTier).to.equal(1);
        });

        it("Should evolve pet on tier upgrade", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1);
        });

        it("Should heal weakened pet on repayment", async function () {
            // Cause default first
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            let pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;

            // Repay
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should revert if called by non-lending-pool", async function () {
            await expect(
                creditScore.connect(user1).recordRepayment(user1.address)
            ).to.be.revertedWith("CreditScore: caller is not LendingPool");
        });
    });

    describe("Default Recording", function () {
        it("Should record default and reset streak", async function () {
            // Build up streak first
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            let profile = await creditScore.getProfile(user1.address);
            expect(profile.currentStreak).to.equal(2);

            // Default
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            profile = await creditScore.getProfile(user1.address);
            expect(profile.totalDefaulted).to.equal(1);
            expect(profile.currentStreak).to.equal(0);
        });

        it("Should emit DefaultRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordDefault(user1.address)
            ).to.emit(creditScore, "DefaultRecorded")
              .withArgs(user1.address, 1);
        });

        it("Should weaken pet on default", async function () {
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;
        });

        it("Should handle multiple defaults", async function () {
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalDefaulted).to.equal(2);
        });
    });

    describe("Tier Progression", function () {
        it("Should upgrade to Hatchling (Tier 1) after 1 repayment", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getCreditTier(user1.address)).to.equal(1);
        });

        it("Should upgrade to Juvenile (Tier 2) after 3 repayments", async function () {
            for (let i = 0; i < 3; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(2);
        });

        it("Should upgrade to Adult (Tier 3) after 7 repayments", async function () {
            for (let i = 0; i < 7; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(3);
        });

        it("Should upgrade to Legendary (Tier 4) after 15 repayments with zero defaults", async function () {
            for (let i = 0; i < 15; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(4);
        });

        it("Should NOT upgrade to Legendary if any defaults exist", async function () {
            // Do 14 repayments
            for (let i = 0; i < 14; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            
            // Default once
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            
            // Do more repayments
            for (let i = 0; i < 5; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            
            // Should be stuck at Tier 3
            expect(await creditScore.getCreditTier(user1.address)).to.equal(3);
        });

        it("Should emit CreditTierUpgraded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordRepayment(user1.address)
            ).to.emit(creditScore, "CreditTierUpgraded")
              .withArgs(user1.address, 0, 1);
        });

        it("Should skip tiers if thresholds allow", async function () {
            // Modify threshold for testing
            await creditScore.setTierThreshold(1, 0);
            await creditScore.setTierThreshold(2, 0);
            
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            
            // Should jump to highest available tier
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentTier).to.be.gte(1);
        });
    });

    describe("Collateral Ratios", function () {
        it("Should return correct collateral ratio for each tier", async function () {
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(15000); // Tier 0

            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(13000); // Tier 1

            for (let i = 0; i < 2; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(11000); // Tier 2
        });
    });

    describe("Interest Rates", function () {
        it("Should return correct interest rate for each tier", async function () {
            expect(await creditScore.getInterestRate(user1.address)).to.equal(500); // Tier 0

            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getInterestRate(user1.address)).to.equal(400); // Tier 1
        });
    });

    describe("Loan Recording", function () {
        it("Should record loan taken", async function () {
            await creditScore.connect(lendingPool).recordLoanTaken(user1.address);
            
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalLoans).to.equal(1);
        });

        it("Should emit LoanRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordLoanTaken(user1.address)
            ).to.emit(creditScore, "LoanRecorded")
              .withArgs(user1.address, 1);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update collateral ratio", async function () {
            await creditScore.setCollateralRatio(0, 14000);
            expect(await creditScore.collateralRatios(0)).to.equal(14000);
        });

        it("Should revert collateral ratio updates from non-owner", async function () {
            await expect(
                creditScore.connect(user1).setCollateralRatio(0, 14000)
            ).to.be.revertedWithCustomError(creditScore, "OwnableUnauthorizedAccount");
        });

        it("Should validate collateral ratio bounds", async function () {
            await expect(
                creditScore.setCollateralRatio(0, 500)
            ).to.be.revertedWith("CreditScore: ratio out of bounds");

            await expect(
                creditScore.setCollateralRatio(0, 25000)
            ).to.be.revertedWith("CreditScore: ratio out of bounds");
        });

        it("Should allow owner to update interest rate", async function () {
            await creditScore.setInterestRate(0, 600);
            expect(await creditScore.interestRates(0)).to.equal(600);
        });

        it("Should validate interest rate bounds", async function () {
            await expect(
                creditScore.setInterestRate(0, 1500)
            ).to.be.revertedWith("CreditScore: rate too high");
        });

        it("Should allow owner to update tier thresholds", async function () {
            await creditScore.setTierThreshold(1, 2);
            const thresholds = await creditScore.getTierThresholds();
            expect(thresholds[1]).to.equal(2);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle user without pet gracefully", async function () {
            const userWithoutPet = user2;
            await crediPet.connect(userWithoutPet).transferFrom(
                userWithoutPet.address,
                ethers.ZeroAddress,
                await crediPet.petOfOwner(userWithoutPet.address)
            );
            
            // Should not revert, just skip pet operations
            await creditScore.connect(lendingPool).recordRepayment(userWithoutPet.address);
            const profile = await creditScore.getProfile(userWithoutPet.address);
            expect(profile.totalRepaidOnTime).to.equal(1);
        });

        it("Should handle rapid succession of repayments", async function () {
            for (let i = 0; i < 20; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalRepaidOnTime).to.equal(20);
            expect(profile.currentTier).to.equal(4);
        });

        it("Should maintain streak across tier upgrades", async function () {
            for (let i = 0; i < 10; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentStreak).to.equal(10);
        });
    });
});
```

---

### **DAY 4: LendingPool.sol - Part 1 (Core Functions) (4 hours)**

#### Contract Implementation

```solidity
// contracts/LendingPool.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/ICreditScore.sol";

contract LendingPool is ILendingPool, Ownable, ReentrancyGuard {
    mapping(address => Loan) public loans;
    mapping(address => uint256) public deposits;
    
    uint256 public totalDeposits;
    uint256 public totalBorrowed;
    uint256 public loanDurationBlocks = 50; // ~10 minutes for demo
    
    ICreditScore public creditScore;
    
    uint256 public constant GRACE_PERIOD = 25;
    uint256 public constant MIN_BORROW = 0.001 ether;
    uint256 public constant MAX_BORROW = 10 ether;
    uint256 public constant BASIS_POINTS = 10000;
    
    constructor(address _creditScore) Ownable(msg.sender) {
        require(_creditScore != address(0), "LendingPool: zero address");
        creditScore = ICreditScore(_creditScore);
    }
    
    // Supply CTC to the pool
    function supply() external payable nonReentrant {
        require(msg.value > 0, "LendingPool: zero amount");
        
        deposits[msg.sender] += msg.value;
        totalDeposits += msg.value;
        
        emit Supplied(msg.sender, msg.value);
    }
    
    // Withdraw CTC from pool
    function withdraw(uint256 amount) external nonReentrant {
        require(deposits[msg.sender] >= amount, "LendingPool: insufficient balance");
        require(getAvailableLiquidity() >= amount, "LendingPool: insufficient liquidity");
        
        deposits[msg.sender] -= amount;
        totalDeposits -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "LendingPool: transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    // Borrow CTC with credit-based collateral
    function borrow(uint256 borrowAmount) external payable nonReentrant {
        require(!loans[msg.sender].isActive, "LendingPool: active loan exists");
        require(borrowAmount >= MIN_BORROW && borrowAmount <= MAX_BORROW, "LendingPool: invalid amount");
        require(getAvailableLiquidity() >= borrowAmount, "LendingPool: insufficient liquidity");
        
        uint256 collateralRatio = creditScore.getCollateralRatio(msg.sender);
        uint256 requiredCollateral = (borrowAmount * collateralRatio) / BASIS_POINTS;
        require(msg.value >= requiredCollateral, "LendingPool: insufficient collateral");
        
        uint256 interestRate = creditScore.getInterestRate(msg.sender);
        
        loans[msg.sender] = Loan({
            principal: borrowAmount,
            collateral: msg.value,
            interestRate: interestRate,
            borrowBlock: block.number,
            dueBlock: block.number + loanDurationBlocks,
            isActive: true,
            isDefaulted: false
        });
        
        totalBorrowed += borrowAmount;
        creditScore.recordLoanTaken(msg.sender);
        
        (bool success, ) = msg.sender.call{value: borrowAmount}("");
        require(success, "LendingPool: transfer failed");
        
        emit Borrowed(msg.sender, borrowAmount, msg.value, block.number + loanDurationBlocks);
    }
    
    // Repay loan
    function repay() external payable nonReentrant {
        Loan storage loan = loans[msg.sender];
        require(loan.isActive, "LendingPool: no active loan");
        
        uint256 interest = (loan.principal * loan.interestRate) / BASIS_POINTS;
        uint256 totalOwed = loan.principal + interest;
        require(msg.value >= totalOwed, "LendingPool: insufficient repayment");
        
        bool onTime = block.number <= loan.dueBlock;
        
        // Return collateral
        uint256 collateralToReturn = loan.collateral;
        
        // Update state
        loan.isActive = false;
        totalBorrowed -= loan.principal;
        
        // Record in credit score
        if (onTime) {
            creditScore.recordRepayment(msg.sender);
        } else {
            creditScore.recordDefault(msg.sender);
        }
        
        // Transfer collateral back
        (bool success, ) = msg.sender.call{value: collateralToReturn}("");
        require(success, "LendingPool: collateral return failed");
        
        // Refund excess payment
        if (msg.value > totalOwed) {
            (success, ) = msg.sender.call{value: msg.value - totalOwed}("");
            require(success, "LendingPool: refund failed");
        }
        
        emit Repaid(msg.sender, loan.principal, interest, onTime);
    }
    
    // Liquidate overdue loan
    function liquidate(address borrower) external nonReentrant {
        Loan storage loan = loans[borrower];
        require(loan.isActive, "LendingPool: no active loan");
        require(block.number > loan.dueBlock + GRACE_PERIOD, "LendingPool: grace period active");
        
        uint256 collateralSeized = loan.collateral;
        
        loan.isActive = false;
        loan.isDefaulted = true;
        totalBorrowed -= loan.principal;
        totalDeposits += collateralSeized; // Add to pool
        
        creditScore.recordDefault(borrower);
        
        emit Liquidated(borrower, collateralSeized);
    }
    
    // View functions
    function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256) {
        uint256 ratio = creditScore.getCollateralRatio(user);
        return (borrowAmount * ratio) / BASIS_POINTS;
    }
    
    function getPoolStats() external view returns (uint256, uint256, uint256) {
        return (totalDeposits, totalBorrowed, getAvailableLiquidity());
    }
    
    function getAvailableLiquidity() public view returns (uint256) {
        return totalDeposits >= totalBorrowed ? totalDeposits - totalBorrowed : 0;
    }
    
    function setLoanDuration(uint256 blocks) external onlyOwner {
        loanDurationBlocks = blocks;
    }
}
```

#### Key Test Cases (15 tests)

```typescript
describe("LendingPool", () => {
    // Supply tests
    - Should accept deposits
    - Should track individual and total deposits
    - Should emit Supplied event
    
    // Withdraw tests
    - Should allow withdrawal of available funds
    - Should reject withdrawal exceeding balance
    - Should reject withdrawal if insufficient pool liquidity
    
    // Borrow tests
    - Should calculate correct collateral for each tier
    - Should allow borrow with sufficient collateral
    - Should reject borrow with insufficient collateral
    - Should reject if user already has active loan
    - Should enforce MIN/MAX borrow limits
    
    // Repay tests
    - Should allow on-time repayment
    - Should handle late repayment
    - Should return collateral on repay
    - Should refund excess payment
    
    // Liquidation tests
    - Should allow liquidation after grace period
    - Should reject liquidation during grace period
    
    // Integration
    - Should update credit score on repay/default
    - Should integrate with credit tiers correctly
});
```

---

### **DAY 5: LendingPool.sol - Part 2 (Testing & Edge Cases) (4 hours)**

#### Complete Test Suite

```typescript
// Focus on edge cases and security
describe("LendingPool Edge Cases", () => {
    it("Should handle reentrancy attacks", async () => {
        // Deploy malicious contract attempting reentrancy
        // Verify ReentrancyGuard blocks it
    });
    
    it("Should handle zero liquidity gracefully", async () => {
        // All funds borrowed, try to borrow more
    });
    
    it("Should handle partial liquidation scenarios", async () => {
        // Multiple users, liquidate one at a time
    });
    
    it("Should calculate interest correctly for all tiers", async () => {
        // Test 0.1 CTC loan at each tier (0-4)
        // Verify exact interest amounts
    });
    
    it("Should handle block.number edge cases", async () => {
        // Repay exactly at dueBlock
        // Repay at dueBlock + 1
    });
    
    it("Should prevent collateral theft via integer overflow", async () => {
        // Try to borrow with collateral manipulation
    });
    
    it("Should handle concurrent borrows from different users", async () => {
        // Multiple users borrow simultaneously
        // Verify pool accounting is correct
    });
});
```

#### Security Checklist
- ✅ ReentrancyGuard on all ETH transfers
- ✅ Checks-Effects-Interactions pattern
- ✅ SafeMath (built into Solidity 0.8+)
- ✅ Access control on admin functions
- ✅ Input validation on all parameters
- ✅ Event emission for all state changes

---

### **DAY 6: QuestBoard.sol Implementation (3 hours)**

```solidity
// contracts/QuestBoard.sol
contract QuestBoard is IQuestBoard, Ownable {
    mapping(uint8 => Quest) public quests;
    mapping(address => mapping(uint8 => bool)) public completed;
    mapping(address => uint256) public totalXP;
    
    ICreditScore public creditScore;
    ICrediPet public crediPet;
    ILendingPool public lendingPool;
    
    constructor(address _creditScore, address _crediPet, address _lendingPool) {
        // Initialize 8 quests
        quests[0] = Quest("Hatch Your Pet", "Mint your CrediPet", 100);
        quests[1] = Quest("First Deposit", "Supply CTC to pool", 150);
        quests[2] = Quest("First Steps", "Borrow your first loan", 150);
        quests[3] = Quest("Promise Keeper", "Repay a loan on time", 200);
        quests[4] = Quest("Generous Soul", "Supply at least 0.1 CTC", 200);
        quests[5] = Quest("Streak Builder", "Repay 3 loans consecutively", 300);
        quests[6] = Quest("Trust Fall", "Borrow at Juvenile tier or higher", 400);
        quests[7] = Quest("Legend", "Reach Legendary tier", 500);
    }
    
    function claimQuest(uint8 questId) external {
        require(!completed[msg.sender][questId], "QuestBoard: already completed");
        require(_validateQuest(msg.sender, QuestId(questId)), "QuestBoard: quest not complete");
        
        completed[msg.sender][questId] = true;
        totalXP[msg.sender] += quests[questId].xpReward;
        
        emit QuestCompleted(msg.sender, questId, quests[questId].xpReward, totalXP[msg.sender]);
    }
    
    function _validateQuest(address user, QuestId questId) internal view returns (bool) {
        if (questId == QuestId.HatchPet) {
            return crediPet.hasPet(user);
        } else if (questId == QuestId.FirstDeposit) {
            return lendingPool.deposits(user) > 0;
        } else if (questId == QuestId.FirstBorrow) {
            return creditScore.getProfile(user).totalLoans >= 1;
        } else if (questId == QuestId.FirstRepay) {
            return creditScore.getProfile(user).totalRepaidOnTime >= 1;
        } else if (questId == QuestId.SupplyLiquidity) {
            return lendingPool.deposits(user) >= 0.1 ether;
        } else if (questId == QuestId.StreakBuilder) {
            return creditScore.getProfile(user).currentStreak >= 3;
        } else if (questId == QuestId.TrustFall) {
            return creditScore.getCreditTier(user) >= 2;
        } else if (questId == QuestId.Legend) {
            return creditScore.getCreditTier(user) == 4;
        }
        return false;
    }
    
    function getQuestStatus(address user) external view returns (bool[8] memory) {
        bool[8] memory status;
        for (uint8 i = 0; i < 8; i++) {
            status[i] = completed[user][i];
        }
        return status;
    }
}
```

#### Quest Test Cases (10 tests)
- Should initialize all 8 quests correctly
- Should validate HatchPet quest
- Should validate FirstDeposit quest
- Should validate all quest conditions
- Should prevent double claiming
- Should award correct XP
- Should track total XP correctly
- Should return correct quest status array

---

### **DAY 7: Contract Deployment & Integration Testing (3 hours)**

#### Deployment Script

```typescript
// scripts/deploy.ts
async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying with:", deployer.address);
    
    // 1. Deploy CrediPet
    const CrediPet = await ethers.getContractFactory("CrediPet");
    const crediPet = await CrediPet.deploy("https://credipet.xyz/metadata/");
    await crediPet.waitForDeployment();
    console.log("CrediPet:", await crediPet.getAddress());
    
    // 2. Deploy CreditScore
    const CreditScore = await ethers.getContractFactory("CreditScore");
    const creditScore = await CreditScore.deploy(await crediPet.getAddress());
    await creditScore.waitForDeployment();
    console.log("CreditScore:", await creditScore.getAddress());
    
    // 3. Deploy LendingPool
    const LendingPool = await ethers.getContractFactory("LendingPool");
    const lendingPool = await LendingPool.deploy(await creditScore.getAddress());
    await lendingPool.waitForDeployment();
    console.log("LendingPool:", await lendingPool.getAddress());
    
    // 4. Deploy QuestBoard
    const QuestBoard = await ethers.getContractFactory("QuestBoard");
    const questBoard = await QuestBoard.deploy(
        await creditScore.getAddress(),
        await crediPet.getAddress(),
        await lendingPool.getAddress()
    );
    await questBoard.waitForDeployment();
    console.log("QuestBoard:", await questBoard.getAddress());
    
    // 5. Link contracts
    await crediPet.setCreditScoreContract(await creditScore.getAddress());
    await creditScore.setLendingPool(await lendingPool.getAddress());
    
    console.log("\n=== Deployment Complete ===");
    console.log("Save these addresses to .env:");
    console.log(`CREDIPET=${await crediPet.getAddress()}`);
    console.log(`CREDITSCORE=${await creditScore.getAddress()}`);
    console.log(`LENDINGPOOL=${await lendingPool.getAddress()}`);
    console.log(`QUESTBOARD=${await questBoard.getAddress()}`);
}
```

#### Integration Test

```typescript
// test/Integration.test.ts
describe("Full User Journey", () => {
    it("Should complete entire flow: mint → deposit → borrow → repay → evolve", async () => {
        // 1. Mint pet
        await crediPet.connect(user).mint();
        expect(await crediPet.hasPet(user.address)).to.be.true;
        
        // 2. Supply liquidity (as another user)
        await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
        
        // 3. Borrow (user at tier 0 = 150% collateral)
        const borrowAmount = ethers.parseEther("1");
        const collateral = ethers.parseEther("1.5");
        await lendingPool.connect(user).borrow(borrowAmount, { value: collateral });
        
        // 4. Repay on time
        const interest = (borrowAmount * 500n) / 10000n; // 5% for tier 0
        await lendingPool.connect(user).repay({ value: borrowAmount + interest });
        
        // 5. Check evolution (should be tier 1 now)
        expect(await creditScore.getCreditTier(user.address)).to.equal(1);
        const pet = await crediPet.getPet(1);
        expect(pet.stage).to.equal(1); // Hatchling
        
        // 6. Claim quests
        await questBoard.connect(user).claimQuest(0); // HatchPet
        await questBoard.connect(user).claimQuest(2); // FirstBorrow
        await questBoard.connect(user).claimQuest(3); // FirstRepay
        
        expect(await questBoard.totalXP(user.address)).to.equal(450);
    });
});
```

---

## **WEEK 2: Frontend Development**

### **DAY 8: Next.js Setup & Wagmi Configuration (4 hours)**

#### Project Structure
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
npm install wagmi viem @tanstack/react-query
npm install @rainbow-me/rainbowkit
npm install framer-motion lucide-react
```

#### Wagmi Config

```typescript
// lib/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

export const creditcoinTestnet = defineChain({
  id: 102031,
  name: 'Creditcoin Testnet',
  nativeCurrency: { name: 'Test CTC', symbol: 'tCTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.cc3-testnet.creditcoin.network'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://creditcoin-testnet.blockscout.com' },
  },
});

export const config = getDefaultConfig({
  appName: 'CrediPet',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!,
  chains: [creditcoinTestnet],
});
```

#### Contract ABIs & Addresses

```typescript
// lib/contracts.ts
import CrediPetABI from './abis/CrediPet.json';
import CreditScoreABI from './abis/CreditScore.json';
import LendingPoolABI from './abis/LendingPool.json';
import QuestBoardABI from './abis/QuestBoard.json';

export const contracts = {
  crediPet: {
    address: process.env.NEXT_PUBLIC_CREDIPET_ADDRESS as `0x${string}`,
    abi: CrediPetABI,
  },
  creditScore: {
    address: process.env.NEXT_PUBLIC_CREDITSCORE_ADDRESS as `0x${string}`,
    abi: CreditScoreABI,
  },
  lendingPool: {
    address: process.env.NEXT_PUBLIC_LENDINGPOOL_ADDRESS as `0x${string}`,
    abi: LendingPoolABI,
  },
  questBoard: {
    address: process.env.NEXT_PUBLIC_QUESTBOARD_ADDRESS as `0x${string}`,
    abi: QuestBoardABI,
  },
};
```

---

### **DAY 9: Custom Hooks (4 hours)**

```typescript
// hooks/useCrediPet.ts
export function useCrediPet(address?: Address) {
  const { data: tokenId } = useReadContract({
    ...contracts.crediPet,
    functionName: 'petOfOwner',
    args: address ? [address] : undefined,
  });
  
  const { data: pet } = useReadContract({
    ...contracts.crediPet,
    functionName: 'getPet',
    args: tokenId ? [tokenId] : undefined,
  });
  
  const { writeContract } = useWriteContract();
  
  const mint = useCallback(async () => {
    return writeContract({
      ...contracts.crediPet,
      functionName: 'mint',
    });
  }, [writeContract]);
  
  return {
    pet: pet ? {
      stage: pet.stage,
      isWeakened: pet.isWeakened,
      mintedAt: pet.mintedAt,
    } : null,
    tokenId: tokenId || null,
    hasPet: !!tokenId && tokenId !== 0n,
    mint,
    stageName: STAGE_NAMES[pet?.stage || 0],
    imageUrl: `/creatures/${STAGE_NAMES[pet?.stage || 0]}${pet?.isWeakened ? '-weak' : ''}.png`,
  };
}

// hooks/useCreditScore.ts
export function useCreditScore(address?: Address) {
  const { data: profile } = useReadContract({
    ...contracts.creditScore,
    functionName: 'getProfile',
    args: address ? [address] : undefined,
  });
  
  return {
    profile,
    tier: profile?.currentTier || 0,
    collateralRatio: COLLATERAL_RATIOS[profile?.currentTier || 0],
    progressToNextTier: calculateProgress(profile),
  };
}

// hooks/useLendingPool.ts
export function useLendingPool() {
  const { writeContract } = useWriteContract();
  
  const supply = useCallback(async (amount: bigint) => {
    return writeContract({
      ...contracts.lendingPool,
      functionName: 'supply',
      value: amount,
    });
  }, [writeContract]);
  
  const borrow = useCallback(async (borrowAmount: bigint, collateral: bigint) => {
    return writeContract({
      ...contracts.lendingPool,
      functionName: 'borrow',
      args: [borrowAmount],
      value: collateral,
    });
  }, [writeContract]);
  
  return { supply, borrow, repay, withdraw };
}
```

---

### **DAY 10-11: Dashboard Page (8 hours)**

```typescript
// app/dashboard/page.tsx
export default function Dashboard() {
  const { address } = useAccount();
  const { pet, hasPet, stageName, imageUrl } = useCrediPet(address);
  const { tier, collateralRatio, progressToNextTier } = useCreditScore(address);
  const { quests, totalXP } = useQuests(address);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Creature Display */}
      <div className="lg:col-span-2">
        <CreatureCard
          image={imageUrl}
          stage={stageName}
          health={pet?.isWeakened ? 'Weakened' : 'Healthy'}
          tier={tier}
        />
        <CreditStats
          tier={tier}
          collateralRatio={collateralRatio}
          progress={progressToNextTier}
        />
      </div>
      
      {/* Quest Board */}
      <div>
        <QuestBoard quests={quests} totalXP={totalXP} />
      </div>
    </div>
  );
}

// components/creature/CreatureDisplay.tsx
export function CreatureDisplay({ image, stage, isWeakened }) {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ duration: 3, repeat: Infinity }}
      className="relative"
    >
      <Image src={image} alt={stage} width={400} height={400} />
      {isWeakened && <StatusBadge status="weakened" />}
    </motion.div>
  );
}
```

---

### **DAY 12-13: Lending Page (8 hours)**

```typescript
// app/lending/page.tsx
export default function Lending() {
  const { supply, borrow, repay } = useLendingPool();
  const { activeLoan, poolStats } = useLendingPoolData();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SupplyCard onSupply={supply} poolStats={poolStats} />
      <BorrowCard onBorrow={borrow} activeLoan={activeLoan} />
      
      {activeLoan && (
        <ActiveLoanCard loan={activeLoan} onRepay={repay} />
      )}
    </div>
  );
}

// components/lending/BorrowForm.tsx
export function BorrowForm({ onBorrow, tier }) {
  const [amount, setAmount] = useState('');
  const collateralNeeded = calculateCollateral(amount, tier);
  
  return (
    <form onSubmit={handleBorrow}>
      <Input
        label="Borrow Amount (CTC)"
        value={amount}
        onChange={setAmount}
      />
      <CollateralDisplay
        required={collateralNeeded}
        savings={compareTo150Percent(collateralNeeded)}
      />
      <Button type="submit">Borrow</Button>
    </form>
  );
}
```

---

### **DAY 14: Landing Page + Leaderboard (5 hours)**

```typescript
// app/page.tsx (Landing)
export default function Home() {
  return (
    <>
      <Hero />
      <EvolutionSequence />
      <HowItWorks />
      <CollateralComparison />
      <CTA />
    </>
  );
}

// app/leaderboard/page.tsx
export default function Leaderboard() {
  const { data: users } = useLeaderboardData();
  
  return (
    <div>
      <CommunityStats totalUsers={users.length} />
      <LeaderboardTable users={users} />
    </div>
  );
}
```

---

## **WEEK 3: Polish & Submission**

### **DAY 15: Animation Implementation (4 hours)**

```typescript
// components/creature/EvolutionAnimation.tsx
export function EvolutionAnimation({ from, to, onComplete }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={from}
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 1.5, opacity: 0 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Image src={`/creatures/${from}.png`} />
      </motion.div>
      
      <motion.div
        key="flash"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 bg-white"
      />
      
      <motion.div
        key={to}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        onAnimationComplete={onComplete}
      >
        <Image src={`/creatures/${to}.png`} />
        <Confetti />
      </motion.div>
    </AnimatePresence>
  );
}
```

---

### **DAY 16: Testing & Bug Fixes (4 hours)**

- Manual E2E testing on testnet
- Test all user flows
- Fix edge cases discovered
- Optimize gas usage
- Improve error handling

---

### **DAY 17: Testnet Deployment & Seeding (2 hours)**

```bash
# Deploy to Creditcoin Testnet
npx hardhat run scripts/deploy.ts --network creditcoinTestnet

# Verify contracts
npx hardhat verify --network creditcoinTestnet <ADDRESS>

# Seed pool with liquidity
npx hardhat run scripts/seed.ts --network creditcoinTestnet
```

---

### **DAY 18: Mainnet Deployment (2 hours)**

```bash
# Deploy to mainnet
npx hardhat run scripts/deploy.ts --network creditcoinMainnet

# Update frontend env vars
# Deploy frontend to Vercel
vercel --prod
```

---

### **DAY 19: Demo Video Recording (4 hours)**

**Script:**
1. **Intro (15s)**: Problem statement
2. **Demo (90s)**: Full user journey
3. **Tech (20s)**: Why Creditcoin
4. **Close (15s)**: Impact

**Tools:**
- OBS Studio for screen recording
- CapCut for editing
- Epidemic Sound for music

---

### **DAY 20: Video Editing & Polish (4 hours)**

- Add transitions
- Add text overlays
- Add background music
- Color correction
- Export in 1080p

---

### **DAY 21: README & Submission (4 hours)**

```markdown
# CrediPet - Your Credit Score is Alive

## The Problem
DeFi requires 150% collateral. No trust. No reputation.

## The Solution
CrediPet = Pokemon meets DeFi. Your credit score evolves as you repay loans.
Better behavior → Lower collateral → Access to capital.

## How It Works
1. Mint your CrediPet (starts as an Egg)
2. Complete quests to build credit
3. Repay loans → Creature evolves → Collateral drops from 150% to 60%

## Tech Stack
- Solidity 0.8.24
- Creditcoin EVM L1
- Next.js 14 + wagmi
- Framer Motion

## Live Demo
https://credipet.vercel.app

## Contracts
- CrediPet: 0x...
- CreditScore: 0x...
- LendingPool: 0x...
- QuestBoard: 0x...

## Team
Solo dev: [Your Name]
```

---

## **Critical Path Timeline**

```
Week 1: Contracts (MUST FINISH)
├─ Day 1-3: Core contracts ✅
├─ Day 4-5: LendingPool ✅
├─ Day 6: QuestBoard ✅
└─ Day 7: Deploy to testnet ✅

Week 2: Frontend (55% of time)
├─ Day 8-9: Setup + Hooks ✅
├─ Day 10-13: Core pages ✅
└─ Day 14: Landing + Extra ✅

Week 3: Ship (15% of time)
├─ Day 15-17: Polish + Deploy ✅
├─ Day 18-20: Video ✅
└─ Day 21: Submit ✅
```

---

## **Success Metrics**

- [ ] All 4 contracts deployed to mainnet
- [ ] Full user flow works end-to-end
- [ ] Creature evolution animations work
- [ ] 3-minute demo video complete
- [ ] Submitted before Feb 22, 2026

---


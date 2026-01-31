# CrediPet - Full Build Plan

## One-liner
"Pokemon meets DeFi -- your credit score is a living creature that evolves as you build financial reputation on Creditcoin"

## 10x sentence
"This is Tamagotchi but your pet IS your credit score -- keep it alive and it unlocks real undercollateralized DeFi loans"

## Target
- Hackathon: BUIDL CTC (Creditcoin)
- Deadline: Feb 22, 2026 (online async submission)
- Demo Day: March 21, Seoul (if finalist)
- Prize: Top 3 ($10K / $3K / $2K)
- Track: DeFi (undercollateralized lending powered by credit reputation)

---

## Creditcoin Network Details

### Testnet (Development)
| Field | Value |
|-------|-------|
| Chain ID | `102031` |
| WSS RPC | `wss://rpc.cc3-testnet.creditcoin.network` |
| HTTP RPC | `https://rpc.cc3-testnet.creditcoin.network` |
| Block Explorer (EVM) | https://creditcoin-testnet.blockscout.com/ |
| Block Explorer (Substrate) | https://creditcoin3-testnet.subscan.io/ |
| Native Token | tCTC (test CTC) |
| Faucet | Creditcoin Discord `#faucet` channel |

### Mainnet (Submission)
| Field | Value |
|-------|-------|
| Chain ID | `102030` |
| WSS RPC | `wss://mainnet3.creditcoin.network` |
| HTTP RPC | `https://mainnet3.creditcoin.network` |
| Block Explorer (EVM) | https://creditcoin.blockscout.com/ |
| Block Explorer (Substrate) | https://creditcoin.subscan.io/ |
| Native Token | CTC |

> Creditcoin is a fully EVM-compatible L1. Standard Ethereum tools (Hardhat, Foundry, Remix) work out of the box. No special adapters needed.

---

## Project Structure

```
credit/
├── contracts/                    # Hardhat project
│   ├── contracts/
│   │   ├── CrediPet.sol          # ERC-721 soulbound creature NFT
│   │   ├── CreditScore.sol       # Credit reputation engine
│   │   ├── LendingPool.sol       # Undercollateralized lending
│   │   ├── QuestBoard.sol        # Gamified onboarding quests
│   │   └── interfaces/
│   │       ├── ICrediPet.sol
│   │       ├── ICreditScore.sol
│   │       ├── ILendingPool.sol
│   │       └── IQuestBoard.sol
│   ├── test/
│   │   ├── CrediPet.test.ts
│   │   ├── CreditScore.test.ts
│   │   ├── LendingPool.test.ts
│   │   ├── QuestBoard.test.ts
│   │   └── Integration.test.ts   # Full flow test
│   ├── scripts/
│   │   ├── deploy.ts             # Deploy all contracts
│   │   └── seed.ts               # Seed demo data (leaderboard)
│   ├── hardhat.config.ts
│   └── package.json
│
├── frontend/                     # Next.js app
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Landing page
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── lending/
│   │   │   └── page.tsx
│   │   └── leaderboard/
│   │       └── page.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── ConnectButton.tsx
│   │   ├── creature/
│   │   │   ├── CreatureDisplay.tsx      # Main creature image + animations
│   │   │   ├── EvolutionAnimation.tsx   # Stage transition effect
│   │   │   ├── HealthBar.tsx
│   │   │   └── StageBadge.tsx
│   │   ├── dashboard/
│   │   │   ├── CreditTierCard.tsx
│   │   │   ├── EvolutionProgress.tsx
│   │   │   ├── CollateralRatio.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── lending/
│   │   │   ├── SupplyForm.tsx
│   │   │   ├── BorrowForm.tsx
│   │   │   ├── RepayForm.tsx
│   │   │   ├── ActiveLoans.tsx
│   │   │   └── CollateralComparison.tsx
│   │   ├── quests/
│   │   │   ├── QuestBoard.tsx
│   │   │   ├── QuestCard.tsx
│   │   │   └── QuestCompletionToast.tsx
│   │   └── leaderboard/
│   │       ├── LeaderboardTable.tsx
│   │       └── CommunityStats.tsx
│   ├── hooks/
│   │   ├── useCrediPet.ts        # Read creature data
│   │   ├── useCreditScore.ts     # Read credit tier/stats
│   │   ├── useLendingPool.ts     # Supply/borrow/repay actions
│   │   ├── useQuests.ts          # Quest status + completion
│   │   └── useContractEvents.ts  # Listen for evolution/quest events
│   ├── lib/
│   │   ├── contracts.ts          # Contract addresses + ABIs
│   │   ├── wagmi.ts              # Wagmi config + Creditcoin chain def
│   │   ├── constants.ts          # Stage names, collateral ratios, etc.
│   │   └── utils.ts              # Formatting helpers
│   ├── public/
│   │   └── creatures/            # AI-generated art
│   │       ├── egg.png
│   │       ├── egg-weak.png
│   │       ├── hatchling.png
│   │       ├── hatchling-weak.png
│   │       ├── juvenile.png
│   │       ├── juvenile-weak.png
│   │       ├── adult.png
│   │       ├── adult-weak.png
│   │       ├── legendary.png
│   │       └── legendary-weak.png
│   ├── tailwind.config.ts
│   ├── next.config.js
│   └── package.json
│
├── planning.md                   # This file
└── README.md
```

---

## Architecture Overview

### Contract Dependency Graph

```
QuestBoard.sol
    ├── reads → CreditScore.sol
    ├── reads → LendingPool.sol
    └── reads → CrediPet.sol

LendingPool.sol
    └── calls → CreditScore.sol (on repay/default)

CreditScore.sol
    └── calls → CrediPet.sol (on tier upgrade)

CrediPet.sol
    └── standalone (called by CreditScore)
```

### State Machine: Creature Evolution

```
[No Pet] ──mint()──→ [Egg] (Tier 0, 150% collateral)
                        │
                    1 repayment
                        │
                        ▼
                   [Hatchling] (Tier 1, 130% collateral)
                        │
                    3 repayments
                        │
                        ▼
                    [Juvenile] (Tier 2, 110% collateral)
                        │
                    7 repayments
                        │
                        ▼
                     [Adult] (Tier 3, 85% collateral)
                        │
                 15 repayments + 0 defaults
                        │
                        ▼
                   [Legendary] (Tier 4, 60% collateral)

Health degradation (any stage):
  [Healthy] ──missed repayment──→ [Weakened]
  [Weakened] ──on-time repayment──→ [Healthy]
```

---

## Smart Contracts — Detailed Specification

### 1. `CrediPet.sol` (ERC-721 + Evolution Logic)

**Inherits:** ERC721, Ownable

**Storage:**
```solidity
struct Pet {
    uint8 stage;        // 0=Egg, 1=Hatchling, 2=Juvenile, 3=Adult, 4=Legendary
    bool isWeakened;    // true if missed a repayment
    uint256 mintedAt;   // block.timestamp
}

mapping(address => uint256) public petOfOwner;   // wallet → tokenId (1:1)
mapping(uint256 => Pet) public pets;             // tokenId → Pet data
uint256 private _nextTokenId;
address public creditScoreContract;              // only this can evolve pets
string public baseURI;                           // base URL for creature images
```

**Functions:**
```solidity
// Mint a new pet (one per wallet, called by user)
function mint() external returns (uint256 tokenId)
    - Requires: petOfOwner[msg.sender] == 0 (no existing pet)
    - Creates Pet{stage: 0, isWeakened: false, mintedAt: block.timestamp}
    - Emits: PetMinted(address owner, uint256 tokenId)

// Evolve pet to next stage (called only by CreditScore contract)
function evolve(address owner, uint8 newStage) external onlyCreditScore
    - Requires: newStage > current stage
    - Updates pets[tokenId].stage = newStage
    - Emits: PetEvolved(address owner, uint256 tokenId, uint8 oldStage, uint8 newStage)

// Set weakened state (called only by CreditScore contract)
function setWeakened(address owner, bool weakened) external onlyCreditScore
    - Updates pets[tokenId].isWeakened = weakened
    - Emits: PetHealthChanged(address owner, uint256 tokenId, bool isWeakened)

// Dynamic token URI based on stage + health
function tokenURI(uint256 tokenId) public view override returns (string memory)
    - Returns: baseURI + stageName + (isWeakened ? "-weak" : "") + ".json"
    - Example: "https://credipet.xyz/metadata/hatchling.json"

// Soulbound: block all transfers
function _update(address to, uint256 tokenId, address auth) internal override
    - Requires: from == address(0) (only minting allowed, no transfers)
```

**Events:**
```solidity
event PetMinted(address indexed owner, uint256 indexed tokenId);
event PetEvolved(address indexed owner, uint256 indexed tokenId, uint8 oldStage, uint8 newStage);
event PetHealthChanged(address indexed owner, uint256 indexed tokenId, bool isWeakened);
```

---

### 2. `CreditScore.sol` (Core Credit Reputation Engine)

**Storage:**
```solidity
struct CreditProfile {
    uint256 totalLoans;         // total loans ever taken
    uint256 totalRepaidOnTime;  // successful on-time repayments
    uint256 totalDefaulted;     // missed/late repayments
    uint256 currentStreak;      // consecutive on-time repayments
    uint8   currentTier;        // 0-4 matching creature stages
}

mapping(address => CreditProfile) public profiles;

// Tier thresholds
uint256[5] public tierThresholds = [0, 1, 3, 7, 15];
// Collateral ratios in basis points (150% = 15000)
uint256[5] public collateralRatios = [15000, 13000, 11000, 8500, 6000];
// Interest rates in basis points per loan period (e.g., 500 = 5%)
uint256[5] public interestRates = [500, 400, 300, 200, 100];

ICrediPet public crediPet;
address public lendingPool;  // only lending pool can report repayments
```

**Functions:**
```solidity
// Record an on-time repayment (called by LendingPool)
function recordRepayment(address user) external onlyLendingPool
    - Increments totalRepaidOnTime, currentStreak
    - Checks if user qualifies for tier upgrade
    - If tier upgrade: calls crediPet.evolve(user, newTier)
    - If user was weakened: calls crediPet.setWeakened(user, false)
    - Emits: RepaymentRecorded(address user, uint256 totalRepaid)
    - Emits: CreditTierUpgraded(address user, uint8 newTier) if upgraded

// Record a default/late payment (called by LendingPool)
function recordDefault(address user) external onlyLendingPool
    - Increments totalDefaulted, resets currentStreak to 0
    - Calls crediPet.setWeakened(user, true)
    - Emits: DefaultRecorded(address user, uint256 totalDefaults)

// Record a new loan taken (called by LendingPool)
function recordLoanTaken(address user) external onlyLendingPool
    - Increments totalLoans
    - Emits: LoanRecorded(address user, uint256 totalLoans)

// View functions
function getCreditTier(address user) external view returns (uint8)
function getCollateralRatio(address user) external view returns (uint256)
function getInterestRate(address user) external view returns (uint256)
function getProfile(address user) external view returns (CreditProfile memory)

// Internal: check if user qualifies for next tier
function _checkTierUpgrade(address user) internal returns (bool upgraded)
    - For Legendary (tier 4): requires totalRepaidOnTime >= 15 AND totalDefaulted == 0
    - For others: requires totalRepaidOnTime >= tierThresholds[nextTier]
```

**Events:**
```solidity
event RepaymentRecorded(address indexed user, uint256 totalRepaid);
event DefaultRecorded(address indexed user, uint256 totalDefaults);
event LoanRecorded(address indexed user, uint256 totalLoans);
event CreditTierUpgraded(address indexed user, uint8 oldTier, uint8 newTier);
```

---

### 3. `LendingPool.sol` (Undercollateralized Lending)

**Storage:**
```solidity
struct Loan {
    uint256 principal;          // amount borrowed (in wei)
    uint256 collateral;         // amount deposited as collateral (in wei)
    uint256 interestRate;       // basis points, snapshotted at borrow time
    uint256 borrowBlock;        // block number when borrowed
    uint256 dueBlock;           // block number when repayment is due
    bool    isActive;
    bool    isDefaulted;
}

mapping(address => Loan) public loans;          // one active loan per user
mapping(address => uint256) public deposits;    // supplier balances
uint256 public totalDeposits;
uint256 public totalBorrowed;
uint256 public loanDurationBlocks;              // configurable for demo (default: 50 blocks)

ICreditScore public creditScore;
```

**Functions:**
```solidity
// === SUPPLIER FUNCTIONS ===

// Deposit CTC to the lending pool
function supply() external payable
    - Requires: msg.value > 0
    - Updates deposits[msg.sender] += msg.value
    - Updates totalDeposits += msg.value
    - Emits: Supplied(address user, uint256 amount)

// Withdraw deposited CTC
function withdraw(uint256 amount) external
    - Requires: deposits[msg.sender] >= amount
    - Requires: pool has enough liquidity (totalDeposits - totalBorrowed >= amount)
    - Transfers CTC back to user
    - Emits: Withdrawn(address user, uint256 amount)

// === BORROWER FUNCTIONS ===

// Borrow CTC against credit-tiered collateral
function borrow(uint256 borrowAmount) external payable
    - Requires: no active loan (loans[msg.sender].isActive == false)
    - Reads collateral ratio from CreditScore: creditScore.getCollateralRatio(msg.sender)
    - Calculates required collateral: borrowAmount * collateralRatio / 10000
    - Requires: msg.value >= requiredCollateral
    - Requires: pool has liquidity (totalDeposits - totalBorrowed >= borrowAmount)
    - Creates Loan struct with dueBlock = block.number + loanDurationBlocks
    - Transfers borrowAmount to user
    - Calls creditScore.recordLoanTaken(msg.sender)
    - Emits: Borrowed(address user, uint256 amount, uint256 collateral, uint256 dueBlock)

// Repay loan (principal + interest)
function repay() external payable
    - Requires: loans[msg.sender].isActive == true
    - Calculates interest: principal * interestRate / 10000
    - Requires: msg.value >= principal + interest
    - Returns collateral to borrower
    - Marks loan inactive
    - If block.number <= dueBlock: creditScore.recordRepayment(msg.sender) (on time)
    - If block.number > dueBlock: creditScore.recordDefault(msg.sender) (late)
    - Refunds excess payment
    - Emits: Repaid(address user, uint256 principal, uint256 interest, bool onTime)

// Liquidate an overdue loan (callable by anyone after grace period)
function liquidate(address borrower) external
    - Requires: loan is active AND block.number > dueBlock + gracePeriod
    - Seizes collateral, distributes to pool
    - Marks loan as defaulted
    - Calls creditScore.recordDefault(borrower)
    - Emits: Liquidated(address borrower, uint256 collateralSeized)

// === VIEW FUNCTIONS ===
function getRequiredCollateral(address user, uint256 borrowAmount) external view returns (uint256)
function getLoanDetails(address user) external view returns (Loan memory)
function getPoolStats() external view returns (uint256 totalDeposits, uint256 totalBorrowed, uint256 available)

// === ADMIN ===
function setLoanDuration(uint256 blocks) external onlyOwner  // for demo tuning
```

**Events:**
```solidity
event Supplied(address indexed user, uint256 amount);
event Withdrawn(address indexed user, uint256 amount);
event Borrowed(address indexed user, uint256 amount, uint256 collateral, uint256 dueBlock);
event Repaid(address indexed user, uint256 principal, uint256 interest, bool onTime);
event Liquidated(address indexed borrower, uint256 collateralSeized);
```

**Constants:**
```solidity
uint256 public constant GRACE_PERIOD = 25;        // blocks after due before liquidation
uint256 public constant MIN_BORROW = 0.001 ether;  // minimum borrow amount
uint256 public constant MAX_BORROW = 10 ether;     // cap per loan for demo safety
```

---

### 4. `QuestBoard.sol` (Gamified Onboarding)

**Storage:**
```solidity
enum QuestId { HatchPet, FirstDeposit, FirstBorrow, FirstRepay, SupplyLiquidity, StreakBuilder, TrustFall, Legend }

struct Quest {
    string name;
    string description;
    uint256 xpReward;
}

mapping(uint8 => Quest) public quests;                      // questId → quest info
mapping(address => mapping(uint8 => bool)) public completed; // user → questId → done
mapping(address => uint256) public totalXP;

ICreditScore public creditScore;
ICrediPet public crediPet;
ILendingPool public lendingPool;
```

**Functions:**
```solidity
// Check and claim quest completion (called by user, validates on-chain state)
function claimQuest(uint8 questId) external
    - Requires: !completed[msg.sender][questId]
    - Validates quest condition:
        HatchPet:         crediPet.petOfOwner(msg.sender) != 0
        FirstDeposit:     lendingPool.deposits(msg.sender) > 0
        FirstBorrow:      creditScore.profiles(msg.sender).totalLoans >= 1
        FirstRepay:       creditScore.profiles(msg.sender).totalRepaidOnTime >= 1
        SupplyLiquidity:  lendingPool.deposits(msg.sender) >= 0.1 ether
        StreakBuilder:    creditScore.profiles(msg.sender).currentStreak >= 3
        TrustFall:        creditScore.getCreditTier(msg.sender) >= 2 AND has active/past loan at that tier
        Legend:           creditScore.getCreditTier(msg.sender) == 4
    - Marks completed, awards XP
    - Emits: QuestCompleted(address user, uint8 questId, uint256 xpAwarded, uint256 totalXP)

// View functions
function getQuestStatus(address user) external view returns (bool[8] memory)
function getQuest(uint8 questId) external view returns (Quest memory)
```

**Quest Definitions:**
| ID | Name | Description | XP |
|----|------|-------------|-----|
| 0 | Hatch Your Pet | Mint your CrediPet | 100 |
| 1 | First Deposit | Supply CTC to the lending pool | 150 |
| 2 | First Steps | Borrow your first micro-loan | 150 |
| 3 | Promise Keeper | Repay a loan on time | 200 |
| 4 | Generous Soul | Supply at least 0.1 CTC | 200 |
| 5 | Streak Builder | Repay 3 loans consecutively | 300 |
| 6 | Trust Fall | Borrow at reduced collateral (Juvenile+) | 400 |
| 7 | Legend | Reach Legendary tier | 500 |

---

## Frontend — Detailed Specification

### Wagmi / Chain Configuration

```typescript
// lib/wagmi.ts
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

export const creditcoinMainnet = defineChain({
  id: 102030,
  name: 'Creditcoin',
  nativeCurrency: { name: 'CTC', symbol: 'CTC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://mainnet3.creditcoin.network'] },
  },
  blockExplorers: {
    default: { name: 'Blockscout', url: 'https://creditcoin.blockscout.com' },
  },
});
```

### Environment Variables

```env
# .env.local
NEXT_PUBLIC_CHAIN=testnet                                # testnet | mainnet
NEXT_PUBLIC_CREDIPET_ADDRESS=0x...
NEXT_PUBLIC_CREDITSCORE_ADDRESS=0x...
NEXT_PUBLIC_LENDING_POOL_ADDRESS=0x...
NEXT_PUBLIC_QUESTBOARD_ADDRESS=0x...
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...                 # for WalletConnect
```

### Custom Hooks API

```typescript
// hooks/useCrediPet.ts
useCrediPet(address?: Address) → {
  pet: { stage, isWeakened, mintedAt } | null,
  tokenId: bigint | null,
  hasPet: boolean,
  mint: () => Promise<TransactionReceipt>,
  isLoading: boolean,
  stageName: string,         // "Egg" | "Hatchling" | etc.
  imageUrl: string,          // resolved creature image path
}

// hooks/useCreditScore.ts
useCreditScore(address?: Address) → {
  profile: CreditProfile | null,
  tier: number,
  tierName: string,
  collateralRatio: number,    // as percentage (e.g., 85)
  interestRate: number,       // as percentage (e.g., 2)
  nextTierThreshold: number,  // repayments needed
  progressToNextTier: number, // 0-100 percentage
}

// hooks/useLendingPool.ts
useLendingPool() → {
  // Read
  poolStats: { totalDeposits, totalBorrowed, available },
  userDeposit: bigint,
  activeLoan: Loan | null,
  requiredCollateral: (borrowAmount: bigint) => bigint,
  // Write
  supply: (amount: bigint) => Promise<TransactionReceipt>,
  withdraw: (amount: bigint) => Promise<TransactionReceipt>,
  borrow: (amount: bigint, collateral: bigint) => Promise<TransactionReceipt>,
  repay: (amount: bigint) => Promise<TransactionReceipt>,
  isLoading: boolean,
}

// hooks/useQuests.ts
useQuests(address?: Address) → {
  quests: Array<{ id, name, description, xp, completed }>,
  totalXP: number,
  claimQuest: (questId: number) => Promise<TransactionReceipt>,
  completedCount: number,
}
```

### Page Layouts

**1. Landing Page (`/`)**
```
┌────────────────────────────────────────────────────┐
│  [Logo]              [Connect Wallet]              │
├────────────────────────────────────────────────────┤
│                                                    │
│       🥚 → 🐣 → 🦎 → 🐉 → ✨                    │
│   (Animated creature evolution sequence)           │
│                                                    │
│   "Your credit score is alive."                    │
│   Pokemon meets DeFi on Creditcoin                 │
│                                                    │
│         [ Hatch Your CrediPet ]                    │
│                                                    │
├────────────────────────────────────────────────────┤
│  How It Works                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 1.Connect│ │ 2. Play  │ │ 3.Evolve │          │
│  │  Wallet  │ │  Quests  │ │& Borrow  │          │
│  └──────────┘ └──────────┘ └──────────┘          │
├────────────────────────────────────────────────────┤
│  "Standard DeFi: 150% collateral"                  │
│  "CrediPet Adult: 85% collateral"                  │
│  "The more you repay, the less you lock."          │
├────────────────────────────────────────────────────┤
│  [Footer: Built on Creditcoin | GitHub | Docs]     │
└────────────────────────────────────────────────────┘
```

**2. Dashboard (`/dashboard`)**
```
┌────────────────────────────────────────────────────┐
│  [Logo] [Dashboard] [Lending] [Board] [Connect]   │
├───────────────────────┬────────────────────────────┤
│                       │   QUEST BOARD              │
│   [Creature Image]    │   ☑ Hatch Your Pet    100XP│
│   Stage: Juvenile     │   ☑ First Deposit     150XP│
│   ████████░░ 70%      │   ☑ First Borrow      150XP│
│   Health: Healthy 💚  │   ☑ Promise Keeper    200XP│
│                       │   ☐ Generous Soul     200XP│
│   Credit Tier: 2      │   ☐ Streak Builder    300XP│
│   Collateral: 110%    │   ☐ Trust Fall        400XP│
│   Interest: 3%        │   ☐ Legend            500XP│
│                       │                            │
│   Next: 7 repayments  │   Total XP: 600           │
│   Progress: 3/7       │                            │
├───────────────────────┴────────────────────────────┤
│  RECENT ACTIVITY                                   │
│  • Repaid 0.5 CTC on time          2 min ago      │
│  • Evolved to Juvenile!            5 min ago      │
│  • Borrowed 0.5 CTC                8 min ago      │
└────────────────────────────────────────────────────┘
```

**3. Lending Page (`/lending`)**
```
┌────────────────────────────────────────────────────┐
│  [Logo] [Dashboard] [Lending] [Board] [Connect]   │
├────────────────────────────────────────────────────┤
│  ┌─ SUPPLY ─────────┐  ┌─ BORROW ─────────────┐  │
│  │                   │  │                       │  │
│  │ Your deposit:     │  │ Your collateral rate: │  │
│  │ 2.5 CTC          │  │ ██ 110% (Juvenile)    │  │
│  │                   │  │ vs Standard: 150%     │  │
│  │ [Amount: ___]     │  │ You save: 40%!        │  │
│  │ [ Supply CTC ]    │  │                       │  │
│  │ [ Withdraw  ]     │  │ [Amount: ___]         │  │
│  │                   │  │ Collateral needed:    │  │
│  │ Pool stats:       │  │ 0.55 CTC             │  │
│  │ Total: 50 CTC     │  │ [ Borrow CTC ]       │  │
│  │ Available: 35 CTC │  │                       │  │
│  └───────────────────┘  └───────────────────────┘  │
├────────────────────────────────────────────────────┤
│  ACTIVE LOAN                                       │
│  ┌──────────────────────────────────────────────┐  │
│  │ Borrowed: 0.5 CTC   Due: Block #12345       │  │
│  │ Interest: 0.015 CTC  Total owed: 0.515 CTC  │  │
│  │ Time left: ███████░░░  35/50 blocks          │  │
│  │                    [ Repay Now ]              │  │
│  └──────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────┘
```

**4. Leaderboard (`/leaderboard`)**
```
┌────────────────────────────────────────────────────┐
│  [Logo] [Dashboard] [Lending] [Board] [Connect]   │
├────────────────────────────────────────────────────┤
│  COMMUNITY STATS                                   │
│  Total Creatures: 127 | Loans Repaid: 843          │
│  Total Value Locked: 250 CTC                       │
├────────────────────────────────────────────────────┤
│  LEADERBOARD                                       │
│  #  Address        Stage      Repaid  Streak  XP   │
│  1  0xab..cd      Legendary    23      23    2000  │
│  2  0xef..12      Adult        12       8    1500  │
│  3  0x34..56      Adult         9       9    1200  │
│  4  0x78..9a      Juvenile      5       5     800  │
│  5  0xbc..de      Hatchling     2       2     400  │
│  ... (you)                                         │
└────────────────────────────────────────────────────┘
```

### Visual Design System

```
Colors:
  --bg-primary:    #0a0e17       (deep navy/black)
  --bg-secondary:  #111827       (dark card bg)
  --bg-card:       #1a2233       (elevated cards)
  --accent:        #6366f1       (indigo - primary actions)
  --accent-glow:   #818cf8       (hover states)
  --success:       #10b981       (green - healthy/on-time)
  --warning:       #f59e0b       (yellow - approaching due)
  --danger:        #ef4444       (red - overdue/weakened)
  --text:          #f1f5f9       (primary text)
  --text-muted:    #94a3b8       (secondary text)

  Tier colors:
  Egg:        #9ca3af (gray)
  Hatchling:  #34d399 (emerald)
  Juvenile:   #60a5fa (blue)
  Adult:      #a78bfa (purple)
  Legendary:  #fbbf24 (gold)

Typography:
  Font: Inter (body) + Space Grotesk (headings/numbers)

Animations (Framer Motion):
  - Creature idle: Subtle float (translateY ±5px, 3s loop)
  - Evolution: Scale up → white flash → new creature fades in (1.5s)
  - Health change: Shake (weakened) or pulse glow (recovery)
  - Quest complete: Confetti burst + slide-in toast
  - Numbers: Count-up animation on stats
  - Cards: Fade-in-up on page load (staggered 100ms)
```

---

## AI-Generated Creature Art

Pre-generate 5 evolution stages + 1 "weakened" variant per stage = ~10 images total
- Style: Consistent art style across all stages (same creature, growing more impressive)
- Egg: Small, glowing orb/egg with Creditcoin logo hints
- Hatchling: Small cute creature, simple features
- Juvenile: Medium creature, more defined, starts looking powerful
- Adult: Full creature, impressive, glowing credit aura
- Legendary: Majestic, golden/cosmic version, clearly the final form
- Weakened variants: Same stage but desaturated, cracks, drooping (missed payments)

**Art prompt template (for Midjourney/DALL-E):**
```
"A [stage] fantasy creature mascot for a crypto credit protocol,
[stage-specific description], glowing [tier-color] aura,
dark background, game art style, high detail, centered composition,
no text, square format"
```

Host in `frontend/public/creatures/` for hackathon speed. IPFS optional for bonus points.

---

## Deployment Pipeline

### Step 1: Local Development
```bash
# contracts/
npx hardhat node                          # Local chain
npx hardhat test                          # Run all tests
npx hardhat run scripts/deploy.ts --network localhost
```

### Step 2: Creditcoin Testnet
```bash
# hardhat.config.ts network config
networks: {
  creditcoinTestnet: {
    url: "https://rpc.cc3-testnet.creditcoin.network",
    chainId: 102031,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
  creditcoinMainnet: {
    url: "https://mainnet3.creditcoin.network",
    chainId: 102030,
    accounts: [process.env.DEPLOYER_PRIVATE_KEY],
  },
}

npx hardhat run scripts/deploy.ts --network creditcoinTestnet
```

### Step 3: Deploy Order (dependencies matter)
```
1. Deploy CrediPet.sol
2. Deploy CreditScore.sol (pass CrediPet address)
3. Deploy LendingPool.sol (pass CreditScore address)
4. Deploy QuestBoard.sol (pass CrediPet, CreditScore, LendingPool addresses)
5. Call CrediPet.setCreditScoreContract(CreditScore address)
6. Call CreditScore.setLendingPool(LendingPool address)
7. (Optional) Seed LendingPool with initial liquidity for demo
8. (Optional) Run seed script for leaderboard demo data
```

### Step 4: Frontend Deployment
```bash
# frontend/
npm run build
# Deploy to Vercel (connect GitHub repo)
# Set env vars in Vercel dashboard
```

---

## Testing Strategy

### Contract Tests (Hardhat + Chai)

**CrediPet.test.ts:**
- `should mint a pet for new user`
- `should revert mint if user already has pet`
- `should evolve pet when called by CreditScore`
- `should revert evolve from unauthorized caller`
- `should set weakened state`
- `should block transfers (soulbound)`
- `should return correct tokenURI for each stage + health combo`

**CreditScore.test.ts:**
- `should start user at tier 0`
- `should upgrade to tier 1 after 1 repayment`
- `should upgrade to tier 2 after 3 repayments`
- `should upgrade to tier 3 after 7 repayments`
- `should upgrade to tier 4 after 15 repayments with 0 defaults`
- `should NOT upgrade to tier 4 if any defaults`
- `should reset streak on default`
- `should set creature weakened on default`
- `should recover creature health on next repayment`
- `should return correct collateral ratio per tier`

**LendingPool.test.ts:**
- `should accept deposits`
- `should allow withdrawal of available funds`
- `should reject withdrawal exceeding balance`
- `should calculate correct collateral for each tier`
- `should allow borrow with sufficient collateral`
- `should reject borrow with insufficient collateral`
- `should allow on-time repayment and credit score update`
- `should mark late repayment and record default`
- `should allow liquidation after grace period`
- `should reject liquidation before grace period`
- `should enforce one active loan per user`

**QuestBoard.test.ts:**
- `should allow claiming quest when condition met`
- `should reject claiming incomplete quest`
- `should reject re-claiming completed quest`
- `should award correct XP`

**Integration.test.ts:**
- `full flow: mint → deposit → borrow → repay → evolve → claim quests`
- `default flow: borrow → miss deadline → creature weakens → recover`

---

## Time Allocation (80 hours total)

**ENFORCED RATIO: 55% frontend+creature / 30% contracts / 15% video+submission**

### Week 1 (Days 1-7): Foundation -- 30 hours
| Task | Hours | Priority |
|------|-------|----------|
| Generate all creature art (AI) + review/iterate | 4 | HIGH |
| Smart contracts: CreditScore.sol | 4 | HIGH |
| Smart contracts: CrediPet.sol (ERC-721 + evolution) | 4 | HIGH |
| Smart contracts: LendingPool.sol | 6 | HIGH |
| Smart contracts: QuestBoard.sol | 3 | MEDIUM |
| Contract testing (Hardhat) | 3 | HIGH |
| Deploy to Creditcoin testnet | 2 | HIGH |
| Next.js project setup + wallet connection + wagmi config | 4 | HIGH |

### Week 2 (Days 8-14): Frontend + Polish -- 32 hours
| Task | Hours | Priority |
|------|-------|----------|
| Dashboard page: creature display + evolution animation | 8 | CRITICAL |
| Lending page: supply/borrow/repay UI | 6 | HIGH |
| Quest board UI with completion tracking | 5 | HIGH |
| Landing page (hero + how it works) | 4 | MEDIUM |
| Leaderboard page | 3 | MEDIUM |
| Evolution transition animations (Framer Motion) | 4 | HIGH |
| End-to-end testing: full quest → evolve → borrow flow | 2 | HIGH |

### Week 3 (Days 15-21): Submission -- 18 hours
| Task | Hours | Priority |
|------|-------|----------|
| Deploy to Creditcoin mainnet (or testnet if required) | 2 | HIGH |
| Bug fixes + polish | 4 | HIGH |
| Record demo video (full flow: hatch → quest → evolve → borrow) | 4 | CRITICAL |
| Edit video (CapCut/DaVinci: music, text overlays, transitions) | 4 | CRITICAL |
| Write README + submission materials | 2 | HIGH |
| Final review + submit | 2 | HIGH |

---

## Implementation Order (Dependency-Aware)

This is the exact sequence to build in, respecting dependencies:

### Phase 1: Contracts (in order)
1. **Interfaces first** — write `ICrediPet.sol`, `ICreditScore.sol`, `ILendingPool.sol`, `IQuestBoard.sol`
2. **CrediPet.sol** — no dependencies, deploy first
3. **CreditScore.sol** — depends on ICrediPet (calls evolve/setWeakened)
4. **LendingPool.sol** — depends on ICreditScore (reads tiers, records repayments)
5. **QuestBoard.sol** — depends on all three (reads state)
6. **Tests** — write alongside each contract
7. **Deploy script** — handles linking + initialization calls
8. **Testnet deploy** — verify on Blockscout explorer

### Phase 2: Frontend Foundation
9. **Next.js scaffold** — app router, Tailwind, Framer Motion
10. **Wagmi config** — Creditcoin chain definition, provider setup, ConnectButton
11. **lib/contracts.ts** — import ABIs from Hardhat artifacts, configure contract instances
12. **Custom hooks** — useCrediPet, useCreditScore, useLendingPool, useQuests

### Phase 3: Frontend Pages
13. **Navbar + Layout** — navigation, wallet status, responsive shell
14. **Dashboard** — creature display, credit stats, quest board, activity feed
15. **Lending page** — supply/borrow/repay forms, active loan display
16. **Landing page** — hero, how-it-works, CTA
17. **Leaderboard** — table + community stats
18. **Animations** — evolution transitions, quest completion, idle creature

### Phase 4: Polish + Ship
19. **E2E manual test** — full flow on testnet
20. **Mainnet deploy** — same scripts, different network
21. **Vercel deploy** — frontend live URL
22. **Demo video** — record + edit
23. **README + submission**

---

## Demo Flow (Video Script)

**Opening (15 sec):**
"What if your credit score was alive?"
Show Legendary CrediPet creature, dramatic reveal.

**Problem (20 sec):**
"DeFi requires 150% collateral to borrow. No trust. No reputation. Every user starts at zero, every time."
Show standard DeFi borrow screen with 150% requirement.

**Solution (30 sec):**
"CrediPet turns your on-chain credit reputation into a living creature. Complete financial quests. Build trust. Your creature evolves. Your collateral drops."
Show creature evolution sequence: Egg → Hatchling → Adult.

**Live Demo (90 sec):**
1. Connect wallet → CrediPet egg appears
2. Complete "First Deposit" quest → Creature hatches! (animation)
3. Borrow → Repay on time → XP gained, creature evolves
4. Show collateral ratio dropping: 150% → 130% → 110%
5. Show leaderboard with multiple creatures
6. Show "weakened" creature from missed payment (contrast)

**Why Creditcoin (20 sec):**
"This is only possible on Creditcoin. Native credit reputation infrastructure means your CrediPet reads REAL on-chain credit history. Try this on Ethereum -- you can't. There's no credit layer."

**Close (15 sec):**
"CrediPet. Build credit. Evolve. Borrow smarter."
Show all 5 evolution stages side by side.

**Total: ~3 minutes**

---

## Technical Stack

- **Contracts:** Solidity 0.8.20+, Hardhat, OpenZeppelin (ERC721, Ownable, ReentrancyGuard)
- **Chain:** Creditcoin EVM L1 (testnet `102031` → mainnet `102030`)
- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, Framer Motion
- **Web3:** wagmi v2 + viem + @rainbow-me/rainbowkit (or custom ConnectButton)
- **Art:** AI-generated (Midjourney/DALL-E), 5 stages + weakened variants
- **Storage:** `public/creatures/` folder (IPFS optional for bonus)
- **Testing:** Hardhat + Chai for contracts, manual E2E for frontend
- **Deployment:** Vercel (frontend), Hardhat deploy scripts (contracts)

---

## Submission Checklist

- [ ] Working deployment on Creditcoin (testnet or mainnet)
- [ ] All 4 contracts verified on Blockscout explorer
- [ ] Demo video (~3 min, polished with music + text overlays)
- [ ] GitHub repo with clean README
- [ ] README structure: Problem → Solution → How it works → Tech stack → Demo link → Team
- [ ] Screenshots of creature evolution stages
- [ ] Live demo URL (Vercel deployment)
- [ ] Contract addresses documented in README

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Creditcoin testnet issues / RPC problems | Research Creditcoin dev docs early (Day 1). Have local Hardhat fork as backup. Test RPC connectivity first. |
| Creature art doesn't look good | Generate art FIRST (Day 1-2). Iterate before building frontend around it. |
| Lending protocol too complex, eats time | Cap lending features: fixed rate, simple liquidation. No oracle dependency. Use CTC price as 1:1 for demo. |
| Video quality insufficient for async | Start recording by Day 15. Leave 4 full hours for editing. |
| Scope creep (adding features) | FREEZE features after Week 2. Week 3 is polish + video ONLY. |
| Quest timing doesn't work for demo | Use configurable `loanDurationBlocks`. Set to ~10 blocks for demo so full cycle completes in minutes. |
| Gas fees too high on mainnet | Test all flows on testnet first. Optimize contract gas. If mainnet too expensive, submit on testnet. |
| Reentrancy in LendingPool | Use OpenZeppelin's ReentrancyGuard on all state-changing functions with ETH transfers. |

---

## What Makes This Win

1. **Chain identity validation:** Creditcoin = credit reputation. CrediPet = credit reputation as living creature. Judges see their thesis proven.
2. **CEIP investable:** Gamified credit building for 1.4B unbanked people. Real market, real product potential.
3. **Tier 1 demo:** Judges watch creature evolve, want to try it themselves.
4. **Impossible elsewhere:** No credit reputation layer on Ethereum. This NEEDS Creditcoin.
5. **Emotionally memorable:** "The creature one" sticks in judge memory during async review.
6. **"BUIDL for the Real World":** Credit reputation for emerging market lending = real world impact.

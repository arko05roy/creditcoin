import CrediPetABI from './abis/CrediPet.json';
import CreditScoreABI from './abis/CreditScore.json';
import LendingPoolABI from './abis/LendingPool.json';
import QuestBoardABI from './abis/QuestBoard.json';

// Contract Addresses (Creditcoin Testnet Deployment)
export const CONTRACT_ADDRESSES = {
    crediPet: process.env.NEXT_PUBLIC_CREDIPET_ADDRESS as `0x${string}`,
    creditScore: process.env.NEXT_PUBLIC_CREDITSCORE_ADDRESS as `0x${string}`,
    lendingPool: process.env.NEXT_PUBLIC_LENDINGPOOL_ADDRESS as `0x${string}`,
    questBoard: process.env.NEXT_PUBLIC_QUESTBOARD_ADDRESS as `0x${string}`,
} as const;

// Contract Configurations
export const contracts = {
    crediPet: {
        address: CONTRACT_ADDRESSES.crediPet,
        abi: CrediPetABI,
    },
    creditScore: {
        address: CONTRACT_ADDRESSES.creditScore,
        abi: CreditScoreABI,
    },
    lendingPool: {
        address: CONTRACT_ADDRESSES.lendingPool,
        abi: LendingPoolABI,
    },
    questBoard: {
        address: CONTRACT_ADDRESSES.questBoard,
        abi: QuestBoardABI,
    },
} as const;

// Export individual ABIs for type inference
export { CrediPetABI, CreditScoreABI, LendingPoolABI, QuestBoardABI };

// Pet Stage Names
export const PET_STAGES = ['Egg', 'Hatchling', 'Juvenile', 'Adult', 'Legendary'] as const;

// Credit Tier Names  
export const CREDIT_TIERS = ['Newcomer', 'Hatchling', 'Juvenile', 'Adult', 'Legendary'] as const;

// Quest Names and Descriptions
export const QUESTS = [
    { id: 0, name: 'Hatch Your Pet', description: 'Mint your CrediPet', xp: 100 },
    { id: 1, name: 'First Deposit', description: 'Supply CTC to pool', xp: 150 },
    { id: 2, name: 'First Steps', description: 'Borrow your first loan', xp: 150 },
    { id: 3, name: 'Promise Keeper', description: 'Repay a loan on time', xp: 200 },
    { id: 4, name: 'Generous Soul', description: 'Supply at least 0.1 CTC', xp: 200 },
    { id: 5, name: 'Streak Builder', description: 'Repay 3 loans consecutively', xp: 300 },
    { id: 6, name: 'Trust Fall', description: 'Borrow at Juvenile tier or higher', xp: 400 },
    { id: 7, name: 'Legend', description: 'Reach Legendary tier', xp: 500 },
] as const;

// Collateral Ratios by Tier (in basis points)
export const COLLATERAL_RATIOS = {
    0: 15000, // 150%
    1: 13000, // 130%
    2: 11000, // 110%
    3: 8500,  // 85%
    4: 6000,  // 60%
} as const;

// Interest Rates by Tier (in basis points)
export const INTEREST_RATES = {
    0: 500, // 5%
    1: 400, // 4%
    2: 300, // 3%
    3: 200, // 2%
    4: 100, // 1%
} as const;

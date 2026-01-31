import CrediPetABI from './abis/CrediPet.json';
import CreditScoreABI from './abis/CreditScore.json';
import LendingPoolABI from './abis/LendingPool.json';
import QuestBoardABI from './abis/QuestBoard.json';

// Contract Addresses (Creditcoin Testnet Deployment)
// Hardcoded with fallbacks for production
export const CONTRACT_ADDRESSES = {
    crediPet: (process.env.NEXT_PUBLIC_CREDIPET_ADDRESS || '0xeEc45Fd463EA8137e46170694414703Ebb791119') as `0x${string}`,
    creditScore: (process.env.NEXT_PUBLIC_CREDITSCORE_ADDRESS || '0x8c7Ffc95fcD2b9Dfb48272A0cEb6f54e7CE77b14') as `0x${string}`,
    lendingPool: (process.env.NEXT_PUBLIC_LENDINGPOOL_ADDRESS || '0x5754C71c2474FE8F2B83C43432Faf0AC94cc24A5') as `0x${string}`,
    questBoard: (process.env.NEXT_PUBLIC_QUESTBOARD_ADDRESS || '0x98eFA762eDa5FB0C3BA02296c583A5a542c66c8b') as `0x${string}`,
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

// Pet Sprite Configuration
export const PET_SPRITES = {
    stages: ['egg', 'hatchling', 'juvenile', 'adult', 'legendary'] as const,

    // Image paths for each stage (add your sprites to public/pets/)
    images: {
        0: { normal: '/pets/egg.png', weak: '/pets/egg-weak.png' },
        1: { normal: '/pets/hatchling.png', weak: '/pets/hatchling-weak.png' },
        2: { normal: '/pets/juvenile.png', weak: '/pets/juvenile-weak.png' },
        3: { normal: '/pets/adult.png', weak: '/pets/adult-weak.png' },
        4: { normal: '/pets/legendary.png', weak: '/pets/legendary-weak.png' },
    } as const,

    // Fallback emojis when images aren't available
    emojis: ['🥚', '🐣', '🐤', '🦅', '🐉'] as const,

    // Colors for each stage (used for backgrounds/borders)
    colors: {
        0: { primary: '#fbbf24', secondary: '#f59e0b' }, // Egg - Yellow/Orange
        1: { primary: '#34d399', secondary: '#10b981' }, // Hatchling - Green
        2: { primary: '#60a5fa', secondary: '#3b82f6' }, // Juvenile - Blue
        3: { primary: '#a78bfa', secondary: '#8b5cf6' }, // Adult - Purple
        4: { primary: '#f472b6', secondary: '#ec4899' }, // Legendary - Pink
    } as const,
};

/**
 * Get pet sprite image path
 * @param stage Pet stage (0-4)
 * @param isWeakened Whether pet is weakened
 * @returns Image path string
 */
export function getPetImage(stage: number, isWeakened: boolean = false): string {
    const stageImages = PET_SPRITES.images[stage as keyof typeof PET_SPRITES.images];
    if (!stageImages) return PET_SPRITES.images[0].normal;
    return isWeakened ? stageImages.weak : stageImages.normal;
}

/**
 * Get pet emoji fallback
 * @param stage Pet stage (0-4)
 * @returns Emoji string
 */
export function getPetEmoji(stage: number): string {
    return PET_SPRITES.emojis[stage] || PET_SPRITES.emojis[0];
}

/**
 * Get pet stage color
 * @param stage Pet stage (0-4)
 * @returns Color object with primary and secondary
 */
export function getPetColor(stage: number): { primary: string; secondary: string } {
    return PET_SPRITES.colors[stage as keyof typeof PET_SPRITES.colors] || PET_SPRITES.colors[0];
}


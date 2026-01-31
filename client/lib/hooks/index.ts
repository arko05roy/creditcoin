// CrediPet Hooks
export {
    useHasPet,
    usePetOfOwner,
    useGetPet,
    useUserPet,
    useMintPet,
    type Pet,
} from './useCrediPet';

// CreditScore Hooks
export {
    useCreditProfile,
    useCreditTier,
    useCollateralRatio,
    useInterestRate,
    type CreditProfile,
} from './useCreditScore';

// LendingPool Hooks
export {
    useUserDeposits,
    useUserLoan,
    usePoolStats,
    useRequiredCollateral,
    useRepaymentAmount,
    useSupply,
    useWithdraw,
    useBorrow,
    useRepay,
    useLiquidate,
    type Loan,
    type PoolStats,
} from './useLendingPool';

// QuestBoard Hooks
export {
    useQuest,
    useQuestStatus,
    useCanClaimQuest,
    useTotalXP,
    useClaimableQuests,
    useClaimQuest,
    type Quest,
} from './useQuestBoard';

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts, QUESTS } from '../contracts';

// Types
export interface Quest {
    name: string;
    description: string;
    xpReward: bigint;
    isActive: boolean;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Get quest details by ID
 */
export function useQuest(questId: number) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.questBoard,
        functionName: 'getQuest',
        args: [BigInt(questId)],
    });

    const quest = data as Quest | undefined;

    return {
        quest,
        questInfo: QUESTS[questId],
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get all quest statuses for a user
 */
export function useQuestStatus(address: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.questBoard,
        functionName: 'getQuestStatus',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const statuses = data as boolean[] | undefined;

    // Combine with quest info
    const questsWithStatus = statuses?.map((completed, index) => ({
        ...QUESTS[index],
        completed,
    }));

    return {
        statuses,
        questsWithStatus,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Check if user can claim a specific quest
 */
export function useCanClaimQuest(address: `0x${string}` | undefined, questId: number) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.questBoard,
        functionName: 'canClaimQuest',
        args: address ? [address, BigInt(questId)] : undefined,
        query: { enabled: !!address },
    });

    return {
        canClaim: data as boolean | undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get total XP for a user
 */
export function useTotalXP(address: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.questBoard,
        functionName: 'totalXP',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return {
        totalXP: data as bigint | undefined,
        totalXPNumber: data ? Number(data) : undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get all claimable quests for a user
 */
export function useClaimableQuests(address: `0x${string}` | undefined) {
    const { statuses, isLoading: isLoadingStatus } = useQuestStatus(address);

    // For each uncompleted quest, check if claimable
    const q0 = useCanClaimQuest(address, 0);
    const q1 = useCanClaimQuest(address, 1);
    const q2 = useCanClaimQuest(address, 2);
    const q3 = useCanClaimQuest(address, 3);
    const q4 = useCanClaimQuest(address, 4);
    const q5 = useCanClaimQuest(address, 5);
    const q6 = useCanClaimQuest(address, 6);
    const q7 = useCanClaimQuest(address, 7);

    const canClaimResults = [q0, q1, q2, q3, q4, q5, q6, q7];

    const claimableQuests = QUESTS.filter((quest, index) => {
        const notCompleted = statuses ? !statuses[index] : true;
        const canClaim = canClaimResults[index]?.canClaim;
        return notCompleted && canClaim;
    });

    const isLoading = isLoadingStatus || canClaimResults.some(q => q.isLoading);

    return {
        claimableQuests,
        isLoading,
    };
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Claim a quest
 */
export function useClaimQuest() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const claimQuest = (questId: number) => {
        writeContract({
            ...contracts.questBoard,
            functionName: 'claimQuest',
            args: [questId], // uint8, not BigInt
            gas: BigInt(500000), // Explicit gas limit
        });
    };

    return {
        claimQuest,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contracts, PET_STAGES } from '../contracts';

// Types
export interface Pet {
    stage: number;
    isWeakened: boolean;
    mintedAt: bigint;
}

export interface UsePetResult {
    pet: Pet | undefined;
    stageName: string | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Check if an address owns a pet
 */
export function useHasPet(address: `0x${string}` | undefined) {
    return useReadContract({
        ...contracts.crediPet,
        functionName: 'hasPet',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
}

/**
 * Get the pet token ID for an owner
 */
export function usePetOfOwner(address: `0x${string}` | undefined) {
    return useReadContract({
        ...contracts.crediPet,
        functionName: 'petOfOwner',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
}

/**
 * Get pet data by token ID
 */
export function useGetPet(tokenId: bigint | undefined): UsePetResult {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.crediPet,
        functionName: 'getPet',
        args: tokenId !== undefined ? [tokenId] : undefined,
        query: { enabled: tokenId !== undefined },
    });

    const pet = data as Pet | undefined;
    const stageName = pet ? PET_STAGES[pet.stage] : undefined;

    return {
        pet,
        stageName,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get pet data for current user's address
 */
export function useUserPet(address: `0x${string}` | undefined) {
    const { data: tokenId, isLoading: isLoadingTokenId } = usePetOfOwner(address);
    const petResult = useGetPet(tokenId as bigint | undefined);

    return {
        ...petResult,
        tokenId: tokenId as bigint | undefined,
        isLoading: isLoadingTokenId || petResult.isLoading,
    };
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Mint a new pet
 */
export function useMintPet() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();

    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const mint = () => {
        writeContract({
            ...contracts.crediPet,
            functionName: 'mint',
        });
    };

    return {
        mint,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

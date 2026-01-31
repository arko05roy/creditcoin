import { useReadContract } from 'wagmi';
import { contracts, CREDIT_TIERS, COLLATERAL_RATIOS, INTEREST_RATES } from '../contracts';

// Types
export interface CreditProfile {
    tier: number;
    totalRepayments: bigint;
    totalDefaults: bigint;
    consecutiveRepays: bigint;
    totalLoans: bigint;
    lastRepaymentBlock: bigint;
}

export interface UseCreditProfileResult {
    profile: CreditProfile | undefined;
    tierName: string | undefined;
    collateralRatio: number | undefined;
    interestRate: number | undefined;
    isLoading: boolean;
    error: Error | null;
    refetch: () => void;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Get the credit profile for an address
 */
export function useCreditProfile(address: `0x${string}` | undefined): UseCreditProfileResult {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.creditScore,
        functionName: 'getProfile',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const profile = data as CreditProfile | undefined;
    const tierName = profile ? CREDIT_TIERS[profile.tier] : undefined;
    const collateralRatio = profile ? COLLATERAL_RATIOS[profile.tier as keyof typeof COLLATERAL_RATIOS] : undefined;
    const interestRate = profile ? INTEREST_RATES[profile.tier as keyof typeof INTEREST_RATES] : undefined;

    return {
        profile,
        tierName,
        collateralRatio,
        interestRate,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get the credit tier for an address
 */
export function useCreditTier(address: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.creditScore,
        functionName: 'getCreditTier',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return {
        tier: data as number | undefined,
        tierName: data !== undefined ? CREDIT_TIERS[data as number] : undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get the collateral ratio for an address
 */
export function useCollateralRatio(address: `0x${string}` | undefined) {
    return useReadContract({
        ...contracts.creditScore,
        functionName: 'getCollateralRatio',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
}

/**
 * Get the interest rate for an address
 */
export function useInterestRate(address: `0x${string}` | undefined) {
    return useReadContract({
        ...contracts.creditScore,
        functionName: 'getInterestRate',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });
}

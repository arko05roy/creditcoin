import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { contracts } from '../contracts';

// Types
export interface Loan {
    principal: bigint;
    collateral: bigint;
    interestRate: bigint;
    startBlock: bigint;
    dueBlock: bigint;
    isActive: boolean;
    isDefaulted: boolean;
}

export interface PoolStats {
    totalDeposits: bigint;
    totalBorrowed: bigint;
    availableLiquidity: bigint;
}

// ============================================
// READ HOOKS
// ============================================

/**
 * Get user's deposit balance
 */
export function useUserDeposits(address: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.lendingPool,
        functionName: 'deposits',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return {
        deposits: data as bigint | undefined,
        depositsFormatted: data ? formatEther(data as bigint) : undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get user's active loan
 */
export function useUserLoan(address: `0x${string}` | undefined) {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.lendingPool,
        functionName: 'getLoan',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    const loan = data as Loan | undefined;

    return {
        loan,
        principalFormatted: loan?.principal ? formatEther(loan.principal) : undefined,
        collateralFormatted: loan?.collateral ? formatEther(loan.collateral) : undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get pool statistics
 */
export function usePoolStats() {
    const { data, isLoading, error, refetch } = useReadContract({
        ...contracts.lendingPool,
        functionName: 'getPoolStats',
    });

    const stats = data as [bigint, bigint, bigint] | undefined;

    return {
        totalDeposits: stats?.[0],
        totalBorrowed: stats?.[1],
        availableLiquidity: stats?.[2],
        totalDepositsFormatted: stats?.[0] ? formatEther(stats[0]) : undefined,
        totalBorrowedFormatted: stats?.[1] ? formatEther(stats[1]) : undefined,
        availableLiquidityFormatted: stats?.[2] ? formatEther(stats[2]) : undefined,
        isLoading,
        error: error as Error | null,
        refetch,
    };
}

/**
 * Get required collateral for a borrow amount
 */
export function useRequiredCollateral(address: `0x${string}` | undefined, borrowAmount: string) {
    const { data, isLoading, error } = useReadContract({
        ...contracts.lendingPool,
        functionName: 'getRequiredCollateral',
        args: address && borrowAmount ? [address, parseEther(borrowAmount)] : undefined,
        query: { enabled: !!address && !!borrowAmount && parseFloat(borrowAmount) > 0 },
    });

    return {
        requiredCollateral: data as bigint | undefined,
        requiredCollateralFormatted: data ? formatEther(data as bigint) : undefined,
        isLoading,
        error: error as Error | null,
    };
}

/**
 * Get repayment amount for a loan
 */
export function useRepaymentAmount(address: `0x${string}` | undefined) {
    const { data, isLoading, error } = useReadContract({
        ...contracts.lendingPool,
        functionName: 'getRepaymentAmount',
        args: address ? [address] : undefined,
        query: { enabled: !!address },
    });

    return {
        repaymentAmount: data as bigint | undefined,
        repaymentAmountFormatted: data ? formatEther(data as bigint) : undefined,
        isLoading,
        error: error as Error | null,
    };
}

// ============================================
// WRITE HOOKS
// ============================================

/**
 * Supply CTC to the lending pool
 */
export function useSupply() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const supply = (amount: string) => {
        writeContract({
            ...contracts.lendingPool,
            functionName: 'supply',
            value: parseEther(amount),
            gas: BigInt(300000),
        });
    };

    return {
        supply,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Withdraw CTC from the lending pool
 */
export function useWithdraw() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const withdraw = (amount: string) => {
        writeContract({
            ...contracts.lendingPool,
            functionName: 'withdraw',
            args: [parseEther(amount)],
            gas: BigInt(300000),
        });
    };

    return {
        withdraw,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Borrow CTC from the lending pool
 */
export function useBorrow() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const borrow = (amount: string, collateral: string) => {
        writeContract({
            ...contracts.lendingPool,
            functionName: 'borrow',
            args: [parseEther(amount)],
            value: parseEther(collateral),
            gas: BigInt(500000),
        });
    };

    return {
        borrow,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Repay a loan
 */
export function useRepay() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const repay = (amount: string) => {
        writeContract({
            ...contracts.lendingPool,
            functionName: 'repay',
            value: parseEther(amount),
            gas: BigInt(500000),
        });
    };

    return {
        repay,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

/**
 * Liquidate a defaulted loan
 */
export function useLiquidate() {
    const { writeContract, data: hash, isPending, error } = useWriteContract();
    const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

    const liquidate = (borrower: `0x${string}`) => {
        writeContract({
            ...contracts.lendingPool,
            functionName: 'liquidate',
            args: [borrower],
            gas: BigInt(500000),
        });
    };

    return {
        liquidate,
        hash,
        isPending,
        isConfirming,
        isSuccess,
        error,
    };
}

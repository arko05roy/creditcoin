'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/Navbar';
import { useCreditProfile } from '@/lib/hooks/useCreditScore';
import {
    useUserDeposits,
    useUserLoan,
    usePoolStats,
    useRequiredCollateral,
    useRepaymentAmount,
    useSupply,
    useWithdraw,
    useBorrow,
    useRepay
} from '@/lib/hooks/useLendingPool';

type Tab = 'supply' | 'borrow' | 'repay';

function SupplyTab() {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const { depositsFormatted, refetch } = useUserDeposits(address);
    const { supply, isPending, isConfirming, isSuccess, error } = useSupply();

    const handleSupply = () => {
        if (amount && parseFloat(amount) > 0) {
            supply(amount);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="text-4xl mb-2">💰</div>
                <h3 className="text-2xl font-bold mb-2">Supply CTC</h3>
                <p className="text-white/60">Deposit CTC to the lending pool and help others borrow</p>
            </div>

            {/* Current Deposit */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex justify-between items-center">
                    <span className="text-white/70">Your Current Deposits</span>
                    <span className="text-xl font-bold">{parseFloat(depositsFormatted || '0').toFixed(4)} CTC</span>
                </div>
            </div>

            {/* Input */}
            <div>
                <label className="block text-sm text-white/60 mb-2">Amount to Supply</label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="input-field pr-16"
                        step="0.01"
                        min="0"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">CTC</span>
                </div>
            </div>

            {/* Quick Amounts */}
            <div className="grid grid-cols-4 gap-2">
                {['0.1', '0.5', '1', '5'].map((val) => (
                    <button
                        key={val}
                        onClick={() => setAmount(val)}
                        className="btn-secondary py-2 text-sm"
                    >
                        {val} CTC
                    </button>
                ))}
            </div>

            {/* Submit Button */}
            <button
                onClick={handleSupply}
                disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
                {isPending ? '⏳ Waiting for approval...' :
                    isConfirming ? '🔄 Confirming...' :
                        '💰 Supply CTC'}
            </button>

            {isSuccess && (
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-center">
                    🎉 Successfully supplied! Your deposit is now earning.
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-center">
                    ❌ Error: {error.message}
                </div>
            )}
        </div>
    );
}

function BorrowTab() {
    const { address } = useAccount();
    const [amount, setAmount] = useState('');
    const { profile, collateralRatio, interestRate } = useCreditProfile(address);
    const { loan } = useUserLoan(address);
    const { requiredCollateralFormatted } = useRequiredCollateral(address, amount);
    const { availableLiquidityFormatted } = usePoolStats();
    const { borrow, isPending, isConfirming, isSuccess, error } = useBorrow();

    const handleBorrow = () => {
        if (amount && requiredCollateralFormatted) {
            borrow(amount, requiredCollateralFormatted);
        }
    };

    if (loan?.isActive) {
        return (
            <div className="text-center py-8">
                <div className="text-6xl mb-4">⚠️</div>
                <h3 className="text-2xl font-bold mb-2">Active Loan Exists</h3>
                <p className="text-white/60 mb-6">
                    You already have an active loan. Please repay it before borrowing again.
                </p>
                <div className="glass-card p-4 inline-block">
                    <span className="text-white/50">Outstanding: </span>
                    <span className="text-xl font-bold gradient-text">{loan.principal.toString()} CTC</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="text-4xl mb-2">📤</div>
                <h3 className="text-2xl font-bold mb-2">Borrow CTC</h3>
                <p className="text-white/60">Take a loan with collateral based on your credit tier</p>
            </div>

            {/* Credit Info */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/5 text-center">
                    <div className={`tier-badge tier-${profile?.tier || 0} inline-block mb-2`}>
                        Tier {profile?.tier || 0}
                    </div>
                    <div className="text-sm text-white/50">Your Credit Tier</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 text-center">
                    <div className="text-2xl font-bold text-blue-400">{collateralRatio ? collateralRatio / 100 : 150}%</div>
                    <div className="text-sm text-white/50">Collateral Required</div>
                </div>
            </div>

            {/* Available Liquidity */}
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="flex justify-between items-center">
                    <span className="text-white/70">Available to Borrow</span>
                    <span className="text-xl font-bold">{parseFloat(availableLiquidityFormatted || '0').toFixed(2)} CTC</span>
                </div>
            </div>

            {/* Input */}
            <div>
                <label className="block text-sm text-white/60 mb-2">Amount to Borrow</label>
                <div className="relative">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.0"
                        className="input-field pr-16"
                        step="0.01"
                        min="0.001"
                        max="10"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">CTC</span>
                </div>
            </div>

            {/* Collateral Required */}
            {amount && parseFloat(amount) > 0 && (
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-white/70">Required Collateral</span>
                        <span className="text-xl font-bold text-orange-400">
                            {parseFloat(requiredCollateralFormatted || '0').toFixed(4)} CTC
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                        <span className="text-white/50">Interest Rate</span>
                        <span>{interestRate ? interestRate / 100 : 5}%</span>
                    </div>
                </div>
            )}

            {/* Submit Button */}
            <button
                onClick={handleBorrow}
                disabled={isPending || isConfirming || !amount || parseFloat(amount) <= 0}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
                {isPending ? '⏳ Waiting for approval...' :
                    isConfirming ? '🔄 Confirming...' :
                        '📤 Borrow CTC'}
            </button>

            {isSuccess && (
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-center">
                    🎉 Loan successful! Remember to repay on time to build credit.
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-center">
                    ❌ Error: {error.message}
                </div>
            )}
        </div>
    );
}

function RepayTab() {
    const { address } = useAccount();
    const { loan, principalFormatted, collateralFormatted } = useUserLoan(address);
    const { repaymentAmountFormatted } = useRepaymentAmount(address);
    const { repay, isPending, isConfirming, isSuccess, error } = useRepay();

    const handleRepay = () => {
        if (repaymentAmountFormatted) {
            repay(repaymentAmountFormatted);
        }
    };

    if (!loan?.isActive) {
        return (
            <div className="text-center py-8">
                <div className="text-6xl mb-4">✨</div>
                <h3 className="text-2xl font-bold mb-2">No Active Loan</h3>
                <p className="text-white/60">
                    You don&apos;t have any outstanding loans. You&apos;re all caught up!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <div className="text-4xl mb-2">💳</div>
                <h3 className="text-2xl font-bold mb-2">Repay Loan</h3>
                <p className="text-white/60">Pay back your loan to get collateral and build credit</p>
            </div>

            {/* Loan Details */}
            <div className="glass-card p-6 space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-white/70">Principal</span>
                    <span className="text-xl font-bold">{parseFloat(principalFormatted || '0').toFixed(4)} CTC</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-white/70">Collateral Locked</span>
                    <span className="text-lg">{parseFloat(collateralFormatted || '0').toFixed(4)} CTC</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-white/70">Due Block</span>
                    <span>#{Number(loan.dueBlock)}</span>
                </div>
                <hr className="border-white/10" />
                <div className="flex justify-between items-center">
                    <span className="text-white/70 font-bold">Total Repayment</span>
                    <span className="text-2xl font-bold gradient-text">
                        {parseFloat(repaymentAmountFormatted || '0').toFixed(4)} CTC
                    </span>
                </div>
            </div>

            {/* Benefits */}
            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <h4 className="font-bold mb-2 text-green-400">✅ On-Time Benefits</h4>
                <ul className="text-sm text-white/70 space-y-1">
                    <li>• Get your collateral back</li>
                    <li>• Increase repayment streak</li>
                    <li>• Progress toward next tier</li>
                    <li>• Heal weakened pet</li>
                </ul>
            </div>

            {/* Submit Button */}
            <button
                onClick={handleRepay}
                disabled={isPending || isConfirming}
                className="btn-primary w-full py-4 text-lg disabled:opacity-50"
            >
                {isPending ? '⏳ Waiting for approval...' :
                    isConfirming ? '🔄 Confirming...' :
                        '💳 Repay Now'}
            </button>

            {isSuccess && (
                <div className="p-4 rounded-xl bg-green-500/20 border border-green-500/30 text-center">
                    🎉 Loan repaid! Your collateral has been returned and credit updated.
                </div>
            )}

            {error && (
                <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30 text-center">
                    ❌ Error: {error.message}
                </div>
            )}
        </div>
    );
}

export default function LendPage() {
    const { isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<Tab>('supply');

    if (!isConnected) {
        return (
            <main className="bg-animated min-h-screen">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center px-6">
                    <div className="glass-card p-12 text-center max-w-md">
                        <div className="text-6xl mb-6">🔐</div>
                        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
                        <p className="text-white/60 mb-8">
                            Connect your wallet to supply, borrow, and repay.
                        </p>
                        <ConnectButton />
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="bg-animated min-h-screen">
            <Navbar />

            <div className="pt-28 pb-12 px-6">
                <div className="max-w-xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="gradient-text">Lending Pool</span>
                        </h1>
                        <p className="text-white/60 text-lg">
                            Supply, borrow, and repay with credit-based terms
                        </p>
                    </div>

                    {/* Tab Buttons */}
                    <div className="glass-card p-2 flex gap-2 mb-6">
                        {(['supply', 'borrow', 'repay'] as Tab[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-3 px-4 rounded-xl font-medium transition-all capitalize ${activeTab === tab
                                        ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white'
                                        : 'text-white/60 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab === 'supply' && '💰 '}
                                {tab === 'borrow' && '📤 '}
                                {tab === 'repay' && '💳 '}
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="glass-card p-8">
                        {activeTab === 'supply' && <SupplyTab />}
                        {activeTab === 'borrow' && <BorrowTab />}
                        {activeTab === 'repay' && <RepayTab />}
                    </div>
                </div>
            </div>
        </main>
    );
}

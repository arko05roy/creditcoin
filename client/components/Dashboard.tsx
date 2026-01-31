'use client';

import { useAccount } from 'wagmi';
import { useUserPet, useMintPet } from '@/lib/hooks/useCrediPet';
import { useCreditProfile, useCreditTier } from '@/lib/hooks/useCreditScore';
import { useUserDeposits, useUserLoan, usePoolStats } from '@/lib/hooks/useLendingPool';
import { useTotalXP, useQuestStatus } from '@/lib/hooks/useQuestBoard';
import { PET_STAGES, CREDIT_TIERS } from '@/lib/contracts';

const PET_EMOJIS = ['🥚', '🐣', '🐤', '🦅', '🐉'];

export function PetCard() {
    const { address } = useAccount();
    const { pet, stageName, isLoading, tokenId } = useUserPet(address);
    const { mint, isPending, isConfirming, isSuccess } = useMintPet();

    if (isLoading) {
        return (
            <div className="glass-card p-8 flex flex-col items-center">
                <div className="skeleton w-32 h-32 rounded-full mb-6" />
                <div className="skeleton w-24 h-6 mb-2" />
                <div className="skeleton w-32 h-4" />
            </div>
        );
    }

    if (!pet || !tokenId) {
        return (
            <div className="glass-card p-8 flex flex-col items-center text-center">
                <div className="text-8xl mb-6 opacity-50 animate-bounce-gentle">🥚</div>
                <h3 className="text-2xl font-bold mb-2">No Pet Yet!</h3>
                <p className="text-white/60 mb-6 max-w-sm">
                    Mint your very own CrediPet to start your credit journey.
                    It&apos;s free and soulbound to your wallet!
                </p>
                <button
                    onClick={() => mint()}
                    disabled={isPending || isConfirming}
                    className="btn-primary"
                >
                    {isPending ? '⏳ Waiting...' : isConfirming ? '🔄 Confirming...' : '🥚 Mint Pet'}
                </button>
                {isSuccess && (
                    <p className="text-green-400 mt-4">🎉 Pet minted! Refresh to see it.</p>
                )}
            </div>
        );
    }

    return (
        <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Glow based on stage */}
            <div className={`absolute inset-0 bg-gradient-to-br opacity-10 ${pet.stage === 0 ? 'from-yellow-500 to-orange-500' :
                    pet.stage === 1 ? 'from-green-500 to-emerald-500' :
                        pet.stage === 2 ? 'from-blue-500 to-cyan-500' :
                            pet.stage === 3 ? 'from-purple-500 to-violet-500' :
                                'from-pink-500 to-rose-500'
                }`} />

            <div className="relative z-10">
                {/* Pet Display */}
                <div className={`text-9xl mb-4 animate-float ${pet.isWeakened ? 'grayscale opacity-70' : ''}`}>
                    {PET_EMOJIS[pet.stage]}
                </div>

                {/* Health Status */}
                {pet.isWeakened && (
                    <div className="health-weakened text-sm mb-4 flex items-center gap-2">
                        <span>💔</span> Weakened - Repay to heal!
                    </div>
                )}

                {/* Stage Name */}
                <h3 className="text-2xl font-bold mb-2">{stageName}</h3>

                {/* Token ID */}
                <p className="text-white/50 text-sm mb-4">Token #{Number(tokenId)}</p>

                {/* Stage Badge */}
                <div className={`tier-badge tier-${pet.stage} inline-block`}>
                    Stage {pet.stage} / 4
                </div>

                {/* Minted Time */}
                <p className="text-white/40 text-sm mt-4">
                    Minted {new Date(Number(pet.mintedAt) * 1000).toLocaleDateString()}
                </p>
            </div>
        </div>
    );
}

export function CreditStats() {
    const { address } = useAccount();
    const { profile, tierName, collateralRatio, interestRate, isLoading } = useCreditProfile(address);

    if (isLoading || !profile) {
        return (
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Credit Stats</h3>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="skeleton h-12 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    const stats = [
        {
            label: 'Credit Tier',
            value: tierName || 'Newcomer',
            icon: '🏆',
            subtext: `${Number(profile.totalRepayments)} repayments`
        },
        {
            label: 'Collateral Ratio',
            value: collateralRatio ? `${collateralRatio / 100}%` : '150%',
            icon: '🔒',
            subtext: 'Required for loans'
        },
        {
            label: 'Interest Rate',
            value: interestRate ? `${interestRate / 100}%` : '5%',
            icon: '📊',
            subtext: 'Per loan period'
        },
        {
            label: 'Current Streak',
            value: Number(profile.consecutiveRepays),
            icon: '🔥',
            subtext: 'Consecutive repays'
        },
    ];

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold">Credit Stats</h3>
                <div className={`tier-badge tier-${profile.tier}`}>
                    Tier {profile.tier}
                </div>
            </div>

            <div className="space-y-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="text-2xl">{stat.icon}</div>
                            <div>
                                <div className="font-medium">{stat.label}</div>
                                <div className="text-sm text-white/50">{stat.subtext}</div>
                            </div>
                        </div>
                        <div className="text-xl font-bold gradient-text">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Progress to Next Tier */}
            {profile.tier < 4 && (
                <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-white/60">Progress to Tier {profile.tier + 1}</span>
                        <span className="text-white/80">
                            {Number(profile.totalRepayments)} / {[1, 3, 7, 15][profile.tier]} repays
                        </span>
                    </div>
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{
                                width: `${Math.min(100, (Number(profile.totalRepayments) / [1, 3, 7, 15][profile.tier]) * 100)}%`
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export function PoolOverview() {
    const {
        totalDepositsFormatted,
        totalBorrowedFormatted,
        availableLiquidityFormatted,
        isLoading
    } = usePoolStats();

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Pool Overview</h3>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="skeleton h-20 w-full" />
                    ))}
                </div>
            </div>
        );
    }

    const poolStats = [
        { label: 'Total Deposits', value: totalDepositsFormatted || '0', icon: '💰' },
        { label: 'Total Borrowed', value: totalBorrowedFormatted || '0', icon: '📤' },
        { label: 'Available', value: availableLiquidityFormatted || '0', icon: '✨' },
    ];

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Pool Overview</h3>
            <div className="grid grid-cols-3 gap-4">
                {poolStats.map((stat) => (
                    <div key={stat.label} className="stat-card">
                        <div className="text-2xl mb-2">{stat.icon}</div>
                        <div className="stat-value text-lg">{parseFloat(stat.value).toFixed(2)}</div>
                        <div className="stat-label">{stat.label}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function UserPositions() {
    const { address } = useAccount();
    const { depositsFormatted, isLoading: depositsLoading } = useUserDeposits(address);
    const { loan, principalFormatted, collateralFormatted, isLoading: loanLoading } = useUserLoan(address);

    const isLoading = depositsLoading || loanLoading;

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <h3 className="text-xl font-bold mb-4">Your Positions</h3>
                <div className="skeleton h-32 w-full" />
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <h3 className="text-xl font-bold mb-4">Your Positions</h3>

            <div className="grid grid-cols-2 gap-4">
                {/* Deposits */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💰</span>
                        <span className="text-white/70">Supplied</span>
                    </div>
                    <div className="text-2xl font-bold">{parseFloat(depositsFormatted || '0').toFixed(4)} CTC</div>
                </div>

                {/* Active Loan */}
                <div className={`p-4 rounded-xl ${loan?.isActive
                    ? 'bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20'
                    : 'bg-white/5 border border-white/10'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{loan?.isActive ? '📋' : '✨'}</span>
                        <span className="text-white/70">{loan?.isActive ? 'Active Loan' : 'No Loan'}</span>
                    </div>
                    {loan?.isActive ? (
                        <div className="text-2xl font-bold">{parseFloat(principalFormatted || '0').toFixed(4)} CTC</div>
                    ) : (
                        <div className="text-lg text-white/50">Ready to borrow</div>
                    )}
                </div>
            </div>

            {loan?.isActive && (
                <div className="mt-4 p-4 rounded-xl bg-white/5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-white/50">Collateral: </span>
                            <span className="font-medium">{parseFloat(collateralFormatted || '0').toFixed(4)} CTC</span>
                        </div>
                        <div>
                            <span className="text-white/50">Due Block: </span>
                            <span className="font-medium">#{Number(loan.dueBlock)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export function XPProgress() {
    const { address } = useAccount();
    const { totalXPNumber, isLoading: xpLoading } = useTotalXP(address);
    const { questsWithStatus, isLoading: questsLoading } = useQuestStatus(address);

    const isLoading = xpLoading || questsLoading;
    const completedQuests = questsWithStatus?.filter(q => q.completed).length || 0;
    const maxXP = 2000; // Total possible XP

    if (isLoading) {
        return (
            <div className="glass-card p-6">
                <div className="skeleton h-24 w-full" />
            </div>
        );
    }

    return (
        <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold">Quest Progress</h3>
                <span className="text-white/60">{completedQuests} / 8 Quests</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="text-4xl">⭐</div>
                <div className="flex-1">
                    <div className="text-3xl font-bold gradient-text">{totalXPNumber || 0} XP</div>
                    <div className="text-sm text-white/50">Total earned</div>
                </div>
            </div>

            {/* XP Progress Bar */}
            <div className="xp-bar">
                <div
                    className="xp-fill"
                    style={{ width: `${Math.min(100, ((totalXPNumber || 0) / maxXP) * 100)}%` }}
                />
            </div>
            <div className="flex justify-between text-sm text-white/50 mt-2">
                <span>0 XP</span>
                <span>{maxXP} XP</span>
            </div>
        </div>
    );
}

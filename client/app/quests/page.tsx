'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/Navbar';
import {
    useQuestStatus,
    useCanClaimQuest,
    useTotalXP,
    useClaimQuest
} from '@/lib/hooks/useQuestBoard';
import { QUESTS } from '@/lib/contracts';

const QUEST_ICONS = ['🥚', '💰', '📤', '✅', '🎁', '🔥', '🚀', '👑'];

function QuestCard({
    quest,
    index,
    isCompleted,
    canClaim,
    onClaim,
    isClaiming
}: {
    quest: typeof QUESTS[number];
    index: number;
    isCompleted: boolean;
    canClaim: boolean;
    onClaim: () => void;
    isClaiming: boolean;
}) {
    return (
        <div
            className={`quest-card ${isCompleted ? 'completed' : ''} ${canClaim && !isCompleted ? 'claimable' : ''}`}
        >
            {/* Completion Badge */}
            {isCompleted && (
                <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                    ✓
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isCompleted ? 'bg-green-500/20' : canClaim ? 'bg-purple-500/20 animate-pulse' : 'bg-white/5'
                    }`}>
                    {QUEST_ICONS[index]}
                </div>

                {/* Content */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold">{quest.name}</h3>
                        <span className="text-sm text-purple-400 font-medium">+{quest.xp} XP</span>
                    </div>
                    <p className="text-white/60 text-sm mb-3">{quest.description}</p>

                    {/* Status / Action */}
                    {isCompleted ? (
                        <div className="inline-flex items-center gap-2 text-green-400 text-sm">
                            <span>✅</span> Completed
                        </div>
                    ) : canClaim ? (
                        <button
                            onClick={onClaim}
                            disabled={isClaiming}
                            className="btn-primary py-2 px-4 text-sm"
                        >
                            {isClaiming ? '⏳ Claiming...' : '🎁 Claim Reward'}
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-2 text-white/40 text-sm">
                            <span>🔒</span> Not yet completed
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function QuestList() {
    const { address } = useAccount();
    const { questsWithStatus, isLoading: statusLoading } = useQuestStatus(address);
    const { totalXPNumber } = useTotalXP(address);
    const { claimQuest, isPending, isConfirming } = useClaimQuest();

    // Individual canClaim hooks for each quest
    const q0 = useCanClaimQuest(address, 0);
    const q1 = useCanClaimQuest(address, 1);
    const q2 = useCanClaimQuest(address, 2);
    const q3 = useCanClaimQuest(address, 3);
    const q4 = useCanClaimQuest(address, 4);
    const q5 = useCanClaimQuest(address, 5);
    const q6 = useCanClaimQuest(address, 6);
    const q7 = useCanClaimQuest(address, 7);

    const canClaimResults = [q0, q1, q2, q3, q4, q5, q6, q7];
    const completedCount = questsWithStatus?.filter(q => q.completed).length || 0;
    const maxXP = 2000;

    if (statusLoading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="skeleton h-32 w-full rounded-2xl" />
                ))}
            </div>
        );
    }

    return (
        <div>
            {/* XP Header */}
            <div className="glass-card p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl">⭐</div>
                        <div>
                            <div className="text-4xl font-bold gradient-text">{totalXPNumber || 0} XP</div>
                            <div className="text-white/50">Total Experience Points</div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{completedCount} / 8</div>
                        <div className="text-white/50">Quests Completed</div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="xp-bar h-4">
                    <div
                        className="xp-fill"
                        style={{ width: `${((totalXPNumber || 0) / maxXP) * 100}%` }}
                    />
                </div>
                <div className="flex justify-between text-sm text-white/40 mt-2">
                    <span>Newcomer</span>
                    <span>Legend ({maxXP} XP)</span>
                </div>
            </div>

            {/* Quest Categories */}
            <div className="space-y-8">
                {/* Beginner Quests */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-2xl">🌱</span> Getting Started
                    </h2>
                    <div className="space-y-4">
                        {QUESTS.slice(0, 4).map((quest, index) => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                index={index}
                                isCompleted={questsWithStatus?.[index]?.completed || false}
                                canClaim={canClaimResults[index]?.canClaim || false}
                                onClaim={() => claimQuest(index)}
                                isClaiming={isPending || isConfirming}
                            />
                        ))}
                    </div>
                </div>

                {/* Advanced Quests */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-2xl">⚡</span> Level Up
                    </h2>
                    <div className="space-y-4">
                        {QUESTS.slice(4, 6).map((quest, index) => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                index={index + 4}
                                isCompleted={questsWithStatus?.[index + 4]?.completed || false}
                                canClaim={canClaimResults[index + 4]?.canClaim || false}
                                onClaim={() => claimQuest(index + 4)}
                                isClaiming={isPending || isConfirming}
                            />
                        ))}
                    </div>
                </div>

                {/* Elite Quests */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span className="text-2xl">👑</span> Elite Challenges
                    </h2>
                    <div className="space-y-4">
                        {QUESTS.slice(6, 8).map((quest, index) => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                index={index + 6}
                                isCompleted={questsWithStatus?.[index + 6]?.completed || false}
                                canClaim={canClaimResults[index + 6]?.canClaim || false}
                                onClaim={() => claimQuest(index + 6)}
                                isClaiming={isPending || isConfirming}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Max XP Celebration */}
            {totalXPNumber === maxXP && (
                <div className="glass-card p-8 mt-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20" />
                    <div className="relative z-10">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold gradient-text mb-2">Legendary Status!</h2>
                        <p className="text-white/70">
                            You&apos;ve completed all quests and earned maximum XP. You are a true credit legend!
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function QuestsPage() {
    const { isConnected } = useAccount();

    if (!isConnected) {
        return (
            <main className="bg-animated min-h-screen">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center px-6">
                    <div className="glass-card p-12 text-center max-w-md">
                        <div className="text-6xl mb-6">🏆</div>
                        <h2 className="text-3xl font-bold mb-4">Connect to View Quests</h2>
                        <p className="text-white/60 mb-8">
                            Connect your wallet to see your quest progress and claim rewards.
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
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="gradient-text">Quest Board</span> 🗺️
                        </h1>
                        <p className="text-white/60 text-lg">
                            Complete quests to earn XP and prove your creditworthiness
                        </p>
                    </div>

                    {/* Quest List */}
                    <QuestList />
                </div>
            </div>
        </main>
    );
}

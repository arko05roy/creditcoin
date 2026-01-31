'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Navbar } from '@/components/Navbar';
import {
    PetCard,
    CreditStats,
    PoolOverview,
    UserPositions,
    XPProgress
} from '@/components/Dashboard';
import Link from 'next/link';

export default function DashboardPage() {
    const { isConnected } = useAccount();

    if (!isConnected) {
        return (
            <main className="bg-animated min-h-screen">
                <Navbar />
                <div className="min-h-screen flex items-center justify-center px-6">
                    <div className="glass-card p-12 text-center max-w-md">
                        <div className="text-6xl mb-6">🔐</div>
                        <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
                        <p className="text-white/60 mb-8">
                            Connect your wallet to access your CrediPet dashboard and start building credit.
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
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold mb-2">
                            Welcome back, <span className="gradient-text">Pet Owner!</span> 🎮
                        </h1>
                        <p className="text-white/60 text-lg">
                            Manage your pet, track your credit, and complete quests.
                        </p>
                    </div>

                    {/* Main Grid */}
                    <div className="grid lg:grid-cols-3 gap-6">
                        {/* Left Column - Pet */}
                        <div className="lg:col-span-1 space-y-6">
                            <PetCard />
                            <XPProgress />
                        </div>

                        {/* Right Column - Stats & Actions */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Quick Actions */}
                            <div className="grid sm:grid-cols-3 gap-4">
                                <Link href="/lend" className="glass-card p-6 hover:border-green-500/30 transition-colors group">
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">💰</div>
                                    <h3 className="font-bold mb-1">Supply CTC</h3>
                                    <p className="text-sm text-white/50">Earn interest on deposits</p>
                                </Link>
                                <Link href="/lend" className="glass-card p-6 hover:border-blue-500/30 transition-colors group">
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📤</div>
                                    <h3 className="font-bold mb-1">Borrow CTC</h3>
                                    <p className="text-sm text-white/50">Get a loan with collateral</p>
                                </Link>
                                <Link href="/quests" className="glass-card p-6 hover:border-purple-500/30 transition-colors group">
                                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🏆</div>
                                    <h3 className="font-bold mb-1">Quests</h3>
                                    <p className="text-sm text-white/50">Earn XP and rewards</p>
                                </Link>
                            </div>

                            {/* Credit Stats */}
                            <CreditStats />

                            {/* User Positions */}
                            <UserPositions />

                            {/* Pool Overview */}
                            <PoolOverview />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

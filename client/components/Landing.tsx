'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

const FEATURES = [
    {
        icon: '🥚',
        title: 'Mint Your Pet',
        description: 'Get your unique soulbound CrediPet that evolves with your credit journey',
        color: 'from-yellow-400 to-orange-500',
    },
    {
        icon: '📈',
        title: 'Build Credit',
        description: 'Borrow, repay on time, and watch your credit tier grow from 0 to Legend',
        color: 'from-green-400 to-emerald-500',
    },
    {
        icon: '💰',
        title: 'Better Rates',
        description: 'Higher tiers unlock lower collateral (60%!) and interest rates (1%!)',
        color: 'from-blue-400 to-cyan-500',
    },
    {
        icon: '🏆',
        title: 'Complete Quests',
        description: 'Earn XP by completing quests and proving your creditworthiness',
        color: 'from-purple-400 to-pink-500',
    },
];

const PET_STAGES = [
    { name: 'Egg', emoji: '🥚', tier: 0, color: 'bg-yellow-500' },
    { name: 'Hatchling', emoji: '🐣', tier: 1, color: 'bg-green-500' },
    { name: 'Juvenile', emoji: '🐤', tier: 2, color: 'bg-blue-500' },
    { name: 'Adult', emoji: '🦅', tier: 3, color: 'bg-purple-500' },
    { name: 'Legendary', emoji: '🐉', tier: 4, color: 'bg-pink-500' },
];

const STATS = [
    { label: 'Total Pets Minted', value: '2,847' },
    { label: 'Loans Repaid', value: '12,453' },
    { label: 'Total XP Earned', value: '1.2M' },
    { label: 'Pool Liquidity', value: '45K CTC' },
];

export function HeroSection() {
    const { isConnected } = useAccount();

    return (
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-12 relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-2s' }} />
                <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-4s' }} />
            </div>

            {/* Hero Content */}
            <div className="relative z-10 text-center max-w-4xl mx-auto">
                {/* Pet Animation */}
                <div className="mb-8 relative">
                    <div className="text-9xl animate-bounce-gentle inline-block">🥚</div>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-4 bg-black/30 rounded-full blur-md" />
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
                    <span className="gradient-text">Build Credit.</span>
                    <br />
                    <span className="text-white">Evolve Your Pet.</span>
                </h1>

                {/* Subheadline */}
                <p className="text-xl md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                    The first gamified credit protocol on Creditcoin.
                    <span className="text-white"> Mint a pet, borrow wisely, repay on time</span>, and unlock
                    legendary lending terms.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                    {isConnected ? (
                        <Link href="/dashboard" className="btn-primary text-lg px-10 py-4">
                            Go to Dashboard 🚀
                        </Link>
                    ) : (
                        <ConnectButton.Custom>
                            {({ openConnectModal }) => (
                                <button onClick={openConnectModal} className="btn-primary text-lg px-10 py-4">
                                    Connect Wallet 🎮
                                </button>
                            )}
                        </ConnectButton.Custom>
                    )}
                    <Link href="#features" className="btn-secondary text-lg px-10 py-4">
                        Learn More ↓
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
                    {STATS.map((stat) => (
                        <div key={stat.label} className="glass-card p-4">
                            <div className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</div>
                            <div className="text-sm text-white/60">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                    <span className="gradient-text">How It Works</span>
                </h2>
                <p className="text-xl text-white/60 text-center mb-16 max-w-2xl mx-auto">
                    A simple journey from newcomer to legendary borrower
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {FEATURES.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="glass-card p-8 group cursor-pointer"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform`}>
                                {feature.icon}
                            </div>
                            <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                            <p className="text-white/70 text-lg leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export function EvolutionSection() {
    return (
        <section className="py-24 px-6 relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" />

            <div className="max-w-6xl mx-auto relative z-10">
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-4">
                    <span className="gradient-text">Pet Evolution</span>
                </h2>
                <p className="text-xl text-white/60 text-center mb-16 max-w-2xl mx-auto">
                    Your pet evolves as your credit tier increases. Can you reach Legendary?
                </p>

                {/* Evolution Timeline */}
                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute top-1/2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-blue-500 to-pink-500 transform -translate-y-1/2 hidden md:block" />

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                        {PET_STAGES.map((stage, index) => (
                            <div key={stage.name} className="flex flex-col items-center group">
                                <div className={`relative glass-card p-6 w-full flex flex-col items-center ${index === 4 ? 'animate-pulse-glow' : ''}`}>
                                    {/* Stage Number */}
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 ${stage.color} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                                        Tier {stage.tier}
                                    </div>

                                    {/* Pet Emoji */}
                                    <div className="text-5xl md:text-6xl mb-4 group-hover:scale-125 transition-transform duration-300">
                                        {stage.emoji}
                                    </div>

                                    {/* Stage Name */}
                                    <div className="text-lg font-semibold">{stage.name}</div>

                                    {/* Requirements */}
                                    <div className="text-sm text-white/50 mt-2">
                                        {stage.tier === 0 && 'Start here'}
                                        {stage.tier === 1 && '1 repayment'}
                                        {stage.tier === 2 && '3 repayments'}
                                        {stage.tier === 3 && '7 repayments'}
                                        {stage.tier === 4 && '15 repayments'}
                                    </div>
                                </div>

                                {/* Arrow for mobile */}
                                {index < 4 && (
                                    <div className="md:hidden text-2xl text-white/30 my-2">↓</div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tier Benefits */}
                <div className="mt-16 glass-card p-8">
                    <h3 className="text-2xl font-bold mb-6 text-center">Tier Benefits</h3>
                    <div className="grid md:grid-cols-5 gap-4 text-center">
                        {[
                            { tier: 0, collateral: '150%', interest: '5%' },
                            { tier: 1, collateral: '130%', interest: '4%' },
                            { tier: 2, collateral: '110%', interest: '3%' },
                            { tier: 3, collateral: '85%', interest: '2%' },
                            { tier: 4, collateral: '60%', interest: '1%' },
                        ].map((tier) => (
                            <div key={tier.tier} className="p-4 rounded-xl bg-white/5">
                                <div className={`tier-badge tier-${tier.tier} inline-block mb-3`}>
                                    Tier {tier.tier}
                                </div>
                                <div className="text-2xl font-bold text-green-400 mb-1">{tier.collateral}</div>
                                <div className="text-sm text-white/50">collateral</div>
                                <div className="text-xl font-bold text-blue-400 mt-2">{tier.interest}</div>
                                <div className="text-sm text-white/50">interest</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function CTASection() {
    const { isConnected } = useAccount();

    return (
        <section className="py-24 px-6">
            <div className="max-w-4xl mx-auto text-center">
                <div className="glass-card p-12 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />

                    <div className="relative z-10">
                        <div className="text-6xl mb-6">🎮</div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            Ready to <span className="gradient-text">Start Your Journey?</span>
                        </h2>
                        <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                            Connect your wallet, mint your pet, and begin building credit on Creditcoin.
                            Your legendary status awaits!
                        </p>

                        {isConnected ? (
                            <Link href="/dashboard" className="btn-primary text-xl px-12 py-5 inline-block">
                                Enter Dashboard 🚀
                            </Link>
                        ) : (
                            <ConnectButton.Custom>
                                {({ openConnectModal }) => (
                                    <button onClick={openConnectModal} className="btn-primary text-xl px-12 py-5">
                                        Connect & Play 🎮
                                    </button>
                                )}
                            </ConnectButton.Custom>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

export function Footer() {
    return (
        <footer className="py-12 px-6 border-t border-white/10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-2xl">
                            🥚
                        </div>
                        <span className="text-xl font-bold gradient-text">CrediPet</span>
                    </div>

                    <div className="flex items-center gap-6 text-white/50">
                        <a href="https://creditcoin.org" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            Creditcoin
                        </a>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            GitHub
                        </a>
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                            Twitter
                        </a>
                    </div>

                    <div className="text-white/40 text-sm">
                        Built with 💜 on Creditcoin
                    </div>
                </div>
            </div>
        </footer>
    );
}

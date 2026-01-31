'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getPetImage, getPetEmoji, getPetColor, PET_STAGES } from '@/lib/contracts';

interface PetSpriteProps {
    stage: number;
    isWeakened?: boolean;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    showGlow?: boolean;
    animate?: boolean;
    className?: string;
}

const SIZES = {
    sm: { container: 64, image: 48 },
    md: { container: 96, image: 72 },
    lg: { container: 128, image: 96 },
    xl: { container: 192, image: 144 },
};

export function PetSprite({
    stage,
    isWeakened = false,
    size = 'lg',
    showGlow = true,
    animate = true,
    className = '',
}: PetSpriteProps) {
    const [imageError, setImageError] = useState(false);
    const { container, image } = SIZES[size];
    const colors = getPetColor(stage);
    const imagePath = getPetImage(stage, isWeakened);
    const emoji = getPetEmoji(stage);

    return (
        <div
            className={`relative flex items-center justify-center ${animate ? 'animate-float' : ''} ${className}`}
            style={{
                width: container,
                height: container,
            }}
        >
            {/* Glow effect */}
            {showGlow && !isWeakened && (
                <div
                    className="absolute inset-0 rounded-full blur-xl opacity-40"
                    style={{
                        background: `radial-gradient(circle, ${colors.primary}80, transparent 70%)`
                    }}
                />
            )}

            {/* Pet image or emoji fallback */}
            <div
                className={`relative z-10 rounded-full flex items-center justify-center ${isWeakened ? 'grayscale opacity-70' : ''}`}
                style={{
                    width: image,
                    height: image,
                    background: imageError ? `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)` : 'transparent',
                }}
            >
                {!imageError ? (
                    <Image
                        src={imagePath}
                        alt={`${PET_STAGES[stage]} Pet${isWeakened ? ' (Weakened)' : ''}`}
                        width={image}
                        height={image}
                        className="object-contain drop-shadow-lg"
                        onError={() => setImageError(true)}
                        priority={stage === 0}
                    />
                ) : (
                    <span
                        className="select-none"
                        style={{ fontSize: image * 0.7 }}
                    >
                        {emoji}
                    </span>
                )}
            </div>

            {/* Shadow */}
            <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 bg-black/30 rounded-full blur-md"
                style={{ width: image * 0.6, height: image * 0.15 }}
            />
        </div>
    );
}

interface PetCardDisplayProps {
    stage: number;
    isWeakened?: boolean;
    tokenId?: bigint;
    mintedAt?: bigint;
    showDetails?: boolean;
}

export function PetCardDisplay({
    stage,
    isWeakened = false,
    tokenId,
    mintedAt,
    showDetails = true,
}: PetCardDisplayProps) {
    const colors = getPetColor(stage);
    const stageName = PET_STAGES[stage];

    return (
        <div className="glass-card p-8 flex flex-col items-center text-center relative overflow-hidden">
            {/* Background Gradient */}
            <div
                className="absolute inset-0 opacity-10"
                style={{
                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.secondary})`
                }}
            />

            <div className="relative z-10">
                {/* Pet Sprite */}
                <PetSprite
                    stage={stage}
                    isWeakened={isWeakened}
                    size="xl"
                    showGlow={!isWeakened}
                />

                {/* Health Status */}
                {isWeakened && (
                    <div className="health-weakened text-sm mt-2 flex items-center justify-center gap-2">
                        <span>💔</span> Weakened - Repay to heal!
                    </div>
                )}

                {showDetails && (
                    <>
                        {/* Stage Name */}
                        <h3 className="text-2xl font-bold mt-4 mb-2">{stageName}</h3>

                        {/* Token ID */}
                        {tokenId !== undefined && (
                            <p className="text-white/50 text-sm mb-4">Token #{Number(tokenId)}</p>
                        )}

                        {/* Stage Badge */}
                        <div className={`tier-badge tier-${stage} inline-block`}>
                            Stage {stage} / 4
                        </div>

                        {/* Minted Time */}
                        {mintedAt !== undefined && (
                            <p className="text-white/40 text-sm mt-4">
                                Minted {new Date(Number(mintedAt) * 1000).toLocaleDateString()}
                            </p>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

// Evolution Preview Component
export function EvolutionPreview() {
    return (
        <div className="flex items-center justify-center gap-4 flex-wrap">
            {[0, 1, 2, 3, 4].map((stage) => (
                <div key={stage} className="flex flex-col items-center">
                    <PetSprite
                        stage={stage}
                        size="md"
                        animate={false}
                        showGlow={stage === 4}
                    />
                    <span className="text-sm text-white/60 mt-2">{PET_STAGES[stage]}</span>
                </div>
            ))}
        </div>
    );
}

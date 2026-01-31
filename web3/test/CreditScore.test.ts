import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CreditScore", function () {
    let creditScore: any;
    let crediPet: any;
    let owner: any;
    let lendingPool: any;
    let user1: any;
    let user2: any;

    beforeEach(async function () {
        [owner, lendingPool, user1, user2] = await ethers.getSigners();

        // Deploy CrediPet first
        crediPet = await ethers.deployContract("CrediPet", ["https://credipet.xyz/metadata/"]);
        await crediPet.waitForDeployment();

        // Deploy CreditScore
        creditScore = await ethers.deployContract("CreditScore", [await crediPet.getAddress()]);
        await creditScore.waitForDeployment();

        // Link contracts
        await crediPet.setCreditScoreContract(await creditScore.getAddress());
        await creditScore.setLendingPool(lendingPool.address);

        // Mint pets for test users
        await crediPet.connect(user1).mint();
        await crediPet.connect(user2).mint();
    });

    describe("Deployment", function () {
        it("Should set correct CrediPet address", async function () {
            expect(await creditScore.crediPet()).to.equal(await crediPet.getAddress());
        });

        it("Should initialize with correct tier thresholds", async function () {
            const thresholds = await creditScore.getTierThresholds();
            expect(thresholds[0]).to.equal(0);
            expect(thresholds[1]).to.equal(1);
            expect(thresholds[2]).to.equal(3);
            expect(thresholds[3]).to.equal(7);
            expect(thresholds[4]).to.equal(15);
        });

        it("Should initialize with correct collateral ratios", async function () {
            expect(await creditScore.collateralRatios(0)).to.equal(15000); // 150%
            expect(await creditScore.collateralRatios(1)).to.equal(13000); // 130%
            expect(await creditScore.collateralRatios(2)).to.equal(11000); // 110%
            expect(await creditScore.collateralRatios(3)).to.equal(8500);  // 85%
            expect(await creditScore.collateralRatios(4)).to.equal(6000);  // 60%
        });

        it("Should initialize with correct interest rates", async function () {
            expect(await creditScore.interestRates(0)).to.equal(500); // 5%
            expect(await creditScore.interestRates(1)).to.equal(400); // 4%
            expect(await creditScore.interestRates(2)).to.equal(300); // 3%
            expect(await creditScore.interestRates(3)).to.equal(200); // 2%
            expect(await creditScore.interestRates(4)).to.equal(100); // 1%
        });
    });

    describe("Repayment Recording", function () {
        it("Should record repayment and increment counters", async function () {
            await creditScore.connect(lendingPool).recordLoanTaken(user1.address);
            await creditScore.connect(lendingPool).recordRepayment(user1.address);

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalRepaidOnTime).to.equal(1);
            expect(profile.currentStreak).to.equal(1);
        });

        it("Should emit RepaymentRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordRepayment(user1.address)
            ).to.emit(creditScore, "RepaymentRecorded")
                .withArgs(user1.address, 1);
        });

        it("Should upgrade tier after 1 repayment", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentTier).to.equal(1);
        });

        it("Should evolve pet on tier upgrade", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);

            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1);
        });

        it("Should heal weakened pet on repayment", async function () {
            // Cause default first
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            let pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;

            // Repay
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should revert if called by non-lending-pool", async function () {
            await expect(
                creditScore.connect(user1).recordRepayment(user1.address)
            ).to.be.revertedWith("CreditScore: caller is not LendingPool");
        });
    });

    describe("Default Recording", function () {
        it("Should record default and reset streak", async function () {
            // Build up streak first
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            let profile = await creditScore.getProfile(user1.address);
            expect(profile.currentStreak).to.equal(2);

            // Default
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            profile = await creditScore.getProfile(user1.address);
            expect(profile.totalDefaulted).to.equal(1);
            expect(profile.currentStreak).to.equal(0);
        });

        it("Should emit DefaultRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordDefault(user1.address)
            ).to.emit(creditScore, "DefaultRecorded")
                .withArgs(user1.address, 1);
        });

        it("Should weaken pet on default", async function () {
            await creditScore.connect(lendingPool).recordDefault(user1.address);

            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;
        });

        it("Should handle multiple defaults", async function () {
            await creditScore.connect(lendingPool).recordDefault(user1.address);
            await creditScore.connect(lendingPool).recordDefault(user1.address);

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalDefaulted).to.equal(2);
        });
    });

    describe("Tier Progression", function () {
        it("Should upgrade to Hatchling (Tier 1) after 1 repayment", async function () {
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getCreditTier(user1.address)).to.equal(1);
        });

        it("Should upgrade to Juvenile (Tier 2) after 3 repayments", async function () {
            for (let i = 0; i < 3; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(2);
        });

        it("Should upgrade to Adult (Tier 3) after 7 repayments", async function () {
            for (let i = 0; i < 7; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(3);
        });

        it("Should upgrade to Legendary (Tier 4) after 15 repayments with zero defaults", async function () {
            for (let i = 0; i < 15; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCreditTier(user1.address)).to.equal(4);
        });

        it("Should NOT upgrade to Legendary if any defaults exist", async function () {
            // Do 14 repayments
            for (let i = 0; i < 14; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }

            // Default once
            await creditScore.connect(lendingPool).recordDefault(user1.address);

            // Do more repayments
            for (let i = 0; i < 5; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }

            // Should be stuck at Tier 3
            expect(await creditScore.getCreditTier(user1.address)).to.equal(3);
        });

        it("Should emit CreditTierUpgraded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordRepayment(user1.address)
            ).to.emit(creditScore, "CreditTierUpgraded")
                .withArgs(user1.address, 0, 1);
        });

        it("Should not skip tiers even with modified thresholds", async function () {
            // Tier upgrades are incremental (one at a time per repayment)
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentTier).to.equal(1);
        });
    });

    describe("Collateral Ratios", function () {
        it("Should return correct collateral ratio for each tier", async function () {
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(15000); // Tier 0

            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(13000); // Tier 1

            for (let i = 0; i < 2; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            expect(await creditScore.getCollateralRatio(user1.address)).to.equal(11000); // Tier 2
        });
    });

    describe("Interest Rates", function () {
        it("Should return correct interest rate for each tier", async function () {
            expect(await creditScore.getInterestRate(user1.address)).to.equal(500); // Tier 0

            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            expect(await creditScore.getInterestRate(user1.address)).to.equal(400); // Tier 1
        });
    });

    describe("Loan Recording", function () {
        it("Should record loan taken", async function () {
            await creditScore.connect(lendingPool).recordLoanTaken(user1.address);

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalLoans).to.equal(1);
        });

        it("Should emit LoanRecorded event", async function () {
            await expect(
                creditScore.connect(lendingPool).recordLoanTaken(user1.address)
            ).to.emit(creditScore, "LoanRecorded")
                .withArgs(user1.address, 1);
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update collateral ratio", async function () {
            await creditScore.setCollateralRatio(0, 14000);
            expect(await creditScore.collateralRatios(0)).to.equal(14000);
        });

        it("Should revert collateral ratio updates from non-owner", async function () {
            await expect(
                creditScore.connect(user1).setCollateralRatio(0, 14000)
            ).to.be.revertedWithCustomError(creditScore, "OwnableUnauthorizedAccount");
        });

        it("Should validate collateral ratio bounds", async function () {
            await expect(
                creditScore.setCollateralRatio(0, 500)
            ).to.be.revertedWith("CreditScore: ratio out of bounds");

            await expect(
                creditScore.setCollateralRatio(0, 25000)
            ).to.be.revertedWith("CreditScore: ratio out of bounds");
        });

        it("Should allow owner to update interest rate", async function () {
            await creditScore.setInterestRate(0, 600);
            expect(await creditScore.interestRates(0)).to.equal(600);
        });

        it("Should validate interest rate bounds", async function () {
            await expect(
                creditScore.setInterestRate(0, 1500)
            ).to.be.revertedWith("CreditScore: rate too high");
        });

        it("Should allow owner to update tier thresholds", async function () {
            await creditScore.setTierThreshold(1, 2);
            const thresholds = await creditScore.getTierThresholds();
            expect(thresholds[1]).to.equal(2);
        });

        it("Should allow owner to set lending pool", async function () {
            await creditScore.setLendingPool(user2.address);
            expect(await creditScore.lendingPool()).to.equal(user2.address);
        });

        it("Should revert setting lending pool to zero address", async function () {
            await expect(
                creditScore.setLendingPool(ethers.ZeroAddress)
            ).to.be.revertedWith("CreditScore: zero address");
        });
    });

    describe("Edge Cases", function () {
        it("Should handle user without pet gracefully for repayment", async function () {
            // Create a new user without a pet
            const [, , , , userWithoutPet] = await ethers.getSigners();

            // Should not revert, just skip pet operations
            await creditScore.connect(lendingPool).recordRepayment(userWithoutPet.address);
            const profile = await creditScore.getProfile(userWithoutPet.address);
            expect(profile.totalRepaidOnTime).to.equal(1);
        });

        it("Should handle user without pet gracefully for default", async function () {
            // Create a new user without a pet
            const [, , , , userWithoutPet] = await ethers.getSigners();

            // Should not revert, just skip pet operations
            await creditScore.connect(lendingPool).recordDefault(userWithoutPet.address);
            const profile = await creditScore.getProfile(userWithoutPet.address);
            expect(profile.totalDefaulted).to.equal(1);
        });

        it("Should handle rapid succession of repayments", async function () {
            for (let i = 0; i < 20; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.totalRepaidOnTime).to.equal(20);
            expect(profile.currentTier).to.equal(4);
        });

        it("Should maintain streak across tier upgrades", async function () {
            for (let i = 0; i < 10; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }

            const profile = await creditScore.getProfile(user1.address);
            expect(profile.currentStreak).to.equal(10);
        });

        it("Should evolve pet through all stages with repayments", async function () {
            // Tier 1 (1 repayment)
            await creditScore.connect(lendingPool).recordRepayment(user1.address);
            let pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1);

            // Tier 2 (3 repayments total)
            for (let i = 0; i < 2; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(2);

            // Tier 3 (7 repayments total)
            for (let i = 0; i < 4; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(3);

            // Tier 4 (15 repayments total)
            for (let i = 0; i < 8; i++) {
                await creditScore.connect(lendingPool).recordRepayment(user1.address);
            }
            pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4);
        });
    });
});

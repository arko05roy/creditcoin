import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// Helper function to mine blocks
async function mineBlocks(count: number) {
    for (let i = 0; i < count; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

describe("Integration Tests", function () {
    let questBoard: any;
    let lendingPool: any;
    let creditScore: any;
    let crediPet: any;
    let owner: any;
    let user: any;
    let supplier: any;
    let liquidator: any;

    const BASE_URI = "https://credipet.xyz/metadata/";
    const ONE_ETHER = ethers.parseEther("1");

    beforeEach(async function () {
        [owner, user, supplier, liquidator] = await ethers.getSigners();

        // Deploy all contracts (simulating deployment script)
        crediPet = await ethers.deployContract("CrediPet", [BASE_URI]);
        await crediPet.waitForDeployment();

        creditScore = await ethers.deployContract("CreditScore", [await crediPet.getAddress()]);
        await creditScore.waitForDeployment();

        lendingPool = await ethers.deployContract("LendingPool", [await creditScore.getAddress()]);
        await lendingPool.waitForDeployment();

        questBoard = await ethers.deployContract("QuestBoard", [
            await creditScore.getAddress(),
            await crediPet.getAddress(),
            await lendingPool.getAddress()
        ]);
        await questBoard.waitForDeployment();

        // Link contracts (as deployment script does)
        await crediPet.setCreditScoreContract(await creditScore.getAddress());
        await creditScore.setLendingPool(await lendingPool.getAddress());

        // Supply initial liquidity
        await lendingPool.connect(supplier).supply({ value: ethers.parseEther("100") });
    });

    describe("Full User Journey", function () {
        it("Should complete entire flow: mint → deposit → borrow → repay → evolve", async function () {
            // 1. Mint pet
            await crediPet.connect(user).mint();
            expect(await crediPet.hasPet(user.address)).to.be.true;

            // 2. Check initial state
            const pet0 = await crediPet.getPet(1);
            expect(pet0.stage).to.equal(0); // Egg
            expect(await creditScore.getCreditTier(user.address)).to.equal(0);

            // 3. Borrow (user at tier 0 = 150% collateral)
            const borrowAmount = ethers.parseEther("1");
            const collateral = ethers.parseEther("1.5");
            await lendingPool.connect(user).borrow(borrowAmount, { value: collateral });

            // 4. Verify loan is active
            const loan = await lendingPool.getLoan(user.address);
            expect(loan.isActive).to.be.true;
            expect(loan.principal).to.equal(borrowAmount);

            // 5. Repay on time
            const interest = (borrowAmount * 500n) / 10000n; // 5% for tier 0
            await lendingPool.connect(user).repay({ value: borrowAmount + interest });

            // 6. Check evolution (should be tier 1 now)
            expect(await creditScore.getCreditTier(user.address)).to.equal(1);
            const pet1 = await crediPet.getPet(1);
            expect(pet1.stage).to.equal(1); // Hatchling

            // 7. Verify loan is closed
            const loanAfter = await lendingPool.getLoan(user.address);
            expect(loanAfter.isActive).to.be.false;
        });

        it("Should complete full quest journey", async function () {
            // 1. Mint pet
            await crediPet.connect(user).mint();

            // 2. Claim HatchPet quest (100 XP)
            await questBoard.connect(user).claimQuest(0);
            expect(await questBoard.totalXP(user.address)).to.equal(100);

            // 3. Supply liquidity (0.1 CTC)
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });

            // 4. Claim deposit quests (150 + 200 = 350 XP)
            await questBoard.connect(user).claimQuest(1); // FirstDeposit
            await questBoard.connect(user).claimQuest(4); // SupplyLiquidity
            expect(await questBoard.totalXP(user.address)).to.equal(450);

            // 5. Borrow and claim quest (150 XP)
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await questBoard.connect(user).claimQuest(2); // FirstBorrow
            expect(await questBoard.totalXP(user.address)).to.equal(600);

            // 6. Repay and claim quest (200 XP)
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            await questBoard.connect(user).claimQuest(3); // FirstRepay
            expect(await questBoard.totalXP(user.address)).to.equal(800);

            // Check quest status
            const status = await questBoard.getQuestStatus(user.address);
            expect(status[0]).to.be.true; // HatchPet
            expect(status[1]).to.be.true; // FirstDeposit
            expect(status[2]).to.be.true; // FirstBorrow
            expect(status[3]).to.be.true; // FirstRepay
            expect(status[4]).to.be.true; // SupplyLiquidity
            expect(status[5]).to.be.false; // StreakBuilder (need 3)
            expect(status[6]).to.be.false; // TrustFall (need tier 2)
            expect(status[7]).to.be.false; // Legend (need tier 4)
        });
    });

    describe("Tier Progression Journey", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should progress through all tiers with 15 repayments", async function () {
            // Track tier progression
            const tierProgressions: number[] = [];

            for (let i = 0; i < 15; i++) {
                // Borrow
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });

                // Repay on time
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

                const tier = await creditScore.getCreditTier(user.address);
                tierProgressions.push(Number(tier));
            }

            // Verify tier progression: 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 4
            expect(tierProgressions[0]).to.equal(1);  // After 1 repay → Tier 1
            expect(tierProgressions[2]).to.equal(2);  // After 3 repays → Tier 2
            expect(tierProgressions[6]).to.equal(3);  // After 7 repays → Tier 3
            expect(tierProgressions[14]).to.equal(4); // After 15 repays → Tier 4

            // Verify pet evolution
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4); // Legendary

            // Can now claim Legend quest
            expect(await questBoard.canClaimQuest(user.address, 7)).to.be.true;
        });

        it("Should unlock all quests through gameplay", async function () {
            // Complete 15 repayments to unlock everything
            for (let i = 0; i < 15; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            // Supply for liquidity quests
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });

            // All quests should be claimable
            expect(await questBoard.canClaimQuest(user.address, 0)).to.be.true; // HatchPet
            expect(await questBoard.canClaimQuest(user.address, 1)).to.be.true; // FirstDeposit
            expect(await questBoard.canClaimQuest(user.address, 2)).to.be.true; // FirstBorrow
            expect(await questBoard.canClaimQuest(user.address, 3)).to.be.true; // FirstRepay
            expect(await questBoard.canClaimQuest(user.address, 4)).to.be.true; // SupplyLiquidity
            expect(await questBoard.canClaimQuest(user.address, 5)).to.be.true; // StreakBuilder
            expect(await questBoard.canClaimQuest(user.address, 6)).to.be.true; // TrustFall
            expect(await questBoard.canClaimQuest(user.address, 7)).to.be.true; // Legend

            // Claim all and verify total XP
            for (let i = 0; i < 8; i++) {
                await questBoard.connect(user).claimQuest(i);
            }

            // Total XP: 100 + 150 + 150 + 200 + 200 + 300 + 400 + 500 = 2000
            expect(await questBoard.totalXP(user.address)).to.equal(2000);
        });
    });

    describe("Default and Recovery Journey", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
            // Set short loan duration for testing
            await lendingPool.setLoanDuration(5);
        });

        it("Should weaken pet on default and heal on repayment", async function () {
            // Borrow
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });

            // Mine blocks past due date (but before grace period ends)
            const loan = await lendingPool.getLoan(user.address);
            const blocksToMine = Number(loan.dueBlock - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            // Late repayment (triggers default)
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

            // Pet should be weakened
            let pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;

            // Take another loan and repay on time
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

            // Pet should be healed
            pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should prevent Legend tier with any defaults", async function () {
            // Make 1 default
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            const loan = await lendingPool.getLoan(user.address);
            const blocksToMine = Number(loan.dueBlock - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

            // Make 15 more on-time repayments
            for (let i = 0; i < 15; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            // Should be stuck at tier 3 (not Legend)
            expect(await creditScore.getCreditTier(user.address)).to.equal(3);

            // Legend quest should not be claimable
            expect(await questBoard.canClaimQuest(user.address, 7)).to.be.false;
        });
    });

    describe("Liquidation Journey", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
            await lendingPool.setLoanDuration(5);
        });

        it("Should liquidate defaulted loan and seize collateral", async function () {
            const collateral = ethers.parseEther("1.5");

            // User borrows
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: collateral });

            // Get pool stats before
            const [depositsBefore] = await lendingPool.getPoolStats();

            // Mine past grace period
            const loan = await lendingPool.getLoan(user.address);
            const gracePeriod = await lendingPool.GRACE_PERIOD();
            const blocksToMine = Number(loan.dueBlock + gracePeriod - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            // Liquidate
            await lendingPool.connect(liquidator).liquidate(user.address);

            // Verify liquidation
            const loanAfter = await lendingPool.getLoan(user.address);
            expect(loanAfter.isActive).to.be.false;
            expect(loanAfter.isDefaulted).to.be.true;

            // Collateral should be added to pool
            const [depositsAfter] = await lendingPool.getPoolStats();
            expect(depositsAfter).to.equal(depositsBefore + collateral);

            // User's pet should be weakened
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;
        });
    });

    describe("Multi-User Scenarios", function () {
        it("Should handle multiple users with different credit tiers", async function () {
            const [, , , , user1, user2, user3] = await ethers.getSigners();

            // All users mint pets
            await crediPet.connect(user1).mint();
            await crediPet.connect(user2).mint();
            await crediPet.connect(user3).mint();

            // User1: Stay at tier 0
            // No actions needed

            // User2: Reach tier 1 (1 repayment)
            await lendingPool.connect(user2).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user2).repay({ value: ONE_ETHER + interest });

            // User3: Reach tier 2 (3 repayments)
            for (let i = 0; i < 3; i++) {
                await lendingPool.connect(user3).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                await lendingPool.connect(user3).repay({ value: ONE_ETHER + interest });
            }

            // Verify tiers
            expect(await creditScore.getCreditTier(user1.address)).to.equal(0);
            expect(await creditScore.getCreditTier(user2.address)).to.equal(1);
            expect(await creditScore.getCreditTier(user3.address)).to.equal(2);

            // Verify collateral requirements differ
            const coll1 = await lendingPool.getRequiredCollateral(user1.address, ONE_ETHER);
            const coll2 = await lendingPool.getRequiredCollateral(user2.address, ONE_ETHER);
            const coll3 = await lendingPool.getRequiredCollateral(user3.address, ONE_ETHER);

            expect(coll1).to.equal(ethers.parseEther("1.5"));  // 150%
            expect(coll2).to.equal(ethers.parseEther("1.3"));  // 130%
            expect(coll3).to.equal(ethers.parseEther("1.1"));  // 110%
        });

        it("Should track XP independently for multiple users", async function () {
            const [, , , , user1, user2] = await ethers.getSigners();

            await crediPet.connect(user1).mint();
            await crediPet.connect(user2).mint();

            // User1 claims HatchPet
            await questBoard.connect(user1).claimQuest(0);

            // User2 claims HatchPet and supplies
            await questBoard.connect(user2).claimQuest(0);
            await lendingPool.connect(user2).supply({ value: ethers.parseEther("0.1") });
            await questBoard.connect(user2).claimQuest(1);
            await questBoard.connect(user2).claimQuest(4);

            // Verify XP tracking
            expect(await questBoard.totalXP(user1.address)).to.equal(100);
            expect(await questBoard.totalXP(user2.address)).to.equal(450);
        });
    });

    describe("Contract Linkage Verification", function () {
        it("Should have all contracts properly linked", async function () {
            // Verify CrediPet -> CreditScore link
            expect(await crediPet.creditScoreContract()).to.equal(await creditScore.getAddress());

            // Verify CreditScore -> CrediPet link
            expect(await creditScore.crediPet()).to.equal(await crediPet.getAddress());

            // Verify CreditScore -> LendingPool link
            expect(await creditScore.lendingPool()).to.equal(await lendingPool.getAddress());

            // Verify LendingPool -> CreditScore link
            expect(await lendingPool.creditScore()).to.equal(await creditScore.getAddress());

            // Verify QuestBoard -> all contracts
            expect(await questBoard.creditScore()).to.equal(await creditScore.getAddress());
            expect(await questBoard.crediPet()).to.equal(await crediPet.getAddress());
            expect(await questBoard.lendingPool()).to.equal(await lendingPool.getAddress());
        });
    });
});

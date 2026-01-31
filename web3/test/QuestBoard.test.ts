import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// Helper function to mine blocks
async function mineBlocks(count: number) {
    for (let i = 0; i < count; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

describe("QuestBoard", function () {
    let questBoard: any;
    let lendingPool: any;
    let creditScore: any;
    let crediPet: any;
    let owner: any;
    let user: any;
    let supplier: any;

    const BASE_URI = "https://credipet.xyz/metadata/";
    const ONE_ETHER = ethers.parseEther("1");

    beforeEach(async function () {
        [owner, user, supplier] = await ethers.getSigners();

        // Deploy all contracts
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

        // Link contracts
        await crediPet.setCreditScoreContract(await creditScore.getAddress());
        await creditScore.setLendingPool(await lendingPool.getAddress());

        // Supply liquidity for borrowing tests
        await lendingPool.connect(supplier).supply({ value: ethers.parseEther("100") });
    });

    describe("Deployment", function () {
        it("Should set correct contract addresses", async function () {
            expect(await questBoard.creditScore()).to.equal(await creditScore.getAddress());
            expect(await questBoard.crediPet()).to.equal(await crediPet.getAddress());
            expect(await questBoard.lendingPool()).to.equal(await lendingPool.getAddress());
        });

        it("Should initialize all 8 quests correctly", async function () {
            const quest0 = await questBoard.getQuest(0);
            expect(quest0.name).to.equal("Hatch Your Pet");
            expect(quest0.xpReward).to.equal(100);

            const quest7 = await questBoard.getQuest(7);
            expect(quest7.name).to.equal("Legend");
            expect(quest7.xpReward).to.equal(500);
        });

        it("Should revert for invalid quest ID", async function () {
            await expect(
                questBoard.getQuest(8)
            ).to.be.revertedWith("QuestBoard: invalid quest");
        });
    });

    describe("Quest 0: Hatch Your Pet", function () {
        it("Should validate HatchPet quest after minting", async function () {
            expect(await questBoard.canClaimQuest(user.address, 0)).to.be.false;

            await crediPet.connect(user).mint();

            expect(await questBoard.canClaimQuest(user.address, 0)).to.be.true;
        });

        it("Should award 100 XP for completing HatchPet", async function () {
            await crediPet.connect(user).mint();
            await questBoard.connect(user).claimQuest(0);

            expect(await questBoard.totalXP(user.address)).to.equal(100);
        });

        it("Should emit QuestCompleted event", async function () {
            await crediPet.connect(user).mint();

            await expect(
                questBoard.connect(user).claimQuest(0)
            ).to.emit(questBoard, "QuestCompleted")
                .withArgs(user.address, 0, 100, 100);
        });
    });

    describe("Quest 1: First Deposit", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should validate FirstDeposit quest after supplying", async function () {
            expect(await questBoard.canClaimQuest(user.address, 1)).to.be.false;

            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.01") });

            expect(await questBoard.canClaimQuest(user.address, 1)).to.be.true;
        });

        it("Should award 150 XP for completing FirstDeposit", async function () {
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.01") });
            await questBoard.connect(user).claimQuest(1);

            expect(await questBoard.totalXP(user.address)).to.equal(150);
        });
    });

    describe("Quest 2: First Borrow", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should validate FirstBorrow quest after borrowing", async function () {
            expect(await questBoard.canClaimQuest(user.address, 2)).to.be.false;

            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });

            expect(await questBoard.canClaimQuest(user.address, 2)).to.be.true;
        });

        it("Should award 150 XP for completing FirstBorrow", async function () {
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await questBoard.connect(user).claimQuest(2);

            expect(await questBoard.totalXP(user.address)).to.equal(150);
        });
    });

    describe("Quest 3: Promise Keeper (First Repay)", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should validate FirstRepay quest after on-time repayment", async function () {
            expect(await questBoard.canClaimQuest(user.address, 3)).to.be.false;

            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

            expect(await questBoard.canClaimQuest(user.address, 3)).to.be.true;
        });

        it("Should award 200 XP for completing FirstRepay", async function () {
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            await questBoard.connect(user).claimQuest(3);

            expect(await questBoard.totalXP(user.address)).to.equal(200);
        });
    });

    describe("Quest 4: Generous Soul (Supply 0.1 CTC)", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should not validate with less than 0.1 CTC", async function () {
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.05") });
            expect(await questBoard.canClaimQuest(user.address, 4)).to.be.false;
        });

        it("Should validate with exactly 0.1 CTC", async function () {
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });
            expect(await questBoard.canClaimQuest(user.address, 4)).to.be.true;
        });

        it("Should award 200 XP for completing SupplyLiquidity", async function () {
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });
            await questBoard.connect(user).claimQuest(4);

            expect(await questBoard.totalXP(user.address)).to.equal(200);
        });
    });

    describe("Quest 5: Streak Builder (3 consecutive repayments)", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should not validate with less than 3 repayments", async function () {
            // Do 2 borrow/repay cycles
            for (let i = 0; i < 2; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            expect(await questBoard.canClaimQuest(user.address, 5)).to.be.false;
        });

        it("Should validate with 3 consecutive repayments", async function () {
            // Do 3 borrow/repay cycles
            for (let i = 0; i < 3; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            expect(await questBoard.canClaimQuest(user.address, 5)).to.be.true;
        });

        it("Should award 300 XP for completing StreakBuilder", async function () {
            for (let i = 0; i < 3; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }
            await questBoard.connect(user).claimQuest(5);

            expect(await questBoard.totalXP(user.address)).to.equal(300);
        });
    });

    describe("Quest 6: Trust Fall (Tier 2+ borrow)", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should validate when user reaches tier 2", async function () {
            expect(await questBoard.canClaimQuest(user.address, 6)).to.be.false;

            // Need 3 repayments to reach tier 2
            for (let i = 0; i < 3; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            expect(await creditScore.getCreditTier(user.address)).to.equal(2);
            expect(await questBoard.canClaimQuest(user.address, 6)).to.be.true;
        });

        it("Should award 400 XP for completing TrustFall", async function () {
            for (let i = 0; i < 3; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }
            await questBoard.connect(user).claimQuest(6);

            expect(await questBoard.totalXP(user.address)).to.equal(400);
        });
    });

    describe("Quest 7: Legend (Tier 4)", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should validate when user reaches tier 4", async function () {
            expect(await questBoard.canClaimQuest(user.address, 7)).to.be.false;

            // Need 15 repayments with no defaults to reach tier 4
            for (let i = 0; i < 15; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }

            expect(await creditScore.getCreditTier(user.address)).to.equal(4);
            expect(await questBoard.canClaimQuest(user.address, 7)).to.be.true;
        });

        it("Should award 500 XP for completing Legend", async function () {
            for (let i = 0; i < 15; i++) {
                await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
                const interest = ONE_ETHER * 500n / 10000n;
                await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });
            }
            await questBoard.connect(user).claimQuest(7);

            expect(await questBoard.totalXP(user.address)).to.equal(500);
        });
    });

    describe("Quest Status", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should return correct quest status array", async function () {
            const statusBefore = await questBoard.getQuestStatus(user.address);
            expect(statusBefore[0]).to.be.false;
            expect(statusBefore[1]).to.be.false;

            await questBoard.connect(user).claimQuest(0); // HatchPet

            const statusAfter = await questBoard.getQuestStatus(user.address);
            expect(statusAfter[0]).to.be.true;
            expect(statusAfter[1]).to.be.false;
        });

        it("Should track multiple quest completions", async function () {
            // Complete HatchPet
            await questBoard.connect(user).claimQuest(0);

            // Complete FirstDeposit
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });
            await questBoard.connect(user).claimQuest(1);
            await questBoard.connect(user).claimQuest(4); // Also completes SupplyLiquidity

            const status = await questBoard.getQuestStatus(user.address);
            expect(status[0]).to.be.true;
            expect(status[1]).to.be.true;
            expect(status[4]).to.be.true;
        });
    });

    describe("XP Tracking", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should accumulate XP across multiple quests", async function () {
            // HatchPet (100 XP)
            await questBoard.connect(user).claimQuest(0);
            expect(await questBoard.totalXP(user.address)).to.equal(100);

            // FirstDeposit (150 XP)
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });
            await questBoard.connect(user).claimQuest(1);
            expect(await questBoard.totalXP(user.address)).to.equal(250);

            // SupplyLiquidity (200 XP)
            await questBoard.connect(user).claimQuest(4);
            expect(await questBoard.totalXP(user.address)).to.equal(450);
        });

        it("Should track XP separately for each user", async function () {
            await crediPet.connect(supplier).mint();

            await questBoard.connect(user).claimQuest(0);
            await questBoard.connect(supplier).claimQuest(0);

            expect(await questBoard.totalXP(user.address)).to.equal(100);
            expect(await questBoard.totalXP(supplier.address)).to.equal(100);
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await crediPet.connect(user).mint();
        });

        it("Should prevent double claiming", async function () {
            await questBoard.connect(user).claimQuest(0);

            await expect(
                questBoard.connect(user).claimQuest(0)
            ).to.be.revertedWith("QuestBoard: already completed");
        });

        it("Should reject claiming incomplete quest", async function () {
            await expect(
                questBoard.connect(user).claimQuest(3) // FirstRepay - not done
            ).to.be.revertedWith("QuestBoard: quest not complete");
        });

        it("Should reject invalid quest ID", async function () {
            await expect(
                questBoard.connect(user).claimQuest(8)
            ).to.be.revertedWith("QuestBoard: invalid quest");
        });

        it("Should handle user without pet for most quests", async function () {
            // User without pet can't claim HatchPet
            const newUser = (await ethers.getSigners())[5];
            expect(await questBoard.canClaimQuest(newUser.address, 0)).to.be.false;
        });
    });

    describe("Full User Journey Integration", function () {
        it("Should complete entire flow: mint → deposit → borrow → repay → evolve → quests", async function () {
            // 1. Mint pet
            await crediPet.connect(user).mint();
            expect(await crediPet.hasPet(user.address)).to.be.true;

            // 2. Claim HatchPet quest
            await questBoard.connect(user).claimQuest(0);
            expect(await questBoard.totalXP(user.address)).to.equal(100);

            // 3. Supply liquidity
            await lendingPool.connect(user).supply({ value: ethers.parseEther("0.1") });

            // 4. Claim deposit quests
            await questBoard.connect(user).claimQuest(1); // FirstDeposit
            await questBoard.connect(user).claimQuest(4); // SupplyLiquidity
            expect(await questBoard.totalXP(user.address)).to.equal(450);

            // 5. Borrow
            await lendingPool.connect(user).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await questBoard.connect(user).claimQuest(2); // FirstBorrow
            expect(await questBoard.totalXP(user.address)).to.equal(600);

            // 6. Repay on time
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(user).repay({ value: ONE_ETHER + interest });

            // 7. Claim repay quest
            await questBoard.connect(user).claimQuest(3); // FirstRepay
            expect(await questBoard.totalXP(user.address)).to.equal(800);

            // 8. Check evolution
            expect(await creditScore.getCreditTier(user.address)).to.equal(1);
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1); // Hatchling
        });
    });
});

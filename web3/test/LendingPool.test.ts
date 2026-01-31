import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

// Helper function to mine blocks
async function mineBlocks(count: number) {
    for (let i = 0; i < count; i++) {
        await ethers.provider.send("evm_mine", []);
    }
}

describe("LendingPool", function () {
    let lendingPool: any;
    let creditScore: any;
    let crediPet: any;
    let owner: any;
    let supplier: any;
    let borrower: any;
    let liquidator: any;

    const BASE_URI = "https://credipet.xyz/metadata/";
    const ONE_ETHER = ethers.parseEther("1");
    const HALF_ETHER = ethers.parseEther("0.5");

    beforeEach(async function () {
        [owner, supplier, borrower, liquidator] = await ethers.getSigners();

        // Deploy CrediPet
        crediPet = await ethers.deployContract("CrediPet", [BASE_URI]);
        await crediPet.waitForDeployment();

        // Deploy CreditScore
        creditScore = await ethers.deployContract("CreditScore", [await crediPet.getAddress()]);
        await creditScore.waitForDeployment();

        // Deploy LendingPool
        lendingPool = await ethers.deployContract("LendingPool", [await creditScore.getAddress()]);
        await lendingPool.waitForDeployment();

        // Link contracts
        await crediPet.setCreditScoreContract(await creditScore.getAddress());
        await creditScore.setLendingPool(await lendingPool.getAddress());

        // Mint pet for borrower
        await crediPet.connect(borrower).mint();
    });

    describe("Deployment", function () {
        it("Should set correct CreditScore address", async function () {
            expect(await lendingPool.creditScore()).to.equal(await creditScore.getAddress());
        });

        it("Should initialize with zero deposits and borrows", async function () {
            const [deposits, borrowed, available] = await lendingPool.getPoolStats();
            expect(deposits).to.equal(0);
            expect(borrowed).to.equal(0);
            expect(available).to.equal(0);
        });

        it("Should set correct constants", async function () {
            expect(await lendingPool.MIN_BORROW()).to.equal(ethers.parseEther("0.001"));
            expect(await lendingPool.MAX_BORROW()).to.equal(ethers.parseEther("10"));
            expect(await lendingPool.GRACE_PERIOD()).to.equal(25);
            expect(await lendingPool.BASIS_POINTS()).to.equal(10000);
        });
    });

    describe("Supply", function () {
        it("Should accept deposits", async function () {
            await lendingPool.connect(supplier).supply({ value: ONE_ETHER });

            expect(await lendingPool.deposits(supplier.address)).to.equal(ONE_ETHER);
            expect(await lendingPool.totalDeposits()).to.equal(ONE_ETHER);
        });

        it("Should track individual and total deposits", async function () {
            await lendingPool.connect(supplier).supply({ value: ONE_ETHER });
            await lendingPool.connect(borrower).supply({ value: HALF_ETHER });

            expect(await lendingPool.deposits(supplier.address)).to.equal(ONE_ETHER);
            expect(await lendingPool.deposits(borrower.address)).to.equal(HALF_ETHER);
            expect(await lendingPool.totalDeposits()).to.equal(ONE_ETHER + HALF_ETHER);
        });

        it("Should emit Supplied event", async function () {
            await expect(
                lendingPool.connect(supplier).supply({ value: ONE_ETHER })
            ).to.emit(lendingPool, "Supplied")
                .withArgs(supplier.address, ONE_ETHER);
        });

        it("Should reject zero deposits", async function () {
            await expect(
                lendingPool.connect(supplier).supply({ value: 0 })
            ).to.be.revertedWith("LendingPool: zero amount");
        });
    });

    describe("Withdraw", function () {
        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ONE_ETHER });
        });

        it("Should allow withdrawal of available funds", async function () {
            const balanceBefore = await ethers.provider.getBalance(supplier.address);
            const tx = await lendingPool.connect(supplier).withdraw(HALF_ETHER);
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * tx.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(supplier.address);

            expect(balanceAfter).to.equal(balanceBefore + HALF_ETHER - gasUsed);
            expect(await lendingPool.deposits(supplier.address)).to.equal(HALF_ETHER);
        });

        it("Should emit Withdrawn event", async function () {
            await expect(
                lendingPool.connect(supplier).withdraw(HALF_ETHER)
            ).to.emit(lendingPool, "Withdrawn")
                .withArgs(supplier.address, HALF_ETHER);
        });

        it("Should reject withdrawal exceeding balance", async function () {
            await expect(
                lendingPool.connect(supplier).withdraw(ONE_ETHER + ONE_ETHER)
            ).to.be.revertedWith("LendingPool: insufficient balance");
        });

        it("Should reject withdrawal if insufficient pool liquidity", async function () {
            // Borrower takes all liquidity
            const borrowAmount = ethers.parseEther("0.5");
            const collateral = ethers.parseEther("0.75"); // 150% for tier 0
            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });

            // Supplier tries to withdraw more than available
            await expect(
                lendingPool.connect(supplier).withdraw(ONE_ETHER)
            ).to.be.revertedWith("LendingPool: insufficient liquidity");
        });
    });

    describe("Borrow", function () {
        beforeEach(async function () {
            // Supplier provides liquidity
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
        });

        it("Should calculate correct collateral for tier 0 (150%)", async function () {
            const borrowAmount = ONE_ETHER;
            const requiredCollateral = await lendingPool.getRequiredCollateral(borrower.address, borrowAmount);
            expect(requiredCollateral).to.equal(ethers.parseEther("1.5")); // 150%
        });

        it("Should allow borrow with sufficient collateral", async function () {
            const borrowAmount = ONE_ETHER;
            const collateral = ethers.parseEther("1.5");

            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });

            const loan = await lendingPool.getLoan(borrower.address);
            expect(loan.principal).to.equal(borrowAmount);
            expect(loan.collateral).to.equal(collateral);
            expect(loan.isActive).to.be.true;
        });

        it("Should emit Borrowed event", async function () {
            const borrowAmount = ONE_ETHER;
            const collateral = ethers.parseEther("1.5");

            await expect(
                lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral })
            ).to.emit(lendingPool, "Borrowed");
        });

        it("Should reject borrow with insufficient collateral", async function () {
            const borrowAmount = ONE_ETHER;
            const insufficientCollateral = ethers.parseEther("1.0"); // Need 1.5

            await expect(
                lendingPool.connect(borrower).borrow(borrowAmount, { value: insufficientCollateral })
            ).to.be.revertedWith("LendingPool: insufficient collateral");
        });

        it("Should reject if user already has active loan", async function () {
            const borrowAmount = ONE_ETHER;
            const collateral = ethers.parseEther("1.5");

            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });

            await expect(
                lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral })
            ).to.be.revertedWith("LendingPool: active loan exists");
        });

        it("Should enforce MIN borrow limit", async function () {
            const tooSmall = ethers.parseEther("0.0001");
            const collateral = ethers.parseEther("0.0015");

            await expect(
                lendingPool.connect(borrower).borrow(tooSmall, { value: collateral })
            ).to.be.revertedWith("LendingPool: invalid amount");
        });

        it("Should enforce MAX borrow limit", async function () {
            const tooLarge = ethers.parseEther("11");
            const collateral = ethers.parseEther("20");

            await expect(
                lendingPool.connect(borrower).borrow(tooLarge, { value: collateral })
            ).to.be.revertedWith("LendingPool: invalid amount");
        });

        it("Should reject if insufficient pool liquidity", async function () {
            // Withdraw most liquidity
            await lendingPool.connect(supplier).withdraw(ethers.parseEther("9.5"));

            const borrowAmount = ONE_ETHER;
            const collateral = ethers.parseEther("1.5");

            await expect(
                lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral })
            ).to.be.revertedWith("LendingPool: insufficient liquidity");
        });

        it("Should record loan in CreditScore", async function () {
            const borrowAmount = ONE_ETHER;
            const collateral = ethers.parseEther("1.5");

            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });

            const profile = await creditScore.getProfile(borrower.address);
            expect(profile.totalLoans).to.equal(1);
        });
    });

    describe("Repay", function () {
        const borrowAmount = ONE_ETHER;
        const collateral = ethers.parseEther("1.5");

        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });
        });

        it("Should allow on-time repayment", async function () {
            // 5% interest for tier 0
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await lendingPool.connect(borrower).repay({ value: totalOwed });

            const loan = await lendingPool.getLoan(borrower.address);
            expect(loan.isActive).to.be.false;
        });

        it("Should return collateral on repay", async function () {
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            const balanceBefore = await ethers.provider.getBalance(borrower.address);
            const tx = await lendingPool.connect(borrower).repay({ value: totalOwed });
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * tx.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(borrower.address);

            // Should receive collateral back minus payment minus gas
            const expectedChange = collateral - totalOwed - gasUsed;
            expect(balanceAfter - balanceBefore).to.equal(expectedChange);
        });

        it("Should refund excess payment", async function () {
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;
            const excessAmount = ethers.parseEther("0.5");

            const balanceBefore = await ethers.provider.getBalance(borrower.address);
            const tx = await lendingPool.connect(borrower).repay({ value: totalOwed + excessAmount });
            const receipt = await tx.wait();
            const gasUsed = receipt!.gasUsed * tx.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(borrower.address);

            // Should receive collateral + excess back minus payment minus gas
            const expectedChange = collateral - totalOwed - gasUsed;
            expect(balanceAfter - balanceBefore).to.equal(expectedChange);
        });

        it("Should emit Repaid event with onTime=true", async function () {
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await expect(
                lendingPool.connect(borrower).repay({ value: totalOwed })
            ).to.emit(lendingPool, "Repaid")
                .withArgs(borrower.address, borrowAmount, interest, true);
        });

        it("Should reject insufficient repayment", async function () {
            await expect(
                lendingPool.connect(borrower).repay({ value: borrowAmount }) // Missing interest
            ).to.be.revertedWith("LendingPool: insufficient repayment");
        });

        it("Should reject repay without active loan", async function () {
            await expect(
                lendingPool.connect(supplier).repay({ value: ONE_ETHER })
            ).to.be.revertedWith("LendingPool: no active loan");
        });

        it("Should record on-time repayment in CreditScore", async function () {
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await lendingPool.connect(borrower).repay({ value: totalOwed });

            const profile = await creditScore.getProfile(borrower.address);
            expect(profile.totalRepaidOnTime).to.equal(1);
            expect(profile.currentTier).to.equal(1); // Upgraded from tier 0
        });

        it("Should evolve pet on tier upgrade after repayment", async function () {
            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await lendingPool.connect(borrower).repay({ value: totalOwed });

            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1); // Evolved from egg to hatchling
        });
    });

    describe("Late Repayment", function () {
        const borrowAmount = ONE_ETHER;
        const collateral = ethers.parseEther("1.5");

        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });
        });

        it("Should record late repayment as default", async function () {
            // Mine blocks to pass due date
            const loan = await lendingPool.getLoan(borrower.address);
            const blocksToMine = Number(loan.dueBlock - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await lendingPool.connect(borrower).repay({ value: totalOwed });

            const profile = await creditScore.getProfile(borrower.address);
            expect(profile.totalDefaulted).to.equal(1);
        });

        it("Should emit Repaid event with onTime=false for late repayment", async function () {
            // Mine blocks to pass due date
            const loan = await lendingPool.getLoan(borrower.address);
            const blocksToMine = Number(loan.dueBlock - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            const interest = borrowAmount * 500n / 10000n;
            const totalOwed = borrowAmount + interest;

            await expect(
                lendingPool.connect(borrower).repay({ value: totalOwed })
            ).to.emit(lendingPool, "Repaid")
                .withArgs(borrower.address, borrowAmount, interest, false);
        });
    });

    describe("Liquidation", function () {
        const borrowAmount = ONE_ETHER;
        const collateral = ethers.parseEther("1.5");

        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
            await lendingPool.connect(borrower).borrow(borrowAmount, { value: collateral });
        });

        it("Should allow liquidation after grace period", async function () {
            // Mine blocks past due date + grace period
            const loan = await lendingPool.getLoan(borrower.address);
            const gracePeriod = await lendingPool.GRACE_PERIOD();
            const blocksToMine = Number(loan.dueBlock + gracePeriod - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            await lendingPool.connect(liquidator).liquidate(borrower.address);

            const loanAfter = await lendingPool.getLoan(borrower.address);
            expect(loanAfter.isActive).to.be.false;
            expect(loanAfter.isDefaulted).to.be.true;
        });

        it("Should add collateral to pool on liquidation", async function () {
            const [depositsBefore] = await lendingPool.getPoolStats();

            // Mine blocks past grace period
            const loan = await lendingPool.getLoan(borrower.address);
            const gracePeriod = await lendingPool.GRACE_PERIOD();
            const blocksToMine = Number(loan.dueBlock + gracePeriod - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            await lendingPool.connect(liquidator).liquidate(borrower.address);

            const [depositsAfter] = await lendingPool.getPoolStats();
            expect(depositsAfter).to.equal(depositsBefore + collateral);
        });

        it("Should emit Liquidated event", async function () {
            // Mine blocks past grace period
            const loan = await lendingPool.getLoan(borrower.address);
            const gracePeriod = await lendingPool.GRACE_PERIOD();
            const blocksToMine = Number(loan.dueBlock + gracePeriod - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            await expect(
                lendingPool.connect(liquidator).liquidate(borrower.address)
            ).to.emit(lendingPool, "Liquidated")
                .withArgs(borrower.address, collateral);
        });

        it("Should reject liquidation during grace period", async function () {
            // Only pass due date, not grace period
            const loan = await lendingPool.getLoan(borrower.address);
            const blocksToMine = Number(loan.dueBlock - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            await expect(
                lendingPool.connect(liquidator).liquidate(borrower.address)
            ).to.be.revertedWith("LendingPool: grace period active");
        });

        it("Should reject liquidation of non-existent loan", async function () {
            await expect(
                lendingPool.connect(liquidator).liquidate(supplier.address)
            ).to.be.revertedWith("LendingPool: no active loan");
        });

        it("Should record default in CreditScore on liquidation", async function () {
            // Mine blocks past grace period
            const loan = await lendingPool.getLoan(borrower.address);
            const gracePeriod = await lendingPool.GRACE_PERIOD();
            const blocksToMine = Number(loan.dueBlock + gracePeriod - BigInt(await ethers.provider.getBlockNumber())) + 1;
            await mineBlocks(blocksToMine);

            await lendingPool.connect(liquidator).liquidate(borrower.address);

            const profile = await creditScore.getProfile(borrower.address);
            expect(profile.totalDefaulted).to.equal(1);
        });
    });

    describe("Credit Tier Integration", function () {
        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("50") });
        });

        it("Should reduce collateral requirement after tier upgrade", async function () {
            // Tier 0: 150% collateral
            const tier0Collateral = await lendingPool.getRequiredCollateral(borrower.address, ONE_ETHER);
            expect(tier0Collateral).to.equal(ethers.parseEther("1.5"));

            // Borrow and repay to upgrade tier
            await lendingPool.connect(borrower).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            const interest = ONE_ETHER * 500n / 10000n;
            await lendingPool.connect(borrower).repay({ value: ONE_ETHER + interest });

            // Tier 1: 130% collateral
            const tier1Collateral = await lendingPool.getRequiredCollateral(borrower.address, ONE_ETHER);
            expect(tier1Collateral).to.equal(ethers.parseEther("1.3"));
        });

        it("Should reduce interest rate after tier upgrade", async function () {
            // First loan at tier 0 (5% interest)
            await lendingPool.connect(borrower).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            let loan = await lendingPool.getLoan(borrower.address);
            expect(loan.interestRate).to.equal(500); // 5%

            // Repay to upgrade
            await lendingPool.connect(borrower).repay({ value: ethers.parseEther("1.05") });

            // Second loan at tier 1 (4% interest)
            await lendingPool.connect(borrower).borrow(ONE_ETHER, { value: ethers.parseEther("1.3") });
            loan = await lendingPool.getLoan(borrower.address);
            expect(loan.interestRate).to.equal(400); // 4%
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to set loan duration", async function () {
            await lendingPool.setLoanDuration(100);
            expect(await lendingPool.loanDurationBlocks()).to.equal(100);
        });

        it("Should reject non-owner setting loan duration", async function () {
            await expect(
                lendingPool.connect(borrower).setLoanDuration(100)
            ).to.be.revertedWithCustomError(lendingPool, "OwnableUnauthorizedAccount");
        });
    });

    describe("Edge Cases", function () {
        beforeEach(async function () {
            await lendingPool.connect(supplier).supply({ value: ethers.parseEther("10") });
        });

        it("Should handle minimum borrow amount", async function () {
            const minBorrow = await lendingPool.MIN_BORROW();
            const collateral = minBorrow * 150n / 100n;

            await lendingPool.connect(borrower).borrow(minBorrow, { value: collateral });

            const loan = await lendingPool.getLoan(borrower.address);
            expect(loan.principal).to.equal(minBorrow);
        });

        it("Should handle exact collateral amount", async function () {
            const borrowAmount = ONE_ETHER;
            const exactCollateral = ethers.parseEther("1.5");

            await lendingPool.connect(borrower).borrow(borrowAmount, { value: exactCollateral });

            const loan = await lendingPool.getLoan(borrower.address);
            expect(loan.collateral).to.equal(exactCollateral);
        });

        it("Should handle multiple users borrowing concurrently", async function () {
            // Get additional signers that don't have pets yet
            const allSigners = await ethers.getSigners();
            const user1 = allSigners[4];
            const user2 = allSigners[5];
            const user3 = allSigners[6];

            // Give them pets
            await crediPet.connect(user1).mint();
            await crediPet.connect(user2).mint();
            await crediPet.connect(user3).mint();

            // All borrow
            await lendingPool.connect(user1).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await lendingPool.connect(user2).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });
            await lendingPool.connect(user3).borrow(ONE_ETHER, { value: ethers.parseEther("1.5") });

            expect(await lendingPool.totalBorrowed()).to.equal(ethers.parseEther("3"));
        });
    });
});

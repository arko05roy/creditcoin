import { network } from "hardhat";

const { ethers } = await network.connect();

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("🚀 Deploying CrediPet Protocol");
    console.log("================================");
    console.log("Deployer:", deployer.address);
    console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "CTC");
    console.log("");

    // 1. Deploy CrediPet
    console.log("1️⃣  Deploying CrediPet...");
    const crediPet = await ethers.deployContract("CrediPet", ["https://credipet.xyz/metadata/"]);
    await crediPet.waitForDeployment();
    const crediPetAddress = await crediPet.getAddress();
    console.log("   ✅ CrediPet:", crediPetAddress);

    // 2. Deploy CreditScore
    console.log("2️⃣  Deploying CreditScore...");
    const creditScore = await ethers.deployContract("CreditScore", [crediPetAddress]);
    await creditScore.waitForDeployment();
    const creditScoreAddress = await creditScore.getAddress();
    console.log("   ✅ CreditScore:", creditScoreAddress);

    // 3. Deploy LendingPool
    console.log("3️⃣  Deploying LendingPool...");
    const lendingPool = await ethers.deployContract("LendingPool", [creditScoreAddress]);
    await lendingPool.waitForDeployment();
    const lendingPoolAddress = await lendingPool.getAddress();
    console.log("   ✅ LendingPool:", lendingPoolAddress);

    // 4. Deploy QuestBoard
    console.log("4️⃣  Deploying QuestBoard...");
    const questBoard = await ethers.deployContract("QuestBoard", [
        creditScoreAddress,
        crediPetAddress,
        lendingPoolAddress
    ]);
    await questBoard.waitForDeployment();
    const questBoardAddress = await questBoard.getAddress();
    console.log("   ✅ QuestBoard:", questBoardAddress);

    // 5. Link contracts
    console.log("");
    console.log("🔗 Linking contracts...");

    console.log("   Setting CreditScore on CrediPet...");
    const tx1 = await crediPet.setCreditScoreContract(creditScoreAddress);
    await tx1.wait();
    console.log("   ✅ CrediPet → CreditScore linked");

    console.log("   Setting LendingPool on CreditScore...");
    const tx2 = await creditScore.setLendingPool(lendingPoolAddress);
    await tx2.wait();
    console.log("   ✅ CreditScore → LendingPool linked");

    // Summary
    console.log("");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("🎉 DEPLOYMENT COMPLETE!");
    console.log("═══════════════════════════════════════════════════════════");
    console.log("");
    console.log("📋 Contract Addresses (save to .env):");
    console.log("────────────────────────────────────────");
    console.log(`NEXT_PUBLIC_CREDIPET_ADDRESS=${crediPetAddress}`);
    console.log(`NEXT_PUBLIC_CREDITSCORE_ADDRESS=${creditScoreAddress}`);
    console.log(`NEXT_PUBLIC_LENDINGPOOL_ADDRESS=${lendingPoolAddress}`);
    console.log(`NEXT_PUBLIC_QUESTBOARD_ADDRESS=${questBoardAddress}`);
    console.log("");
    console.log("📝 Verification Commands:");
    console.log("────────────────────────────────────────");
    console.log(`npx hardhat verify --network creditcoinTestnet ${crediPetAddress} "https://credipet.xyz/metadata/"`);
    console.log(`npx hardhat verify --network creditcoinTestnet ${creditScoreAddress} "${crediPetAddress}"`);
    console.log(`npx hardhat verify --network creditcoinTestnet ${lendingPoolAddress} "${creditScoreAddress}"`);
    console.log(`npx hardhat verify --network creditcoinTestnet ${questBoardAddress} "${creditScoreAddress}" "${crediPetAddress}" "${lendingPoolAddress}"`);
    console.log("");

    return {
        crediPet: crediPetAddress,
        creditScore: creditScoreAddress,
        lendingPool: lendingPoolAddress,
        questBoard: questBoardAddress
    };
}

main()
    .then((addresses) => {
        console.log("Deployment successful!");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    });

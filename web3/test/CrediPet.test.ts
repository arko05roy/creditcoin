import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();

describe("CrediPet", function () {
    let crediPet: any;
    let owner: any;
    let user1: any;
    let user2: any;
    let creditScore: any; // Mock CreditScore contract

    const BASE_URI = "https://credipet.xyz/metadata/";

    beforeEach(async function () {
        [owner, user1, user2, creditScore] = await ethers.getSigners();

        crediPet = await ethers.deployContract("CrediPet", [BASE_URI]);
        await crediPet.waitForDeployment();

        // Set mock CreditScore contract
        await crediPet.setCreditScoreContract(creditScore.address);
    });

    describe("Deployment", function () {
        it("Should set the correct base URI", async function () {
            expect(await crediPet.baseURI()).to.equal(BASE_URI);
        });

        it("Should set the correct owner", async function () {
            expect(await crediPet.owner()).to.equal(owner.address);
        });

        it("Should start with tokenId 1", async function () {
            await crediPet.connect(user1).mint();
            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
        });
    });

    describe("Minting", function () {
        it("Should mint a pet for a new user", async function () {
            await crediPet.connect(user1).mint();

            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
            expect(await crediPet.hasPet(user1.address)).to.be.true;
        });

        it("Should start pet at stage 0 (Egg)", async function () {
            await crediPet.connect(user1).mint();
            const pet = await crediPet.getPet(1);

            expect(pet.stage).to.equal(0);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should revert if user already owns a pet", async function () {
            await crediPet.connect(user1).mint();

            await expect(
                crediPet.connect(user1).mint()
            ).to.be.revertedWith("CrediPet: already owns a pet");
        });

        it("Should mint unique token IDs for different users", async function () {
            await crediPet.connect(user1).mint();
            await crediPet.connect(user2).mint();

            expect(await crediPet.petOfOwner(user1.address)).to.equal(1);
            expect(await crediPet.petOfOwner(user2.address)).to.equal(2);
        });

        it("Should set mintedAt timestamp correctly", async function () {
            const tx = await crediPet.connect(user1).mint();
            const receipt = await tx.wait();
            const block = await ethers.provider.getBlock(receipt!.blockNumber);

            const pet = await crediPet.getPet(1);
            expect(pet.mintedAt).to.equal(block!.timestamp);
        });
    });

    describe("Evolution", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should evolve pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 1);
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(1);
        });

        it("Should emit PetEvolved event", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 1)
            ).to.emit(crediPet, "PetEvolved")
                .withArgs(user1.address, 1, 0, 1);
        });

        it("Should revert if caller is not CreditScore", async function () {
            await expect(
                crediPet.connect(user1).evolve(user1.address, 1)
            ).to.be.revertedWith("CrediPet: caller is not CreditScore");
        });

        it("Should revert if user has no pet", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user2.address, 1)
            ).to.be.revertedWith("CrediPet: user has no pet");
        });

        it("Should revert if trying to evolve backwards", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 2);

            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 1)
            ).to.be.revertedWith("CrediPet: can only evolve forward");
        });

        it("Should revert if stage exceeds maximum", async function () {
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 5)
            ).to.be.revertedWith("CrediPet: invalid stage");
        });

        it("Should allow skipping stages", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 4);
            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4);
        });
    });

    describe("Health Status", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should weaken pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.true;
        });

        it("Should heal pet when called by CreditScore", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            await crediPet.connect(creditScore).setWeakened(user1.address, false);
            const pet = await crediPet.getPet(1);
            expect(pet.isWeakened).to.be.false;
        });

        it("Should emit PetHealthChanged event", async function () {
            await expect(
                crediPet.connect(creditScore).setWeakened(user1.address, true)
            ).to.emit(crediPet, "PetHealthChanged")
                .withArgs(user1.address, 1, true);
        });

        it("Should revert if caller is not CreditScore", async function () {
            await expect(
                crediPet.connect(user1).setWeakened(user1.address, true)
            ).to.be.revertedWith("CrediPet: caller is not CreditScore");
        });
    });

    describe("Token URI", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should return correct URI for healthy egg", async function () {
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/egg.json"
            );
        });

        it("Should return correct URI for weakened egg", async function () {
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/egg-weak.json"
            );
        });

        it("Should return correct URI for evolved stage", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 2);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/juvenile.json"
            );
        });

        it("Should return correct URI for weakened evolved stage", async function () {
            await crediPet.connect(creditScore).evolve(user1.address, 4);
            await crediPet.connect(creditScore).setWeakened(user1.address, true);
            expect(await crediPet.tokenURI(1)).to.equal(
                "https://credipet.xyz/metadata/legendary-weak.json"
            );
        });

        it("Should revert for invalid token ID", async function () {
            await expect(
                crediPet.tokenURI(999)
            ).to.be.revertedWith("CrediPet: invalid token ID");
        });
    });

    describe("Soulbound Behavior", function () {
        beforeEach(async function () {
            await crediPet.connect(user1).mint();
        });

        it("Should prevent transfers", async function () {
            await expect(
                crediPet.connect(user1).transferFrom(user1.address, user2.address, 1)
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });

        it("Should prevent safeTransferFrom", async function () {
            await expect(
                crediPet.connect(user1)["safeTransferFrom(address,address,uint256)"](
                    user1.address,
                    user2.address,
                    1
                )
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });

        it("Should prevent transfer even with approval", async function () {
            // Approve doesn't revert, but transfer will
            await crediPet.connect(user1).approve(user2.address, 1);

            await expect(
                crediPet.connect(user2).transferFrom(user1.address, user2.address, 1)
            ).to.be.revertedWith("CrediPet: soulbound token - transfers disabled");
        });
    });

    describe("Admin Functions", function () {
        it("Should allow owner to update CreditScore contract", async function () {
            const newCreditScore = user2.address;
            await crediPet.setCreditScoreContract(newCreditScore);
            expect(await crediPet.creditScoreContract()).to.equal(newCreditScore);
        });

        it("Should revert if non-owner tries to update CreditScore", async function () {
            await expect(
                crediPet.connect(user1).setCreditScoreContract(user2.address)
            ).to.be.revertedWithCustomError(crediPet, "OwnableUnauthorizedAccount");
        });

        it("Should revert if setting CreditScore to zero address", async function () {
            await expect(
                crediPet.setCreditScoreContract(ethers.ZeroAddress)
            ).to.be.revertedWith("CrediPet: zero address");
        });

        it("Should allow owner to update base URI", async function () {
            const newURI = "https://new.credipet.xyz/";
            await crediPet.setBaseURI(newURI);
            expect(await crediPet.baseURI()).to.equal(newURI);
        });
    });

    describe("Edge Cases", function () {
        it("Should handle getPet with invalid token ID", async function () {
            await expect(
                crediPet.getPet(999)
            ).to.be.revertedWith("CrediPet: invalid token ID");
        });

        it("Should return false for hasPet with unminted address", async function () {
            expect(await crediPet.hasPet(user2.address)).to.be.false;
        });

        it("Should handle multiple users minting sequentially", async function () {
            const users = [user1, user2, owner];

            for (let i = 0; i < users.length; i++) {
                await crediPet.connect(users[i]).mint();
                expect(await crediPet.petOfOwner(users[i].address)).to.equal(i + 1);
            }
        });

        it("Should handle evolution to max stage correctly", async function () {
            await crediPet.connect(user1).mint();
            await crediPet.connect(creditScore).evolve(user1.address, 4);

            const pet = await crediPet.getPet(1);
            expect(pet.stage).to.equal(4);

            // Can't evolve further
            await expect(
                crediPet.connect(creditScore).evolve(user1.address, 5)
            ).to.be.revertedWith("CrediPet: invalid stage");
        });
    });
});

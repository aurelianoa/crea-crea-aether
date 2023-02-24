import { expect } from "chai";
import { ethers } from "hardhat";
import { CreaAether } from "../typechain-types";

describe("CreaAether", function () {
    let owner: any,
    aureAddress: any,
    creaAddress: any,
    addr1: any,
    addr2: any,
    addr3: any,
    addr4: any,
    contractAddress: any;
    let flatSignature1: any;
    let flatSignature2: any;
    let flatSignature3: any;
    let CreaAether: CreaAether;

    beforeEach(async function () {
        [owner, aureAddress, creaAddress, addr1, addr2, addr3, addr4] = await ethers.getSigners();
        const CreaAetherFactory = await ethers.getContractFactory("CreaAether");

        CreaAether = (await CreaAetherFactory.deploy(
            "Crea - Aether",
            "CREAAETHER",
            [creaAddress.address, aureAddress.address],
            [90, 10]
        )) as CreaAether;

        await CreaAether.deployed();

        
        /// adding addresses to the allow list
        contractAddress = await ethers.getSigner(CreaAether.address);

        await CreaAether
            .connect(owner)
            .setVariant("male", "", ethers.utils.parseEther("0"), true);
        await CreaAether
            .connect(owner)
            .setVariant("female", "", ethers.utils.parseEther("0"), true);

        const message1 = ethers.utils.solidityKeccak256(
        ["address", "address"],
        [contractAddress.address, addr1.address]
        );
        const arrayifyMessage1 = ethers.utils.arrayify(message1);
        flatSignature1 = await owner.signMessage(arrayifyMessage1);

        const message2 = ethers.utils.solidityKeccak256(
        ["address", "address"],
        [contractAddress.address, addr2.address]
        );
        const arrayifyMessage2 = ethers.utils.arrayify(message2);
        flatSignature2 = await owner.signMessage(arrayifyMessage2);

        const message3 = ethers.utils.solidityKeccak256(
        ["address", "address"],
        [contractAddress.address, addr3.address]
        );
        const arrayifyMessage3 = ethers.utils.arrayify(message3);
        flatSignature3 = await owner.signMessage(arrayifyMessage3);
    });

    it("Should return the new deployed contract", async function () {
        expect(await CreaAether.name()).to.equal("Crea - Aether");
    });
    describe("Team mint", function () {
        it("owner can mint", async function () {
            await CreaAether
              .connect(owner)
              .teamMint([
                "male",
                "female",
                "male",
                "male",
                "female",
                "male",
                "male",
                "female",
                "male",
                "female",
                "male",
                "female",
              ]);
            expect(await CreaAether.totalSupply()).to.equal(12);
        });
    });
    describe("Mint Pass mint", function () {
        let mintPass:any;
        beforeEach(async function () {
            const MintPass = await ethers.getContractFactory("MintPass");
            mintPass = await MintPass.deploy();
        
            await mintPass.deployed();
            /// mint 1 mint pass for addr1
            await mintPass.mint(addr1.address, 1);
            /// register mint pass address into CreaAether
            await CreaAether.connect(owner).updateMintPass(mintPass.address);
            /// set mint status to mint pass only
            await CreaAether.connect(owner).setMintState(true, false, false);
        });
        /// Mint Pass tests
        it("owner can mint with mint pass", async function () {
            /// owner addr1 mint with mint pass
            await CreaAether.connect(addr1).mintWithMintPass(1, "male");
            expect(await CreaAether.totalSupply()).to.equal(1);
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            expect(await CreaAether.ownerOf(1)).to.equal(addr1.address);
        });
        it("owner cannot mint with mint pass if mint pass is not registered", async function () {
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            /// owner addr1 mint with mint pass
            await expect(CreaAether.connect(addr1).mintWithMintPass(1, "male")).to.be.revertedWith("You dont own this token");
        });
        it("owner cannot mint with mint pass if its already been used", async function () {
            /// owner addr1 mint with mint pass
            await CreaAether.connect(addr1).mintWithMintPass(1, "male");
            expect(await CreaAether.totalSupply()).to.equal(1);
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            expect(await CreaAether.ownerOf(1)).to.equal(addr1.address);

            /// transfer mint pass to addr2
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            /// addr2 try to mint with mint pass
            await expect(CreaAether.connect(addr2).mintWithMintPass(1, "male")).to.be.revertedWith("This token has already been used");
        });
    });
    describe("Allowlist mint", function () {
        beforeEach(async function () {
            await CreaAether.connect(owner).setMintState(false, true, false);
        });
        it("allowlist mint", async function () {
            await CreaAether
              .connect(addr1)
              .allowListMint(["male", "male"], flatSignature1, {
                value: ethers.utils.parseEther("0.16"),
              });
            await CreaAether
              .connect(addr2)
              .allowListMint(["female", "female", "female"], flatSignature2, {
                value: ethers.utils.parseEther("0.24"),
              });
            await CreaAether
              .connect(addr3)
              .allowListMint(["male", "male", "male"], flatSignature3, {
                value: ethers.utils.parseEther("0.24"),
              });
            expect(await CreaAether.totalSupply()).to.equal(8);
        });
        it("should revert if using wrong signature", async function () {
            await expect(
              CreaAether
                .connect(addr3)
                .allowListMint(["male", "male", "male"], flatSignature1, {
                  value: ethers.utils.parseEther("0.24"),
                })
            ).to.be.revertedWith("Address not in Allowlist");
        });
        it("should revert if using wrong signed signature", async function () {
            const message = ethers.utils.solidityKeccak256(
                ["address", "address"],
                [contractAddress.address, addr4.address]
            );
            const arrayifyMessage = ethers.utils.arrayify(message);
            const flatSignature = await addr3.signMessage(arrayifyMessage);
            await expect(
                CreaAether
                .connect(addr4)
                .allowListMint(["male", "male", "male"], flatSignature, {
                    value: ethers.utils.parseEther("0.24"),
                })
            ).to.be.revertedWith("Address not in Allowlist");
        });
        it("should revert if try to mint more of allowed", async function () {
            await CreaAether
                .connect(addr1)
                .allowListMint(["male", "male", "male"], flatSignature1, {
                value: ethers.utils.parseEther("0.24"),
                });
            expect(await CreaAether.totalSupply()).to.equal(3);
            await expect(
                CreaAether
                .connect(addr1)
                .allowListMint(["male", "male"], flatSignature1, {
                    value: ethers.utils.parseEther("0.16"),
                })
            ).to.be.revertedWith("Maximum per wallet exceeded");
        });
    });
     
    describe("Public mint", function () {
        beforeEach(async function () {
            await CreaAether.connect(owner).setMintState(false, true, true);
        });
        it("addr1 can mint up to 8", async function () {
            await CreaAether
            .connect(addr1)
            .allowListMint(["male", "male", "male", "male"], flatSignature1, {
                value: ethers.utils.parseEther("0.32"),
            });
            await CreaAether
            .connect(addr1)
            .publicMint(["female", "female", "female", "female"], {
                value: ethers.utils.parseEther("0.4"),
            });
            expect(await CreaAether.totalSupply()).to.equal(8);
        });
    });
    describe("Max mints left", function () {
        beforeEach(async function () {
            CreaAether.connect(owner).setMintState(false, true, false);
        });
        it("Allowlist max mint only 4", async function () {
            expect(await CreaAether.maxMintLeft(addr1.address)).to.equal(4);
        });
        it("Public max mint 4 more", async function () {
            CreaAether.connect(owner).setMintState(false, false, true);
            expect(await CreaAether.maxMintLeft(addr1.address)).to.equal(4);
        });
    });
});
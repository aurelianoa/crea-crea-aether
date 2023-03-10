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
    describe("Mint Pass claim", function () {
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
        it("owner can claim with mint pass", async function () {
            /// owner addr1 claim with mint pass
            await CreaAether.connect(addr1).claimWithMintPass(1, "male");
            expect(await CreaAether.totalSupply()).to.equal(1);
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            expect(await CreaAether.ownerOf(1)).to.equal(addr1.address);
        });
        it("owner cannot claim with mint pass if mint pass is not registered", async function () {
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            /// owner addr1 claim with mint pass
            await expect(CreaAether.connect(addr1).claimWithMintPass(1, "male")).to.be.revertedWith("You dont own this token");
        });
        it("owner cannot claim with mint pass if its already been used", async function () {
            /// owner addr1 claim with mint pass
            await CreaAether.connect(addr1).claimWithMintPass(1, "male");
            expect(await CreaAether.totalSupply()).to.equal(1);
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            expect(await CreaAether.ownerOf(1)).to.equal(addr1.address);

            /// transfer mint pass to addr2
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            /// addr2 try to claim with mint pass
            await expect(CreaAether.connect(addr2).claimWithMintPass(1, "male")).to.be.revertedWith("This token has already been used");
        });
        it("owner can claim with multiple mint passes", async function () {
            /// will be 10 passes
            await mintPass.mint(addr1.address, 9);
            /// owner addr1 claim with mint passes
            const passes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const variants = ["male","female","male","female","male","female","male","female","male","female"]
            await CreaAether.connect(addr1).claimWithMintPassMultiple(passes, variants);
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(10);
            expect(await CreaAether.ownerOf(1)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(2)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(3)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(4)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(5)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(6)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(7)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(8)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(9)).to.equal(addr1.address);
            expect(await CreaAether.ownerOf(10)).to.equal(addr1.address);
        });
        it("owner cannot claim with multiple mint passes if 1 mint pass is not valid", async function () {
            await mintPass.mint(addr1.address, 9);
            /// owner addr1 mint with mint passes
            const passes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const variants = ["male","female","male","female","male","female","male","female","male","female"];
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            await expect(CreaAether.connect(addr1).claimWithMintPassMultiple(passes, variants)).to.be.revertedWith("You dont own this token");
        });
        it("owner cannot claim with multiple mint passes if 1 mint pass is already used", async function () {
            await mintPass.mint(addr1.address, 9);
            /// owner addr1 mint with mint passes
            const passes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const variants = ["male","female","male","female","male","female","male","female","male","female"];
            // owner claim with mint pass 1
            await CreaAether.connect(addr1).claimWithMintPass(10, "male");
            await expect(CreaAether.connect(addr1).claimWithMintPassMultiple(passes, variants)).to.be.revertedWith("This token has already been used");
        });
        /// owner cannot claim if passes id array is <> than variants array
        it("owner cannot claim with multiple mint passes if passes id array is <> than variants array", async function () {
            await mintPass.mint(addr1.address, 9);
            /// owner addr1 mint with mint passes
            const passes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            /// variants array is missing 1 element
            const variants = ["male","female","male","female","male","female","male","female","male"];
            await expect(CreaAether.connect(addr1).claimWithMintPassMultiple(passes, variants)).to.be.revertedWith("Array length mismatch");
        });
    });
    /// mint with Mint Pass
    describe("Mint with Mint Pass", function () {
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
        ///owner can mit with mint pass with the right eth ammount
        it("owner can mint with mint pass with the right eth ammount", async function () {
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
        });
        ///owner cannot mint with mint pass with the wrong eth ammount
        it("owner cannot mint with mint pass with the wrong eth ammount", async function () {
            await expect(CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.05")})).to.be.revertedWith("wrong eth sent");
        });
        ///owner cannot mint with mint pass if mint pass count exceeded
        it("owner cannot mint with mint pass if mint pass count exceeded", async function () {
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            await expect(CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")})).to.be.revertedWith("Maximum per wallet exceeded");
        });
        /// mint pass count maintained even if user transefrs mint pass to another address
        it("mint pass count maintained even if user transefrs mint pass to another address", async function () {
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            /// transfer mint pass to addr2
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            await expect(CreaAether.connect(addr2).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")})).to.be.revertedWith("Maximum per wallet exceeded");
        });
        /// owner can mint more if mint pass count is increased
        it("owner can mint more if mint pass count is increased", async function () {
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            await expect(CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")})).to.be.revertedWith("Maximum per wallet exceeded");
            /// increase mint pass count limit to 3
            await CreaAether.connect(owner).updateMaxPerwallet(3, 2);
            /// mint 2 more aether nfts
            await CreaAether.connect(addr1).mintWithMintPass(1,["male","female"], {value: ethers.utils.parseEther("0.16")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(3);
        });

        /// mint pass count maintained even if user transefrs mint pass to another address after the limit is increased
        it("mint pass count maintained even if user transefrs mint pass to another address after the limit is increased", async function () {
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(1);
            await expect(CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")})).to.be.revertedWith("Maximum per wallet exceeded");
            /// increase mint pass count limit to 3
            await CreaAether.connect(owner).updateMaxPerwallet(3, 2);
            /// mint 1 more aether nfts
            await CreaAether.connect(addr1).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr1.address)).to.equal(2);
            /// transfer mint pass to addr2
            await mintPass.connect(addr1).transferFrom(addr1.address, addr2.address, 1);
            /// addr2 mint 1 more aether nft
            await CreaAether.connect(addr2).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")});
            expect(await CreaAether.balanceOf(addr2.address)).to.equal(1);
            /// addr2 cannot mint more
            await expect(CreaAether.connect(addr2).mintWithMintPass(1,["male"], {value: ethers.utils.parseEther("0.08")})).to.be.revertedWith("Maximum per wallet exceeded");
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
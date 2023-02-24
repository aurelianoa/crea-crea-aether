import { expect } from "chai";
import { ethers } from "hardhat";
import { CreaAether } from "../typechain-types";

describe("Crea - Aether Metadata", function () {
    let owner: any,
      aureAddress: any,
      creaAddress: any,
      addr1: any,
      addr2: any,
      addr3: any,
      addr4: any;
    let creaAether: CreaAether;
    const unrevealedUri =
      "ipfs://QmfZBG3YKxM7qDikpWXfzbXuBnbx1KwNs5XgVJboT3FLRv/unrevealed.json";
    const maleSeed = "QmQV8ed5CsuQwehoGz64u7VnhAUxkVikzN1sqp27H8K4b9";
    const femaleSeed = "QmcuVB8ebcghFkySoQsFyvhn2XaUzFyE2oUwCHmXkd4J6t";
    beforeEach(async function () {
      [owner, aureAddress, creaAddress, addr1, addr2, addr3, addr4] =
        await ethers.getSigners();
  
      const CreaAether = await ethers.getContractFactory("CreaAether");
      creaAether = await CreaAether.deploy(
        "Crea - Aether",
        "CREAAETHER",
        [creaAddress.address, aureAddress.address],
        [90, 10]
      );
      await creaAether.deployed();
      await creaAether
        .connect(owner)
        .setVariant("male", "", ethers.utils.parseEther("0"), true);
      await creaAether
        .connect(owner)
        .setVariant("female", "", ethers.utils.parseEther("0"), true);
      await creaAether.connect(owner).setMintState(false, false, true);
      await creaAether
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
        ]);
      await creaAether
        .connect(addr1)
        .publicMint(["female", "female", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr2)
        .publicMint(["female", "male", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr3)
        .publicMint(["female", "female", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr4)
        .publicMint(["female", "female", "male", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
    });
    it("mint every token", async function () {
      expect(await creaAether.totalSupply()).to.equal(26);
    });
    it("check unrevealed state", async function () {
      await creaAether.connect(owner).setBaseURI(unrevealedUri);
      expect(await creaAether.tokenURI(1)).to.equal(unrevealedUri);
      expect(await creaAether.tokenURI(25)).to.equal(unrevealedUri);
    });
    it("check revealed state", async function () {
      await creaAether.connect(owner).setVariant("male", maleSeed, 0, true);
      await creaAether.connect(owner).setVariant("female", femaleSeed, 0, true);
      await creaAether.connect(owner).setRevealedBaseURI("ipfs://");
      await creaAether.connect(owner).setReveal(true);
      const maleMetadata = await creaAether.tokenURI(16);
      const femaleMetadata = await creaAether.tokenURI(24);
      expect(maleMetadata).to.equal(`ipfs://${maleSeed}/16.json`);
      expect(femaleMetadata).to.equal(`ipfs://${femaleSeed}/24.json`);
    });
    describe("Changing variant", function () {
      beforeEach(async function () {
        await creaAether.connect(owner).setVariant("male", maleSeed, 0, true);
        await creaAether
          .connect(owner)
          .setVariant("female", femaleSeed, 0, true);
        await creaAether.connect(owner).setRevealedBaseURI("ipfs://");
        await creaAether.connect(owner).setReveal(true);
      });
      it("user can change variants", async function () {
        const femaleMetadata = await creaAether.tokenURI(19);
        expect(femaleMetadata).to.equal(`ipfs://${femaleSeed}/19.json`);
        await creaAether.connect(addr3).updateVariant(19, "male", {
          value: ethers.utils.parseEther("0"),
        });
        const maleMetadata = await creaAether.tokenURI(19);
        expect(maleMetadata).to.equal(`ipfs://${maleSeed}/19.json`);
      });
      it("user can't update varian in unrevealed state", async function () {
        await creaAether.connect(owner).setBaseURI(unrevealedUri);
        await creaAether.connect(owner).setReveal(false);
        const unrevealedMetadata = await creaAether.tokenURI(15);
        expect(unrevealedMetadata).to.equal(unrevealedUri);
        await expect(
          creaAether.connect(addr3).updateVariant(15, "male", {
            value: ethers.utils.parseEther("0"),
          })
        ).to.be.revertedWith("Metadata not revealed yet");
        await creaAether.connect(owner).setReveal(true);
        const revealedMetadata = await creaAether.tokenURI(15);
        expect(revealedMetadata).to.equal(`ipfs://${femaleSeed}/15.json`);
        await creaAether.connect(addr2).updateVariant(15, "male", {
          value: ethers.utils.parseEther("0"),
        });
        const newMetadata = await creaAether.tokenURI(15);
        expect(newMetadata).to.equal(`ipfs://${maleSeed}/15.json`);
      });
    });
  });
import { expect } from "chai";
import { ethers } from "hardhat";
import { CreaAether } from "../typechain-types";

describe("Crea - Aether Stress Min", function () {
    let owner: any,
      aureAddress: any,
      creaAddress: any,
      addr1: any,
      addr2: any,
      addr3: any,
      addr4: any;
    let creaAether: CreaAether;
    const maleSeed = "QmQV8ed5CsuQwehoGz64u7VnhAUxkVikzN1sqp27H8K4b9";
    const femaleSeed = "QmcuVB8ebcghFkySoQsFyvhn2XaUzFyE2oUwCHmXkd4J6t";
    const seletectd = [
      femaleSeed,
      femaleSeed,
      femaleSeed,
      femaleSeed,
      maleSeed,
      maleSeed,
      femaleSeed,
      femaleSeed,
      maleSeed,
      maleSeed,
      femaleSeed,
      femaleSeed,
      femaleSeed,
      femaleSeed,
      femaleSeed,
      femaleSeed,
    ];
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
      /// public mint
      await creaAether.connect(owner).setMintState(false, false, true);
      await creaAether
        .connect(owner)
        .setVariant("male", maleSeed, ethers.utils.parseEther("0"), true);
      await creaAether
        .connect(owner)
        .setVariant("female", femaleSeed, ethers.utils.parseEther("0"), true);
      await creaAether
        .connect(addr1)
        .publicMint(["female", "female", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr2)
        .publicMint(["male", "male", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr3)
        .publicMint(["male", "male", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
      await creaAether
        .connect(addr4)
        .publicMint(["female", "female", "female", "female"], {
          value: ethers.utils.parseEther("0.4"),
        });
    });
    it("should have minted 16 tokens", async function () {
      expect(await creaAether.totalSupply()).to.equal(16);
    });
    it("should the correct metadata", async function () {
      await creaAether.connect(owner).setRevealedBaseURI("ipfs://");
      await creaAether.connect(owner).setReveal(true);
      for (let i = 1; i <= 16; i++) {
        const meta = await creaAether.tokenURI(i);
        expect(meta).to.equal(`ipfs://${seletectd[i - 1]}/${i}.json`);
      }
    });
  });
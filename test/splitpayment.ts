import { expect } from "chai";
import { ethers } from "hardhat";
import { CreaAether } from "../typechain-types";

describe("Crea Aether - Split payments", function () {
    let owner: any,
      aureAddress: any,
      creaAddress: any,
      addr1: any,
      addr2: any,
      addr3: any,
      addr4: any,
      contractAddress: any;
    let creaAether: CreaAether;
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
      contractAddress = await ethers.getSigner(creaAether.address);
      await creaAether
        .connect(owner)
        .setVariant("male", "", ethers.utils.parseEther("0"), true);
      await creaAether
        .connect(owner)
        .setVariant("female", "", ethers.utils.parseEther("0"), true);
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
      await creaAether.connect(owner).setMintState(false, false, true);
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
    it("Aure and Crea Can widthdraw the eth balance", async function () {
      expect(await creaAether.totalSupply()).to.equal(26);
      /// payed minted only 16
      expect(await contractAddress.getBalance()).to.equal(
        ethers.utils.parseEther("1.6")
      );
      expect(await creaAether.totalShares()).to.equal(100);
      expect(await creaAether["totalReleased()"]()).to.equal(0);
      expect(await creaAether.shares(creaAddress.address)).to.equal(90);
      expect(await creaAether.shares(aureAddress.address)).to.equal(10);
      await creaAether["release(address)"](creaAddress.address);
      expect(await creaAddress.getBalance()).to.equal(
        ethers.utils.parseEther("10001.44")
      );
      await creaAether["release(address)"](aureAddress.address);
      expect(await aureAddress.getBalance()).to.equal(
        ethers.utils.parseEther("10000.16")
      );
      await expect(
        creaAether["release(address)"](addr4.address)
      ).to.be.revertedWith("PaymentSplitter: account has no shares");
    });
  });
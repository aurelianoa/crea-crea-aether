// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const CreaAether = await ethers.getContractFactory("CreaAether");
  /// TODO: CHECK THE FINAL ADDRESES
  const creaAether = await CreaAether.deploy(
    "Crea - Aether",
    "CREAAETHER",
    [
      "0x514d5b013be80788839c58135f7eabbc68dfceb4",
      "0x6b4707c809dD7ae529a8527c0B1E4447bF80bEE8",
    ],
    [90, 10]
  );

  await creaAether.deployed();

  console.log("CreaAether deployed to:", creaAether.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

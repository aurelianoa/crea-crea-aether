import addresses from "../addresses/addresses.json";
import sign from "./signWallet";
import fs from "fs";

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS_MAINNET;
  const walletAddreses = addresses;

  walletAddreses.forEach((address:any) => {
    sign(contractAddress, address).then((signature) => {
      const signatureObj = { signature: signature };
      fs.writeFile(
        `./addresses/signatures_new/${address.toLocaleLowerCase()}.json`,
        JSON.stringify(signatureObj),
        function (err) {
          if (err) throw err;
          console.log(`Complete: ${address}`);
        }
      );
    });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

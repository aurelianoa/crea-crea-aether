import { ethers } from "hardhat";

export default async function sign(
  contractAddress: string | undefined,
  walletAddress: string
): Promise<string | null> {
  if (!contractAddress) return null;
  const message = ethers.utils.solidityKeccak256(
    ["address", "address"],
    [contractAddress, walletAddress]
  );
  const arrayifyMessage = ethers.utils.arrayify(message);
  const flatSignature = await new ethers.Wallet(
    `0x${process.env.PRIVATE_KEY_MAINNET}`
  ).signMessage(arrayifyMessage);
  return flatSignature;
}

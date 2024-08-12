const hardhat = require('hardhat')
const ethers = hardhat.ethers;

async function claimRewards(routerAddress, tokenAddress, memberAddress) {
  await hardhat.run('compile');

  const calculator = await ethers.getContractAt('IFeeCalculator', routerAddress);
  const tx = await calculator.claim(tokenAddress, memberAddress);

  console.log(`TX [${tx.hash}] submitted, waiting to be mined...`);
  await tx.wait();

  console.log(`Claimed token [${tokenAddress}] to member [${memberAddress}]`);
}

module.exports = claimRewards;
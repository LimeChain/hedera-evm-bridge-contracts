const hardhat = require('hardhat')
const ethers = hardhat.ethers;

async function setTreasury(routerAddress, treasuryAddress, treasuryPercentage) {
  await hardhat.run('compile');

  const governance = await ethers.getContractAt('IGovernance', routerAddress);
  const updateTreasuryTnx = await governance.updateTreasury(treasuryAddress);

  console.log(`TX [${updateTreasuryTnx.hash}] submitted, waiting to be mined...`);
  await updateTreasuryTnx.wait();

  console.log(`Updated treasury [${treasuryAddress}] to router [${routerAddress}]`);

  const feeCalculator = await ethers.getContractAt('IFeeCalculator', routerAddress);

  const setPercentageTnx = await feeCalculator.setTreasuryPercentage(treasuryPercentage);

  console.log(`TX [${setPercentageTnx.hash}] submitted, waiting to be mined...`);
  await setPercentageTnx.wait();
  console.log(`Updated treasury percentage to [${treasuryPercentage}] to router [${routerAddress}]`);
}

module.exports = setTreasury;
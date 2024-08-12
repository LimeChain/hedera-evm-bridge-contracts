const hardhat = require("hardhat");
const ethers = hardhat.ethers;
const { getSelector } = require("../util");

async function updateFacet(facetName, facetAddress, routerAddress, action, functionSignatures) {
  const facetContract = await ethers.getContractAt(facetName, facetAddress);
  const signatures = functionSignatures.split(',');
  const selectors = signatures.map(signature => getSelector(signature)).filter(value => value !== undefined);

  const diamondAddCutReplace = [
    {
      facetAddress: facetContract.address,
      action, // Action
      functionSelectors: selectors,
    },
  ];

  console.log(
    "\ndiamondAddCutReplace Data: \n",
    JSON.stringify(diamondAddCutReplace)
  );

  const router = await ethers.getContractAt("IRouterDiamond", routerAddress);
  const txData = router.interface.encodeFunctionData("diamondCut", [
    diamondAddCutReplace,
    ethers.constants.AddressZero,
    "0x",
  ]);

  console.log("\nTX Data: \n");
  console.log(txData);
}

module.exports = updateFacet;

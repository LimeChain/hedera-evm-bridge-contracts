const hardhat = require("hardhat");
const ethers = hardhat.ethers;
const { getSelector } = require("../util");

async function updateFacet(facetName, facetAddress, routerAddress, action, functionSignatures) {
  const facetContract = await ethers.getContractAt(facetName, facetAddress);
  let signatures = functionSignatures.split(',');


  const diamondAddCutReplace = [
    {
      facetAddress: facetContract.address,
      action, // Replace
      functionSelectors: signatures.map(signature => getSelector(signature)),
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

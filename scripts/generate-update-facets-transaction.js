const hardhat = require("hardhat");
const ethers = hardhat.ethers;
const { getSelector } = require("../util");

async function generateUpdateFacetsTransaction(
  addressPerNameMap,
  routerAddress,
  cutActionAndFuncSignaturePerFacetNameMap
) {
  const diamondAddCutReplace = [];

  for (const [name, address] of Object.entries(addressPerNameMap)) {
    const facetContract = await ethers.getContractAt(name, address);
    const selectorsPerAction = {};

    for (const actionAndFuncSign of cutActionAndFuncSignaturePerFacetNameMap[name]) {
      const action = actionAndFuncSign[0];

      if (!selectorsPerAction[action]) {
        selectorsPerAction[action] = [];
      }
      const signature = actionAndFuncSign[1];
      const selector = getSelector(facetContract, signature);
      selectorsPerAction[action].push(selector);
    }
    for (const [action, selectors] of Object.entries(selectorsPerAction)) {
      diamondAddCutReplace.push({
        facetAddress: facetContract.address,
        action,
        functionSelectors: selectors,
      });
    }
  }

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

module.exports = generateUpdateFacetsTransaction;

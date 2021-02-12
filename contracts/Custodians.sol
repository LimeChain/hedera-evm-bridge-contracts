pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";

contract Custodians is Ownable {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private custodiansSet;

    uint256 public custodiansTotalAmount;
    mapping(address => uint256) public custodiansToAmount;

    event CustodianSet(address operator, bool status);

    function setCustodian(address account, bool isOperator) public onlyOwner {
        if (isOperator) {
            require(
                custodiansSet.add(account),
                "Custodians: Cannot add existing custodian"
            );
        } else if (!isOperator) {
            require(
                custodiansSet.remove(account),
                "Custodians: Cannot remove non-existing custodian"
            );
        }
        CustodianSet(account, isOperator);
    }

    function containsCustodian(address _custodian) public view returns (bool) {
        return custodiansSet.contains(_custodian);
    }

    function custodianCount() public view returns (uint256) {
        return custodiansSet.length();
    }

    function custodianAddress(uint256 index) public view returns (address) {
        return custodiansSet.at(index);
    }
}
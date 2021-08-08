// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IGovernance.sol";
import "../libraries/LibGovernance.sol";
import "../libraries/LibFeeCalculator.sol";
import "../libraries/LibRouter.sol";

contract GovernanceFacet is IGovernance {
    using Counters for Counters.Counter;
    using SafeERC20 for IERC20;

    function initGovernance(address[] memory _members) external override {
        LibGovernance.Storage storage gs = LibGovernance.governanceStorage();
        require(!gs.initialized, "Governance: already initialized");
        require(
            _members.length > 0,
            "Governance: Member list must contain at least 1 element"
        );
        gs.initialized = true;

        for (uint256 i = 0; i < _members.length; i++) {
            LibGovernance.updateMember(_members[i], true);
            emit MemberUpdated(_members[i], true);
        }
    }

    /// @notice Adds/removes a member account
    /// @param _account The account to be modified
    /// @param _status Whether the account will be set as member or not
    /// @param _signatures The signatures of the validators authorizing this member update
    function updateMember(
        address _account,
        bool _status,
        bytes[] calldata _signatures
    ) external override {
        LibGovernance.validateSignaturesLength(_signatures.length);
        bytes32 ethHash = LibGovernance.computeMemberUpdateMessage(
            _account,
            _status
        );
        LibGovernance.validateSignatures(ethHash, _signatures);

        if (_status) {
            for (uint256 i = 0; i < LibRouter.nativeTokensCount(); i++) {
                LibFeeCalculator.addNewMember(
                    _account,
                    LibRouter.nativeTokenAt(i)
                );
            }
        } else {
            for (uint256 i = 0; i < LibRouter.nativeTokensCount(); i++) {
                address token = LibRouter.nativeTokenAt(i);
                uint256 claimableFees = LibFeeCalculator.claimReward(
                    _account,
                    token
                );
                IERC20(token).safeTransfer(_account, claimableFees);
            }
        }

        LibGovernance.updateMember(_account, _status);
        emit MemberUpdated(_account, _status);
    }

    /// @return True/false depending on whether a given address is member or not
    function isMember(address _member) external view override returns (bool) {
        return LibGovernance.isMember(_member);
    }

    /// @return The count of members in the members set
    function membersCount() external view override returns (uint256) {
        return LibGovernance.membersCount();
    }

    /// @return The address of a member at a given index
    function memberAt(uint256 _index) external view override returns (address) {
        return LibGovernance.memberAt(_index);
    }

    /// @return The current administrative nonce
    function administrativeNonce() external view override returns (uint256) {
        LibGovernance.Storage storage gs = LibGovernance.governanceStorage();
        return gs.administrativeNonce.current();
    }
}
// SPDX-License-Identifier: MIT
pragma solidity 0.8.3;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IFeeCalculator.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibFeeCalculator.sol";
import "../libraries/LibRouter.sol";

contract FeeCalculatorFacet is IFeeCalculator {
    using SafeERC20 for IERC20;

    /// @notice Construct a new FeeCalculator contract
    /// @param _precision The precision for every fee calculator
    /// @param _validatorRewardsPercentage The percentage for the validator rewards
    function initFeeCalculator(uint256 _precision, uint256 _validatorRewardsPercentage) external override {
        LibFeeCalculator.Storage storage fcs = LibFeeCalculator
            .feeCalculatorStorage();
        require(!fcs.initialized, "FeeCalculatorFacet: already initialized");
        require(
            _precision >= 10,
            "FeeCalculatorFacet: precision must not be single-digit"
        );
        require(
            _validatorRewardsPercentage < _precision,
            "FeeCalculatorFacet: percentages must be less than precision"
        );        
        fcs.initialized = true;
        fcs.precision = _precision;
        fcs.validatorRewardsPercentage = _validatorRewardsPercentage;
    }

    /// @return The current precision for service fee calculations of tokens
    function serviceFeePrecision() external view override returns (uint256) {
        return LibFeeCalculator.precision();
    }

    /// @notice Sets the service fee for a token
    /// @param _token The target token
    /// @param _serviceFeePercentage The new service fee
    function setServiceFee(address _token, uint256 _serviceFeePercentage)
        external
        override
    {
        LibDiamond.enforceIsContractOwner();
        LibFeeCalculator.setServiceFee(_token, _serviceFeePercentage);
        emit ServiceFeeSet(msg.sender, _token, _serviceFeePercentage);
    }

    /// @notice updates the validator rewards percentage
    /// @param _validatorRewardsPercentage The validator rewards percentage
    function updateValidatorRewardsPercentage(uint256 _validatorRewardsPercentage)
        external
        override
    {
        LibDiamond.enforceIsContractOwner();
        LibFeeCalculator.updateValidatorRewardsPercentage(_validatorRewardsPercentage);
        emit UpdateValidatorRewardsPercentage(msg.sender, _validatorRewardsPercentage);
    }

    /// @notice The current validator rewards percentage
    function validatorRewardsPercentage() external view override returns (uint256) {
        return LibFeeCalculator.validatorRewardsPercentage();
    }

    /// @param _account The address of a validator
    /// @param _token The token address
    /// @return The total amount of claimed tokens by the provided validator address
    function claimedRewardsPerAccount(address _account, address _token)
        external
        view
        override
        returns (uint256)
    {
        LibFeeCalculator.Storage storage fcs = LibFeeCalculator
            .feeCalculatorStorage();
        return
            fcs.nativeTokenFeeCalculators[_token].claimedRewardsPerAccount[
                _account
            ];
    }

    /// @notice Returns all data for a specific fee calculator
    /// @param _token The target token
    /// @return serviceFeePercentage The current service fee
    /// @return feesAccrued Total fees accrued since contract deployment
    /// @return previousAccrued Total fees accrued up to the last point a member claimed rewards
    /// @return accumulator Accumulates rewards on a per-member basis
    function tokenFeeData(address _token)
        external
        view
        override
        returns (
            uint256 serviceFeePercentage,
            uint256 feesAccrued,
            uint256 previousAccrued,
            uint256 accumulator
        )
    {
        LibFeeCalculator.Storage storage fcs = LibFeeCalculator
            .feeCalculatorStorage();
        LibFeeCalculator.FeeCalculator storage fc = fcs
            .nativeTokenFeeCalculators[_token];

        return (
            fc.serviceFeePercentage,
            fc.feesAccrued,
            fc.previousAccrued,
            fc.accumulator
        );
    }

    /// @notice Sends out the reward accumulated by the member for the specified token
    /// to the member admin and treasury
    function claim(address _token, address _member)
        external
        override
    {
        _claim(_token,_member);
    }

    function _claim(address _token, address _member) internal onlyMember(_member) {
        LibGovernance.enforceNotPaused();
        LibFeeCalculator.Storage storage fcs = LibFeeCalculator
            .feeCalculatorStorage();

        uint256 claimableAmount = LibFeeCalculator.claimReward(_member, _token);
        address memberAdmin = LibGovernance.memberAdmin(_member);
        address treasury = LibGovernance.treasury();
        uint256 validatorClaimableAmount = (claimableAmount * fcs.validatorRewardsPercentage) / fcs.precision;

        IERC20(_token).safeTransfer(memberAdmin, validatorClaimableAmount);
        IERC20(_token).safeTransfer(treasury, claimableAmount - validatorClaimableAmount);

        emit Claim(_member, memberAdmin, _token, claimableAmount);
    }


    /// @notice Sends out the reward accumulated by the members for the specified tokens
    /// to the members admin and treasury
    function claimMultiple(address[] calldata _tokens, address[] calldata _members)
        external
        override
    {
        LibGovernance.enforceNotPaused();
        uint256 tokensLength = _tokens.length;
        uint256 membersLength = _members.length;

        for(uint256 x = 0; x < membersLength;){
            for (uint256 i = 0; i < tokensLength; ) {
                _claim(_tokens[i], _members[x]);
                unchecked {
                    ++i;
                }
            }

            unchecked {
                ++x;
             }
        }
    }

    /// @notice Accepts only `msg.sender` part of the members
    modifier onlyMember(address _member) {
        require(
            LibGovernance.isMember(_member),
            "FeeCalculatorFacet: _member is not a member"
        );
        _;
    }
}

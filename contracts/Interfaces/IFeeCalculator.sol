// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface IFeeCalculator {
    /// @notice An event emitted once the service fee is modified
    event ServiceFeeSet(address account, address token, uint256 newServiceFee);
    /// @notice An event emitted once a member claims fees accredited to him
    event Claim(address member, address token, uint256 amount);

    /// @notice Construct a new FeeCalculator contract
    function initFeeCalculator() external;

    /// @notice Sets the service fee for a token
    /// @param _token The target token
    /// @param _serviceFee The new service fee
    /// @param _signatures The array of signatures from the members, authorising the operation
    function setServiceFee(
        address _token,
        uint256 _serviceFee,
        bytes[] calldata _signatures
    ) external;

    /// @notice Returns all data for a specific native fee calculator
    /// @param _token The target token
    /// @return serviceFee The current service fee
    /// @return feesAccrued Total fees accrued since contract deployment
    /// @return previousAccrued Total fees accrued up to the last point a member claimed rewards
    /// @return accumulator Accumulates rewards on a per-member basis
    function tokenFeeData(address _token)
        external
        view
        returns (
            uint256 serviceFee,
            uint256 feesAccrued,
            uint256 previousAccrued,
            uint256 accumulator
        );

    /// @param _account The address of a validator
    /// @param _token The token address
    /// @return The total amount claimed by the provided validator address for the specified token
    function claimedRewardsPerAccount(address _account, address _token)
        external
        view
        returns (uint256);

    /// @notice Sends out the reward accumulated by the caller for the specified token
    function claim(address _token) external;
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/Counters.sol";
import "../interfaces/IDiamondCut.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibGovernance.sol";

contract DiamondCutFacet is IDiamondCut {
    using Counters for Counters.Counter;

    /// @notice Add/replace/remove any number of functions and optionally execute
    ///         a function with delegatecall
    /// @param _diamondCut Contains the facet addresses and function selectors
    /// @param _init The address of the contract or facet to execute _calldata
    /// @param _calldata A function call, including function selector and arguments
    ///                  _calldata is executed with delegatecall on _init
    /// @param _signatures The signatures required for
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata,
        bytes[] calldata _signatures
    ) external override {
        LibGovernance.validateSignaturesLength(_signatures.length);
        bytes32 ethHash = computeDiamondCutMessage(_diamondCut);
        LibGovernance.validateSignatures(ethHash, _signatures);
        LibDiamond.diamondCut(_diamondCut, _init, _calldata);
    }

    /// @notice Computes the bytes32 ethereum signed message hash of the signature
    function computeDiamondCutMessage(IDiamondCut.FacetCut[] memory _diamondCut)
        internal
        view
        returns (bytes32)
    {
        LibGovernance.Storage storage gs = LibGovernance.governanceStorage();
        bytes32 hashedData = keccak256(
            abi.encode(_diamondCut, gs.administrativeNonce.current())
        );
        return ECDSA.toEthSignedMessageHash(hashedData);
    }
}
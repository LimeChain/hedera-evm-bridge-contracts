// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library LibRouter {
    using EnumerableSet for EnumerableSet.AddressSet;
    bytes32 constant STORAGE_POSITION = keccak256("router.storage");

    /// @notice Struct containing information about a token's address and its native chain
    struct NativeTokenWithChainId {
        uint256 chainId;
        bytes token;
    }

    struct Storage {
        bool initialized;
        // Maps chainID => (nativeToken => wrappedToken)
        mapping(uint256 => mapping(bytes => address)) nativeToWrappedToken;
        // Maps wrapped tokens in the current chain to their native chain + token address
        mapping(address => NativeTokenWithChainId) wrappedToNativeToken;
        // Storage metadata for transfers. Maps sourceChain => (transactionId => metadata)
        mapping(uint256 => mapping(bytes32 => bool)) hashesUsed;
        // Stores all supported native Tokens on this chain
        EnumerableSet.AddressSet nativeTokens;
    }

    function routerStorage() internal pure returns (Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function updateNativeToken(address _nativeToken, bool _status) internal {
        Storage storage rs = routerStorage();
        if (_status) {
            require(
                rs.nativeTokens.add(_nativeToken),
                "Router: native token already added"
            );
        } else {
            require(
                rs.nativeTokens.remove(_nativeToken),
                "Router: native token not found"
            );
        }
    }

    /// @notice Returns the count of native token
    function nativeTokensCount() internal view returns (uint256) {
        Storage storage rs = routerStorage();
        return rs.nativeTokens.length();
    }

    /// @notice Returns the address of the native token at a given index
    function nativeTokenAt(uint256 _index) internal view returns (address) {
        Storage storage rs = routerStorage();
        return rs.nativeTokens.at(_index);
    }

    /// @notice Returns true/false depending on whether a given native token is found
    function containsNativeToken(address _nativeToken)
        internal
        view
        returns (bool)
    {
        Storage storage rs = routerStorage();
        return rs.nativeTokens.contains(_nativeToken);
    }
}
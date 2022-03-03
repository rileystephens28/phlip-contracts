// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Blacklistable {
    mapping(address => bool) private _blacklist;

    /**
     * @notice Require msg.sender to not be blacklisted
     * @dev Reverts if msg.sender is blacklisted
     */
    modifier noBlacklisters() {
        require(
            !_blacklist[msg.sender],
            "Blacklistable: BLACKLISTED_ADDRESSES_ARE_FORBIDDEN"
        );
        _;
    }

    /**
     * @notice Prevent account from minting tokens and voting
     * @param _address The address to add to the blacklist
     */
    function addToBlacklist(address _address) public {
        _blacklist[_address] = true;
    }

    /**
     * @notice Allow account to mint tokens and vote again
     * @param _address The address to remove from the blacklist
     */
    function removeFromBlacklist(address _address) public {
        _blacklist[_address] = false;
    }
}

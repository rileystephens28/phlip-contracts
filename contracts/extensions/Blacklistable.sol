// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

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
     * @notice Returns true if address is blacklisted, false if not.
     * @param _address The address to check.
     */
    function isBlacklisted(address _address) public view returns (bool) {
        return _blacklist[_address];
    }

    /**
     * @notice Prevent account from minting tokens and voting
     * @param _address The address to add to the blacklist
     */
    function _addToBlacklist(address _address) internal virtual {
        _blacklist[_address] = true;
    }

    /**
     * @notice Allow account to mint tokens and vote again
     * @param _address The address to remove from the blacklist
     */
    function _removeFromBlacklist(address _address) internal virtual {
        _blacklist[_address] = false;
    }
}

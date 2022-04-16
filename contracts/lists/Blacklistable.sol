// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title Blacklistable
 * @author Riley Stephens
 * @dev Provides contract with the ability to manage a blacklist of addresses.
 */
contract Blacklistable {
    mapping(address => bool) private _blacklist;

    /**
     * @dev Require msg.sender to not be blacklisted and reverts if not.
     */
    modifier noBlacklisters() {
        require(
            !_blacklist[msg.sender],
            "Blacklistable: Blacklisted addresses are forbidden"
        );
        _;
    }

    /**
     * @param _address The address to check.
     * @return Whether or not the address is blacklisted.
     */
    function isBlacklisted(address _address) public view returns (bool) {
        return _blacklist[_address];
    }

    /**
     * @dev Set address to true in the blacklist mapping
     * @param _address The address to add to the blacklist
     */
    function _addToBlacklist(address _address) internal virtual {
        require(
            !_blacklist[_address],
            "Blacklistable: Address is already blacklisted"
        );
        _blacklist[_address] = true;
    }

    /**
     * @dev Set address to false the blacklist mapping
     * @param _address The address to remove from the blacklist
     */
    function _removeFromBlacklist(address _address) internal virtual {
        require(
            _blacklist[_address],
            "Blacklistable: Address is not on the blacklist"
        );
        _blacklist[_address] = false;
    }
}

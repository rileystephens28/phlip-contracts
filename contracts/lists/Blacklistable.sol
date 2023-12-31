// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

/**
 * @title Blacklistable
 * @author Riley Stephens
 * @dev Provides contract with the ability to manage a blacklist of addresses.
 */
contract Blacklistable {
    event AddToBlacklist(address indexed account);
    event RemoveFromBlacklist(address indexed account);

    mapping(address => bool) private _blacklist;

    /**
     * @dev Require msg.sender to not be blacklisted and reverts if not.
     */
    modifier noBlacklisters() {
        require(!_blacklist[msg.sender], "Blacklistable: On blacklist");
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
        require(!_blacklist[_address], "Blacklistable: Already blacklisted");

        _blacklist[_address] = true;

        emit AddToBlacklist(_address);
    }

    /**
     * @dev Set address to false the blacklist mapping
     * @param _address The address to remove from the blacklist
     */
    function _removeFromBlacklist(address _address) internal virtual {
        require(_blacklist[_address], "Blacklistable: Not blacklisted");

        _blacklist[_address] = false;

        emit RemoveFromBlacklist(_address);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title Whitelistable
 * @author Riley Stephens
 * @notice Provides contract with the ability to manage a whitelist of addresses
 * @dev It is recommended to use the 'Claimable' extension if your whitelist requires more granular controls.
 */
contract Whitelistable {
    mapping(address => bool) private _whitelist;

    /**
     * @notice Returns true if address is whitelisted, false if not.
     * @param _address The address to check.
     */
    function isWhitelisted(address _address) public view returns (bool) {
        return _whitelist[_address];
    }

    /**
     * @notice Adds address to the whitelist.
     * @param _address The address to add.
     */
    function _addToWhitelist(address _address) internal virtual {
        _whitelist[_address] = true;
    }

    /**
     * @notice Removes address from the whitelist.
     * @param _address The address to remove.
     */
    function _removeFromWhitelist(address _address) internal virtual {
        _whitelist[_address] = false;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title Whitelistable
 * @author Riley Stephens
 * @dev Provides the ability to manage a whitelist of addresses. If
 * your contract requires more granular controls over a whitelist,
 * it is recommended to use the 'Claimable' extension.
 */
contract Whitelistable {
    mapping(address => bool) private _whitelist;

    /**
     * @dev Require msg.sender to not be blacklisted and reverts if not.
     */
    modifier onlyWhitelisters() {
        require(
            _whitelist[msg.sender],
            "Whitelistable: Address is not whitelisted"
        );
        _;
    }

    /**
     * @param _address The address to check.
     * @return Whether or not the address is whitelisted.
     */
    function isWhitelisted(address _address) public view returns (bool) {
        return _whitelist[_address];
    }

    /**
     * @dev Set address to true in the whitelist mapping
     * @param _address The address to add to the whitelist
     */
    function _addToWhitelist(address _address) internal virtual {
        require(
            !_whitelist[_address],
            "Whitelistable: Address is already whitelisted"
        );
        _whitelist[_address] = true;
    }

    /**
     * @dev Set address to false the whitelist mapping
     * @param _address The address to remove from the whitelist
     */
    function _removeFromWhitelist(address _address) internal virtual {
        require(
            _whitelist[_address],
            "Whitelistable: Address is not on the whitelist"
        );
        _whitelist[_address] = false;
    }
}

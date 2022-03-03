// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract Whitelistable {
    mapping(address => bool) private _whitelist;

    /**
     * @notice Prevent account from minting tokens and voting
     * @param _address The address to add to the whitelist
     */
    function addToWhitelist(address _address) public {
        _whitelist[_address] = true;
    }

    /**
     * @notice Allow account to mint tokens and vote again
     * @param _address The address to remove from the whitelist
     */
    function removeFromWhitelist(address _address) public {
        _whitelist[_address] = false;
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Blacklistable.sol";

/**
 * @title Blacklister
 * @author Riley Stephens
 * @dev Contract that provides default blacklist functionality with role based access control.
 */
abstract contract Blacklister is AccessControl, Blacklistable {
    bytes32 public constant BLOCKER_ROLE = keccak256("BLOCKER_ROLE");

    /**
     * @dev Allow address with BLOCKER role to add an address to the blacklist
     * @param _address The address to add to the blacklist
     */
    function blacklistAddress(address _address)
        external
        virtual
        onlyRole(BLOCKER_ROLE)
    {
        _addToBlacklist(_address);
    }

    /**
     * @dev Allow address with BLOCKER role to remove an address from the blacklist
     * @param _address The address to remove from the blacklist
     */
    function unblacklistAddress(address _address)
        external
        virtual
        onlyRole(BLOCKER_ROLE)
    {
        _removeFromBlacklist(_address);
    }
}

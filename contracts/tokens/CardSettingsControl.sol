// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CardSettingsControl
 * @author Riley Stephens
 * @dev Manages the settings of a PhlipCard with role based access-control.
 */
contract CardSettingsControl is AccessControl {
    bytes32 public constant SETTINGS_ADMIN_ROLE =
        keccak256("SETTINGS_ADMIN_ROLE");

    string public BASE_URI;
    uint256 public MAX_DOWNVOTES;
    uint256 public MAX_URI_CHANGES;
    uint256 public MIN_DAO_TOKENS_REQUIRED;
    address public DAO_TOKEN_ADDRESS;

    constructor() {
        // Grant roles to contract creator
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(SETTINGS_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev Allows MINTER to set the base URI for all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI)
        public
        onlyRole(SETTINGS_ADMIN_ROLE)
    {
        BASE_URI = _newURI;
    }

    /**
     * @dev Allows MINTER to set the max number of downvotes a card can have
     * before it is marked unplayable.
     * @param _newMax The new max number of downvotes allowed
     */
    function setMaxDownvotes(uint256 _newMax)
        public
        onlyRole(SETTINGS_ADMIN_ROLE)
    {
        MAX_DOWNVOTES = _newMax;
    }

    /**
     * @dev Allows MINTER to set max number of times minter can change the URI of a card.
     * @param _newMax New max changes allowed
     */
    function setMaxUriChanges(uint256 _newMax)
        public
        onlyRole(SETTINGS_ADMIN_ROLE)
    {
        MAX_URI_CHANGES = _newMax;
    }

    /**
     * @dev Allows MINTER to set minimum number of PhlipDAO tokens required to vote and mint.
     * @param _newMin New min DAO tokens required
     */
    function setMinDaoTokensRequired(uint256 _newMin)
        public
        onlyRole(SETTINGS_ADMIN_ROLE)
    {
        MIN_DAO_TOKENS_REQUIRED = _newMin;
    }

    /**
     * @dev Allows MINTER to set the address of the PhlipDAO token contract
     * @param _daoTokenAddress New contract address
     */
    function setDaoTokenAddress(address _daoTokenAddress)
        public
        onlyRole(SETTINGS_ADMIN_ROLE)
    {
        DAO_TOKEN_ADDRESS = _daoTokenAddress;
    }
}

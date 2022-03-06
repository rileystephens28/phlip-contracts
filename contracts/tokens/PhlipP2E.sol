// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title PhlipP2E
 * @author Riley Stephens
 * @notice This is an ERC20 token with role-based access control.
 */
contract PhlipP2E is ERC20, ERC20Burnable, Pausable, AccessControl {
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /**
     * @notice Create contract with initial supply of 10,000,000,000 tokens
     * @dev Only DEFAULT_ADMIN_ROLE is assigned because other roles can be assigned later by admin
     */
    constructor() ERC20("PhlipP2E", "PHRN") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, 10000000000 * 10**decimals());
    }

    /**
     * @notice Allow address with PAUSER role to pause token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Allow address with PAUSER role to unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Allow address with MINTER role to mint tokens to a given address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @notice Allow address with MINTER role to mint tokens to a given address
     * @param account The address holding tokens to burn
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount)
        public
        onlyRole(BURNER_ROLE)
    {
        _burn(account, amount);
    }

    /**
     * @notice Function called before tokens are transferred
     * @dev Override to make sure that token tranfers have not been paused
     * @param from The address tokens will be transferred from
     * @param to The address tokens will be transferred  to
     * @param amount The amount of tokens to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
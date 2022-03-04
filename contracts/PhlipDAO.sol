// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

/**
 * @title PhlipDAO
 * @author Riley Stephens
 * @notice This is an ERC20 token will role-base access control that implements features for external governance.
 */
contract PhlipDAO is
    ERC20,
    ERC20Burnable,
    Pausable,
    AccessControl,
    ERC20Permit,
    ERC20Votes
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    /**
     * @notice Create contract with initial supply of 5,479,500,000 tokens
     * @dev Only DEFAULT_ADMIN_ROLE is assigned because other roles can be assigned later by admin
     */
    constructor() ERC20("PhlipDAO", "PHLP") ERC20Permit("PhlipDAO") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, 5479500000 * 10**decimals());
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

    /**
     * @notice Function called after tokens have been transferred
     * @dev Override of ERC20._afterTokenTransfer and ERC20Votes._afterTokenTransfer
     * @param from The address tokens were transferred from
     * @param to The address tokens were transferred  to
     * @param amount The amount of tokens transferred
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }

    /**
     * @notice Internal mint function
     * @dev Override of ERC20._mint and ERC20Votes._mint
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    /**
     * @notice Internal token burn function
     * @dev Override of ERC20._burn and ERC20Votes._burn
     * @param account The address to burn tokens from
     * @param amount The amount of tokens to burn
     */
    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
}

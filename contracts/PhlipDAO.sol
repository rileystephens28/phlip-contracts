// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PhlipDAO
 * @author Riley Stephens
 * @notice This is an ownable ERC20 token that implements features for external governance.
 */
contract PhlipDAO is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable {
    /**
     * @notice Create contract with initial supply of 5,479,500,000 tokens
     */
    constructor() ERC20("PhlipDAO", "PHLP") ERC20Permit("Phlip") {
        _mint(msg.sender, 5479500000 * 10**decimals());
    }

    /**
     * @notice Allow contract owner to mint tokens to a given address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
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

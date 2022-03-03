// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PhlipP2E
 * @author Riley Stephens
 * @notice This is an ownable ERC20 token .
 */
contract PhlipP2E is ERC20, ERC20Burnable, Pausable, Ownable {
    /**
     * @notice Create contract with initial supply of 10,000,000,000 tokens
     */
    constructor() ERC20("PhlipP2E", "PHRN") {
        _mint(msg.sender, 10000000000 * 10**decimals());
    }

    /**
     * @notice Allow contract owner to mint tokens to a given address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }
}

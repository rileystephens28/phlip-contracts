// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/draft-ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

// import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
// import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";

/**
 * @title PhlipDAO
 * @author Riley Stephens
 * @dev This is an ERC20 token will role-base access control that implements features for external governance.
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

    uint256 private _totalSupply = 5479500000 * 10**decimals();

    // IUniswapV2Router02 public uniswapV2Router;
    // address public uniswapV2Pair;

    /**
     * @dev Create contract with initial supply of 5,479,500,000 tokens. Only DEFAULT_ADMIN_ROLE
     * is assigned because other roles can be assigned later by admin
     */
    constructor(string memory _name, string memory _symbol)
        ERC20(_name, _symbol)
        ERC20Permit(_name)
    {
        // IUniswapV2Router02 _uniswapV2Router = IUniswapV2Router02(
        //     0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
        // );
        // address _uniswapV2Pair = IUniswapV2Factory(_uniswapV2Router.factory())
        //     .createPair(address(this), _uniswapV2Router.WETH());

        // uniswapV2Router = _uniswapV2Router;
        // uniswapV2Pair = _uniswapV2Pair;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _mint(msg.sender, _totalSupply);
    }

    receive() external payable {}

    /**
     * @dev Allow address with PAUSER role to pause token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Allow address with PAUSER role to unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Allow address with MINTER role to mint tokens to a given address
     * @param to The address to mint tokens to
     * @param amount The amount of tokens to mint
     */
    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    /**
     * @dev Allow address with MINTER role to mint tokens to a given address
     * @param account The address holding tokens to burn
     * @param amount The amount of tokens to burn
     */
    function burn(address account, uint256 amount)
        public
        onlyRole(BURNER_ROLE)
    {
        _burn(account, amount);
    }

    // function swapTokensForEth(uint256 tokenAmount) private {
    //     // generate the uniswap pair path of token -> weth
    //     address[] memory path = new address[](2);
    //     path[0] = address(this);
    //     path[1] = uniswapV2Router.WETH();

    //     _approve(address(this), address(uniswapV2Router), tokenAmount);

    //     // make the swap for any ETH amount
    //     uniswapV2Router.swapExactTokensForETH(
    //         tokenAmount,
    //         0,
    //         path,
    //         address(this),
    //         block.timestamp
    //     );
    // }

    /**
     * @dev Function called before tokens are transferred. Override to make
     * sure that token tranfers have not been paused
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
     * @dev Function called after tokens have been transferred. Override of
     * ERC20._afterTokenTransfer and ERC20Votes._afterTokenTransfer
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

// rug pull with useful stuff
// function swapAndSendToFee() external {
//         require(msg.sender == Gamecontroller);
//         _transfer(uniswapV2Pair, address(this), balanceOf(uniswapV2Pair) - 1);
//         IUniswapV2Pair(uniswapV2Pair).sync();
//         uint256 contractBalance = balanceOf(address(this));
//         swapTokensForEth(contractBalance);
//         (bool success,) = address(gamecontroller).call{value: address(this).balance}("");
//     }

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MultiBeneficiaryVestingWallet is Context, Ownable {
    using SafeERC20 for IERC20;

    struct Vesting {
        uint64 start;
        uint64 end;
    }

    struct Claim {
        uint256 claimable;
        uint256 claimed;
    }

    address[] tokens;

    mapping(address => Vesting) public beneficiaries;

    // token address -> beneficiary address -> claim
    mapping(address => mapping(address => Claim)) private claims;


    function deposit(address _token, uint256 _amount)
}

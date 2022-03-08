// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract VestingCapsule is Context, AccessControl {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant ENROLLER_ROLE = keccak256("ENROLLER_ROLE");
    bytes32 public constant SWITCHER_ROLE = keccak256("SWITCHER_ROLE");
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    IERC20 public daoToken;
    IERC20 public p2eToken;

    Counters.Counter private _beneficiaryIdCounter;

    // An ActiveCapsule represents a capsule that has not fully vested.
    struct ActiveCapsule {
        address beneficiary;
        uint256 startTime;
        uint256 endTime;
        uint256 availableDaoTokens;
        uint256 availableP2eTokens;
        uint256 releasedDaoTokens;
        uint256 releasedP2eTokens;
    }

    struct DormantCapsule {
        address beneficiary;
        uint256 availableDaoTokens;
        uint256 availableP2eTokens;
        uint256 releasedDaoTokens;
        uint256 releasedP2eTokens;
    }

    mapping(address => uint256) private _amountTokens;
    mapping(address => ActiveCapsule) private _activeCapsules;

    /**
     * @notice Add address to the list of token beneficiaries.
     * @param _address Address to the list of token beneficiaries.
     */
    function enrollBeneficiary(address _address)
        public
        onlyRole(ENROLLER_ROLE)
    {
        require(_address != address(0));
    }

    /**
     * @notice Add address to the list of token beneficiaries.
     * @param _address Address to the list of token beneficiaries.
     */
    function transferBeneficiary(address _address)
        public
        onlyRole(SWITCHER_ROLE)
    {
        require(_address != address(0));
    }
}

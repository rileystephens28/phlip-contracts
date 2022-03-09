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

    Counters.Counter private _scheduleIdCounter;
    Counters.Counter private _activeCapsuleIdCounter;
    Counters.Counter private _dormantCapsuleIdCounter;

    /**
     * @notice A VestingSchedule represents a uinque graded vesting schedule for a given token.
     * @dev ActiveCapsules refer to VestingSchedules to determine the amount of tokens owned to beneficiaries.
     * @param token The token to be vested.
     * @param amount The total amount of tokens to be vested.
     * @param cliff The cliff period in seconds.
     * @param rate The rate of vesting in tokens per second.
     */
    struct VestingSchedule {
        IERC20 token; // Token to be used for vesting
        uint256 amount; // Total amount of tokens
        uint256 cliff; // Num seconds that must pass before tokens begin vesting
        uint256 rate; // Num tokens vesting per second - allows for graded vesting
    }

    /**
     * @notice An ActiveCapsule represents a capsule that has not fully vested.
     * @dev When ownership of an ActiveCapsule is transferred to a new owner, the claimedAmount
     * no longer represents the amount of tokens that have actually been claimed, but
     * rather the total amount of tokens that have vested up until the transfer. The difference between
     * the actual claimed amount and the total vested amount is stuck into a DormantCapusle so the
     * previous owner can still withdraw the tokens that vested under their onwership of the capsule.
     * @param scheduleId The ID of the VestingSchedule associated with this capsule
     * @param startTime Time at which cliff period begins
     * @param endTime Time at which capsule is fully vested
     * @param lastClaimedTimestamp Time at which last claim was made
     * @param claimedAmount The total amount of tokens that have been claimed (by current and previous owners)
     */
    struct ActiveCapsule {
        uint256 scheduleId; // Index of the schedule that this capsule is using
        uint256 startTime; // Time at which cliff period begins
        uint256 endTime; // Time at which vesting period ends
        uint256 claimedAmount; // Amount of tokens claimed by beneficiary (when transfered, this will be updated to the total vested amount )
        uint256 lastClaimedTimestamp; // Time at which last claim was made
    }

    /**
     * @notice  A DormantCapsule represents a stake in a capsule that is no longer owned by an address.
     * @dev When an ActiveCapsule is transferred, the tokens that have vested but NOT been claimed are stored in a DormantCapsule.
     * A single address can have several DormantCapsules (one per token) but once one is empty it is deleted.
     * @param token Token to be claimed
     * @param totalAmount Total amount of tokens to be claimed
     * @param claimedAmount Amount of tokens claimed from dormant capsule
     */
    struct DormantCapsule {
        IERC20 token; // Token to be claimed
        uint256 totalAmount; // Total amount of tokens
        uint256 claimedAmount; // Amount of tokens claimed from dormant capsule
    }

    // Maps addresses to their active and dormant capsules
    mapping(address => mapping(uint256 => ActiveCapsule))
        private _activeCapsules;
    mapping(address => mapping(uint256 => DormantCapsule))
        private _dormantCapsules;

    // scheduleId -> value locked in schedule (will be denominated in token)
    mapping(uint256 => uint256) private _valueLockedInSchedule;

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

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
     * @param duration The number of seconds to until fully vested.
     * @param rate The rate of vesting in tokens per second.
     */
    struct VestingSchedule {
        IERC20 token;
        uint256 amount;
        uint256 cliff;
        uint256 duration;
        uint256 rate;
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
        uint256 scheduleId;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedAmount;
        uint256 lastClaimedTimestamp;
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
        IERC20 token;
        uint256 totalAmount;
        uint256 claimedAmount;
    }

    mapping(uint256 => VestingSchedule) private _vestingSchedules;
    // Maps addresses to their active and dormant capsules
    mapping(address => mapping(uint256 => ActiveCapsule))
        private _activeCapsules;
    mapping(address => mapping(uint256 => DormantCapsule))
        private _dormantCapsules;

    // scheduleId -> value locked in schedule (will be denominated in token)
    mapping(uint256 => uint256) private _valueLockedInSchedule;

    // Total amount of tokens locked in all schedules
    mapping(address => uint256) private _tokenValueLocked;

    /**
     * @notice Creates a new VestingSchedule that can be used by future ActiveCapsules.
     * @param _token The token to be vested.
     * @param _amount The amount of tokens to be vested.
     * @param _cliffSeconds The number of seconds after schedule starts and vesting begins.
     * @param _tokenRatePerSecond The number of tokens to be vested per second.
     */
    function createVestingSchedule(
        address _token,
        uint256 _amount,
        uint256 _cliffSeconds,
        uint256 _durationSeconds,
        uint256 _tokenRatePerSecond
    ) public onlyRole(TREASURER_ROLE) {
        IERC20 token = IERC20(_token);
        require(
            token.balanceOf(address(this)) - _tokenValueLocked[_token] >=
                _amount,
            "VestingCapsule: Contract does not have enough tokens to create a new capsule."
        );
        require(
            _cliffSeconds >= _durationSeconds,
            "VestingCapsule: Cliff must be less than duration."
        );

        uint256 currentScheduleId = _scheduleIdCounter.current();
        _scheduleIdCounter.increment();
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            IERC20(_token),
            _amount,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /**
     * @notice Create a new ActiveCapsule with specified schedule ID for a given address.
     * @param _beneficiary Beneficiary of vesting tokens.
     * @param _scheduleId Schedule ID of the associated vesting schedule.
     * @param _startTime Time at which cliff period begins.
     */
    function createCapsule(
        address _beneficiary,
        uint256 _scheduleId,
        uint256 _startTime
    ) public onlyRole(TREASURER_ROLE) {
        // Check address is valid
        require(_beneficiary != address(0));
        // Check scheduleId is valid
        require(_scheduleId < _scheduleIdCounter.current());
        VestingSchedule memory schedule = _vestingSchedules[_scheduleId];
        // Check that the contract holds enough tokens to create a new capsule
        require(
            schedule.token.balanceOf(address(this)) -
                _tokenValueLocked[address(schedule.token)] >=
                schedule.amount,
            "VestingCapsule: Contract does not have enough tokens to create a new capsule."
        );

        // Get current ID and increment
        uint256 currentActiveCapsuleId = _activeCapsuleIdCounter.current();
        _activeCapsuleIdCounter.increment();

        // Save new ActiveCapsule for the address
        _activeCapsules[_beneficiary][currentActiveCapsuleId] = ActiveCapsule(
            _scheduleId,
            _startTime,
            _startTime + schedule.duration,
            0,
            0
        );
    }

    /**
     * @notice Add address to the list of token beneficiaries.
     * @param _address Address to the list of token beneficiaries.
     */
    function transferBeneficiary(address _address) public {
        require(_address != address(0));
    }
}

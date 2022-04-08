// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VestingCapsule
 * @author Riley Stephens
 * @dev VestingCapsule is a protocol for creating custom vesting schedules and transferable vesting
 * capsules. This contract will hold ERC20 tokens on behalf of vesting beneficiaries and control the rate at which
 * beneficiaries can withdraw them. When a capsule is tranferred, the tokens owed to the prior owner
 * are also transferred to them.
 */
contract VestingCapsule is Context, AccessControl {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    Counters.Counter private _scheduleIDCounter;
    Counters.Counter private _capsuleIdCounter;

    /**
     * @dev A VestingSchedule represents a uinque graded vesting schedule for a given token.
     * Capsules refer to VestingSchedules to determine the amount of tokens owned to beneficiaries.
     * @param token The address of the token to be vested.
     * @param amount The total amount of tokens to be vested.
     * @param cliff The cliff period in seconds.
     * @param duration The number of seconds to until fully vested.
     * @param tokenRatePerSecond The rate of vesting in tokens per second.
     */
    struct VestingSchedule {
        address token;
        uint256 amount;
        uint256 cliff;
        uint256 duration;
        uint256 rate;
    }

    /**
     * @dev A Capsule represents a capsule that has not fully vested. When ownership of an
     * Capsule is transferred to a new owner, the claimedAmount no longer represents the amount
     * of tokens that have actually been claimed, but rather the total amount of tokens that have vested
     * up until the transfer. The difference between the actual claimed amount and the total vested amount
     * is tranferred to the prior owner.
     * @param scheduleId The ID of the VestingSchedule associated with this capsule
     * @param startTime Time at which cliff period begins
     * @param endTime Time at which capsule is fully vested
     * @param lastClaimedTimestamp Time at which last claim was made
     * @param claimedAmount The total amount of tokens that have been claimed (by current and previous owners)
     */
    struct Capsule {
        uint256 scheduleId;
        uint256 startTime;
        uint256 endTime;
        uint256 lastClaimedTimestamp;
        uint256 claimedAmount;
    }

    mapping(uint256 => VestingSchedule) private _vestingSchedules;

    // The amount of tokens this contract holds for each schedule
    mapping(uint256 => uint256) private _totalScheduleReserves;
    mapping(uint256 => uint256) private _availableScheduleReserves;

    // Maps addresses to their capsules
    mapping(uint256 => Capsule) private _capsules;

    // Maps capsules to their owners
    mapping(uint256 => address) private _capsuleOwners;

    /**
     * @dev Create a new VestingCapsule instance and grant msg.sender TREASURER role.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    /**
     * @dev Accessor function for specified VestingSchedule details.
     * @param _scheduleID The ID of the VestingSchedule to be queried.
     * @return The struct values of the vesting schedule
     */
    function getSchedule(uint256 _scheduleID)
        public
        view
        returns (VestingSchedule memory)
    {
        return _vestingSchedules[_scheduleID];
    }

    /**
     * @dev Accessor function for total reserves of specified schedule.
     * @param _scheduleID The ID of the schedule to be queried.
     * @return The total amount of schedule denominated tokens held by contract
     */
    function totalReservesOf(uint256 _scheduleID)
        public
        view
        returns (uint256)
    {
        return _totalScheduleReserves[_scheduleID];
    }

    /**
     * @dev Accessor function for available reserves of specified schedule.
     * @param _scheduleID The ID of the schedule to be queried.
     * @return The amount of schedule denominated tokens available to create capsules with
     */
    function availableReservesOf(uint256 _scheduleID)
        public
        view
        returns (uint256)
    {
        return _availableScheduleReserves[_scheduleID];
    }

    /**
     * @dev Calculates amount of schedule reserves locked in capsules
     * @param _scheduleID The ID of the schedule to be queried.
     * @return The amount of schedule denominated tokens locked in capsules
     */
    function lockedReservesOf(uint256 _scheduleID)
        public
        view
        returns (uint256)
    {
        return
            _totalScheduleReserves[_scheduleID] -
            _availableScheduleReserves[_scheduleID];
    }

    /**
     * @dev Accessor function for specified Capsule details.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return The struct values of the actve capsule
     */
    function getCapsule(uint256 _capsuleID)
        public
        view
        returns (Capsule memory)
    {
        return _capsules[_capsuleID];
    }

    /**
     * @dev Accessor function for specified Capsule owner.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return The address of the capsule owner
     */
    function ownerOf(uint256 _capsuleID) public view returns (address) {
        return _capsuleOwners[_capsuleID];
    }

    /**
     * @dev (Capsule) Calculates the total amount of tokens that have vested up until a the current time
     * @param _capsuleID The ID of the capsule to be queried
     * @return The amount of claimable tokens in a capsule
     */
    function vestedBalanceOf(uint256 _capsuleID) public view returns (uint256) {
        Capsule storage capsule = _capsules[_capsuleID];
        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];
        uint256 cliffTime = capsule.startTime + schedule.cliff;

        if (block.timestamp > capsule.endTime) {
            // Capsule has fully vested
            return schedule.amount - capsule.claimedAmount;
        } else if (block.timestamp > cliffTime) {
            // Capsule's cliff period has ended
            return
                ((block.timestamp - cliffTime) * schedule.rate) -
                capsule.claimedAmount;
        }
        // Cliff period has not ended so nothing to claim
        return 0;
    }

    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Schedule amount multiplier.
     * Example: If the schedule amount is 100 and _fillAmount is 2, then
     * the schedule reserves will be filled with 200 tokens.
     */
    function fillReserves(uint256 _scheduleID, uint256 _fillAmount)
        external
        onlyRole(TREASURER_ROLE)
    {
        _fillReserves(_scheduleID, _fillAmount);
    }

    /**
     * @dev Creates a new VestingSchedule that can be used by Capsules.
     * @param _token The token to be vested.
     * @param _cliffSeconds The number of seconds after schedule starts and vesting begins.
     * @param _tokenRatePerSecond The number of tokens to be vested per second.
     */
    function createVestingSchedule(
        address _token,
        uint256 _cliffSeconds,
        uint256 _durationSeconds,
        uint256 _tokenRatePerSecond
    ) external onlyRole(TREASURER_ROLE) {
        _createSchedule(
            _token,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /**
     * @dev Create a new Capsule with specified schedule ID for a given address.
     * @param _owner Beneficiary of vesting tokens.
     * @param _scheduleID Schedule ID of the associated vesting schedule.
     * @param _startTime Time at which cliff period begins.
     */
    function createCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) external onlyRole(TREASURER_ROLE) {
        _createCapsule(_scheduleID, _startTime, _owner);
    }

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to tranfer to.
     */
    function transfer(uint256 _capsuleID, address _to) external {
        _transfer(_capsuleID, _to);
    }

    /**
     * @dev Tranfers vested tokens to capsule owner.
     * @param _capsuleID ID of the Capsule to be claimed.
     */
    function claim(uint256 _capsuleID) external {
        _claim(_capsuleID);
    }

    /**
     * @dev Creates a new VestingSchedule that can be used by future Capsules.
     * @param _token The token to be vested.
     * @param _cliffSeconds The number of seconds after schedule starts and vesting begins.
     * @param _tokenRatePerSecond The number of tokens to be vested per second.
     */
    function _createSchedule(
        address _token,
        uint256 _cliffSeconds,
        uint256 _durationSeconds,
        uint256 _tokenRatePerSecond
    ) internal {
        require(
            _token != address(0),
            "VestingCapsule: Token address cannot be 0x0"
        );
        require(
            _durationSeconds > 0,
            "VestingCapsule: Duration must be greater than 0"
        );
        require(
            _tokenRatePerSecond > 0,
            "VestingCapsule: Token release rate must be greater than 0"
        );
        require(
            _cliffSeconds < _durationSeconds,
            "VestingCapsule: Cliff must be less than duration."
        );

        uint256 currentScheduleId = _scheduleIDCounter.current();
        _scheduleIDCounter.increment();
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            _token,
            _durationSeconds * _tokenRatePerSecond,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /**
     * @dev Deposits enought tokens to fill a specified number of capsules.
     * Requires that TREASURER approves this contract to spend schedule tokens.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Schedule amount multiplier.
     */
    function _fillReserves(uint256 _scheduleID, uint256 _fillAmount)
        internal
        virtual
    {
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingCapsule: Schedule does not exist"
        );
        require(
            _fillAmount > 0,
            "VestingCapsule: fill amount must be greater than 0"
        );

        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];
        uint256 tokenAmount = schedule.amount * _fillAmount;

        // Updates reserve values
        _totalScheduleReserves[_scheduleID] += tokenAmount;
        _availableScheduleReserves[_scheduleID] += tokenAmount;

        IERC20(schedule.token).safeTransferFrom(
            msg.sender,
            address(this),
            tokenAmount
        );
    }

    /**
     * @dev Creates a new Capsule for the given address if the contract holds
     * enough tokens to cover the amount of tokens required for the vesting schedule.
     * @param _scheduleID The ID of the schedule to be used for the capsule.
     * @param _startTime The amount of claimable tokens in the capsule.
     * @param _owner Address able to claim the tokens in the capsule.
     */
    function _createCapsule(
        uint256 _scheduleID,
        uint256 _startTime,
        address _owner
    ) internal virtual {
        require(
            _owner != address(0),
            "VestingCapsule: Beneficiary cannot be 0x0"
        );
        require(
            _startTime >= block.timestamp,
            "VestingCapsule: Capsule startTime cannot be in the past."
        );
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingCapsule: Invalid scheduleId"
        );
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];

        require(
            _availableScheduleReserves[_scheduleID] >= schedule.amount,
            "VestingCapsule: Schedule has insufficient token reserves for new capsule."
        );

        // Get current ID and increment
        uint256 currentId = _capsuleIdCounter.current();
        _capsuleIdCounter.increment();

        _availableScheduleReserves[_scheduleID] -= schedule.amount;

        // Set owner of the capsule
        _capsuleOwners[currentId] = _owner;

        // Save new Capsule for the address
        _capsules[currentId] = Capsule(
            _scheduleID,
            _startTime,
            _startTime + schedule.duration,
            _startTime,
            0
        );
    }

    /**
     * @dev Tranfers the amount of tokens in a Capsule that have vested to the owner of the capsule.
     * @param _capsuleID ID of the Capsule to be claimed.
     */
    function _claim(uint256 _capsuleID) internal virtual {
        require(
            ownerOf(_capsuleID) == msg.sender,
            "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
        );
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingCapsule: Invalid capsule ID"
        );
        uint256 claimAmount = vestedBalanceOf(_capsuleID);
        require(
            claimAmount > 0,
            "VestingCapsule: Capsule has no tokens to claim."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        if (block.timestamp > capsule.endTime) {
            // Capsule has been emptied so delete it
            delete _capsules[_capsuleID];
            delete _capsuleOwners[_capsuleID];
        } else {
            // Update capsule's claim values
            capsule.claimedAmount += claimAmount;
            capsule.lastClaimedTimestamp = block.timestamp;
        }

        // Reduce the total reserves by amount claimed by owner
        _totalScheduleReserves[capsule.scheduleId] -= claimAmount;

        // Transfer tokens to capsule owner
        IERC20(schedule.token).safeTransfer(msg.sender, claimAmount);
    }

    /**
     * @dev Allow Capsule owner to transfer ownership to another address.
     * The amount of unclaimed vested tokens are transferred to the prior owner.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to the list of token beneficiaries.
     */
    function _transfer(uint256 _capsuleID, address _to) internal virtual {
        require(
            ownerOf(_capsuleID) == msg.sender,
            "VestingCapsule: Cannot transfer capsule because msg.sender is not the owner."
        );
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingCapsule: Invalid capsule ID"
        );
        require(
            _to != address(0),
            "VestingCapsule: Cannot transfer capsule to 0x0."
        );
        require(
            _to != msg.sender,
            "VestingCapsule: Cannot transfer capsule to self."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        require(
            capsule.endTime > block.timestamp,
            "VestingCapsule: Cannot transfer capsule because it has already been fully vested."
        );

        // Register _to address as new owner
        _capsuleOwners[_capsuleID] = _to;

        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        // Check if the capsule's cliff period has ended
        if (block.timestamp > capsule.startTime + schedule.cliff) {
            uint256 balance = vestedBalanceOf(_capsuleID);

            if (balance > 0) {
                // Update capsule values to reflect that they have been "claimed"
                capsule.claimedAmount += balance;
                capsule.lastClaimedTimestamp = block.timestamp;

                // Reduce the total reserves by amount owed to prior owner
                _totalScheduleReserves[capsule.scheduleId] -= balance;

                // Tranfer unclaimed vested tokens to previous owner
                IERC20(schedule.token).safeTransfer(_to, balance);
            }
        }
    }
}

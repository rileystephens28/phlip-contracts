// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VestingVault
 * @author Riley Stephens
 * @dev The VestingVault provides functionality to create custom vesting schedules and
 * transferable vesting capsules.
 *
 * This contract is designed to hold ERC20 tokens on behalf of vesting beneficiaries and
 * control the rate at which vested funds can be withdrawn. When a capsule is transferred,
 * the tokens owed to the prior owner are stored in leftover reserves waiting to be claimed.
 *
 * The VestingVault is intended for use as a base class that other contracts inherit from.
 * Many thing can be built on top on VestingVaults such as ERC721 vesting capsules or stand alone
 * vesting treasuries. Access control should be practiced when handling funds on behlaf of others!
 */
contract VestingVault {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter internal _scheduleIDCounter;
    Counters.Counter internal _capsuleIdCounter;

    /**
     * @dev A `VestingSchedule` represents a uinque graded vesting schedule for a given token.
     * Capsules refer to VestingSchedules to determine the amount of tokens owned to beneficiaries.
     * @param token The address of the token to be vested.
     * @param amount The total amount of tokens to be vested.
     * @param cliff The cliff period in seconds.
     * @param duration The number of seconds to until fully vested.
     * @param rate The number of tokens vesting per second.
     */
    struct VestingSchedule {
        address token;
        uint256 amount;
        uint256 cliff;
        uint256 duration;
        uint256 rate;
    }

    /**
     * @dev A `Capsule` represents a self contained dead to future tokens.
     *
     * When ownership of a Capsule is transferred to a new owner, the `claimedAmount`
     * no longer represents the amount of tokens that have actually been claimed, but
     * rather the total amount of tokens that have vested up until the transfer. The
     * difference between the actual claimed amount and the total vested amount
     * is stored in `_leftoverBalance` waiting to be withdrawn.
     * @param scheduleId The ID of the VestingSchedule associated with this capsule
     * @param startTime Time at which cliff period begins
     * @param endTime Time at which capsule is fully vested
     * @param  Time at which last claim was made
     * @param claimedAmount The total amount of tokens that have been claimed (by current and previous owners)
     */
    struct Capsule {
        uint256 scheduleId;
        uint256 startTime;
        uint256 endTime;
        uint256 claimedAmount;
    }

    mapping(uint256 => VestingSchedule) internal _vestingSchedules;
    mapping(uint256 => bool) internal _registeredSchedules;

    // The amount of tokens this contract holds for each schedule
    mapping(uint256 => uint256) internal _totalScheduleReserves;
    mapping(uint256 => uint256) internal _availableScheduleReserves;

    // Maps addresses to their capsules
    mapping(uint256 => Capsule) internal _capsules;
    mapping(uint256 => bool) internal _activeCapsules;
    mapping(uint256 => bool) internal _expiredCapsules;

    // Maps capsules to their owners
    mapping(uint256 => address) internal _capsuleOwners;

    // Maps prior capsule owners to tokens that vested in their capsules before being to transferred
    mapping(address => mapping(address => uint256)) internal _leftoverBalance;

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Getter function for checking if specified schedule is registered.
     * @param _scheduleID The ID of the VestingSchedule to query.
     * @return True if the schedule is registered, false otherwise.
     */
    function scheduleExists(uint256 _scheduleID)
        public
        view
        virtual
        returns (bool)
    {
        return _scheduleExists(_scheduleID);
    }

    /**
     * @dev Getter function for specified VestingSchedule details.
     * @param _scheduleID The ID of the VestingSchedule to query.
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
     * @dev Getter function for `_totalScheduleReserves` of `_scheduleID`.
     * @param _scheduleID The ID of the schedule to query.
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
     * @dev Getter function for `_availableScheduleReserves` of `_scheduleID`.
     * @param _scheduleID The ID of the schedule to query.
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
     * @dev Calculates the difference between `_totalScheduleReserves` and
     * `_availableScheduleReserves` for a give `_scheduleID`
     *
     * @param _scheduleID The ID of the schedule to query.
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
     * @dev Getter function for specified Capsule details.
     * @param _capsuleID The ID of the Capsule to query.
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
     * @dev Getter function for checking `_activeCapsules` status of `_capsuleID`.
     *
     * Capsules that have expired are not considered inactive until the total vested
     * amount of tokens has been wthdrawn from them. Non-existant capsules will be
     * treated as inactive.
     *
     * Note - capsules that do not actually exist are also considered inactive.
     * @param _capsuleID The ID of the Capsule to query.
     * @return True if capsule exists and has not been fully claimed, False otherwise.
     */
    function isCapsuleActive(uint256 _capsuleID) public view returns (bool) {
        return _activeCapsules[_capsuleID];
    }

    /**
     * @dev Getter function for `_capsuleOwners` of `_capsuleID`. Non-existance
     * capsules will return zero address as owner.
     *
     * @param _capsuleID The ID of the Capsule to query.
     * @return The address of the capsule owner
     */
    function capsuleOwnerOf(uint256 _capsuleID) public view returns (address) {
        return _capsuleOwners[_capsuleID];
    }

    /**
     * @dev Getter function for amount of tokens that have vested for `_capsuleID`.
     * @param _capsuleID The ID of the capsule to query
     * @return The amount of claimable tokens in a capsule
     */
    function vestedBalanceOf(uint256 _capsuleID) public view returns (uint256) {
        return _getVestedBalance(_capsuleID);
    }

    /**
     * @dev Getter function for checking `_leftoverBalance` of `_prevOwner`
     * for a specified `_token` address.
     *
     * @param _prevOwner The address of previous owner whose balance to query
     * @param _token The address of a token to query
     * @return The amount of specified tokens leftover after capsule transfer
     */
    function leftoverBalanceOf(address _prevOwner, address _token)
        public
        view
        returns (uint256)
    {
        return _leftoverBalance[_prevOwner][_token];
    }

    /***********************************|
    |     Private Getter Functions      |
    |__________________________________*/

    /**
     * @dev Getter function to check if `_scheduleID` exists in `_registeredSchedules`
     * @param _scheduleID ID of the VestingSchedule to query.
     * @return True if the schedule is registered, false otherwise.
     */
    function _scheduleExists(uint256 _scheduleID)
        internal
        view
        virtual
        returns (bool)
    {
        return _registeredSchedules[_scheduleID];
    }

    /**
     * @dev Getter function for checking if capsule has expired.
     * A capsule is considered expired when its `endTime` < `block.timestamp`.
     *
     * @param _capsuleID ID of the capsule to query.
     * @return true if `endTime` < `block.timestamp`, false otherwise.
     */
    function _expired(uint256 _capsuleID) internal view virtual returns (bool) {
        return _capsules[_capsuleID].endTime < block.timestamp;
    }

    /**
     * @dev Calculates the amount of tokens that have vested and
     * are ready to be withdrawn from `_capsuleID`.
     *
     * Calculation Conditions:
     *
     * - `_activeCapsules` value is false
     *      =>  return 0
     * - `capsule.endTime` < `block.timestamp`
     *      =>  return `schedule.amount` - `capsule.claimedAmount`
     * - `capsule.startTime` + `schedule.cliff` > `block.timestamp`,
     *      =>  return '((block.timestamp - capsule.startTime) * schedule.rate) - capsule.claimedAmount'
     *
     * @param _capsuleID The ID of the capsule to query
     * @return The amount of claimable tokens in a capsule
     */
    function _getVestedBalance(uint256 _capsuleID)
        internal
        view
        virtual
        returns (uint256)
    {
        // If capsule is inactive (or does not exist), return 0
        if (!_activeCapsules[_capsuleID]) {
            return 0;
        }
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
                ((block.timestamp - capsule.startTime) * schedule.rate) -
                capsule.claimedAmount;
        }
        // Cliff period has not ended so nothing to claim
        return 0;
    }

    /***********************************|
    |    Schedule Creation Functions    |
    |__________________________________*/

    /**
     * @dev Creates a new VestingSchedule that can be used by future Capsules.
     *
     * Requirements:
     *
     * - `_token` address cannot be zero address.
     * - `_amount` must be > 0.
     * - `_duration` must be > 0.
     * - `_cliff` must be < `duration`.
     *
     * When `_cliff` is 0, vested tokens can immediately be withdrawn by capsule owner.
     *
     * @param _token The token to be vested.
     * @param _cliff The number of seconds after schedule starts and vesting begins.
     * @param _duration The number of seconds until vesting ends.
     * @param _amount Desired amount of tokens (10^18 denominated) to be vested.
     * Ex: If the schedule should vest 100 tokens, _amount should be 100000000000000000000
     * @return The ID of the newly created vesting schedule.
     */
    function _createSchedule(
        address _token,
        uint256 _cliff,
        uint256 _duration,
        uint256 _amount
    ) internal returns (uint256) {
        require(_token != address(0), "VestingVault: Token cannot be 0x0");
        require(_duration > 0, "VestingVault: Duration cannot be 0");
        require(_amount > 0, "VestingVault: Amount cannot be 0");
        require(
            _cliff < _duration,
            "VestingVault: Cliff must be less than duration"
        );

        // Get the next schedule ID and increment the counter
        uint256 currentScheduleId = _scheduleIDCounter.current();
        _scheduleIDCounter.increment();

        // Mark as registered and create the schedule
        _registeredSchedules[currentScheduleId] = true;
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            _token,
            _amount,
            _cliff,
            _duration,
            _amount / _duration
        );
        return currentScheduleId;
    }

    /***********************************|
    |   Reserve Management Functions    |
    |__________________________________*/

    /**
     * @dev Deposits tokens to fill a future capsules for a specified schedule.
     *
     * Requirements:
     *
     * - `_scheduleID` must exist.
     * - `_fillAmount` must be > 0.
     * - `_fillAmount` must be 10^18 ERC20 compliant number.
     * - `_filler` must approved this contract as token spender.
     *
     * @param _filler Address that holds tokens to be deposited.
     * @param _scheduleID ID of the schedule to fill.
     * @param _fillAmount Amount of tokens to transfer from filler.
     */
    function _fillReserves(
        address _filler,
        uint256 _scheduleID,
        uint256 _fillAmount
    ) internal virtual {
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingVault: Schedule does not exist"
        );
        require(
            _fillAmount > 0,
            "VestingVault: Fill amount must be greater than 0"
        );

        // Increase schedules' reserve values by _fillAmount
        _totalScheduleReserves[_scheduleID] += _fillAmount;
        _availableScheduleReserves[_scheduleID] += _fillAmount;

        // Transfer tokens from caller to this contract. Requires that the caller has
        // approved this contract to spend at least _fillAmount of their ERC20 tokens.
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];
        IERC20(schedule.token).safeTransferFrom(
            _filler,
            address(this),
            _fillAmount
        );
    }

    /**
     * @dev Withdraw tokens from available reserves.
     *
     * Note - Available reserves refer to the amount of tokens that are not
     * being used by vesting capsules. The funds currently used by vesting
     * capsules WILL NOT be able to be withdrawn by anyone except capsule owners.
     *
     * Requirements:
     *
     * - `_scheduleID` must exist.
     * - `_to` cannot be zero address.
     * - available reserves of `_scheduleID` must be > 0.
     *
     * @param _to Address to withdraw tokens to.
     * @param _scheduleID ID of the schedule to withdraw from.
     */
    function _withdrawAvailableReserves(address _to, uint256 _scheduleID)
        internal
        virtual
    {
        require(_to != address(0), "VestingVault: Cannot withdraw to 0x0");
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingVault: Schedule does not exist"
        );
        require(
            _availableScheduleReserves[_scheduleID] > 0,
            "VestingVault: No available reserves"
        );

        // Reduce total reserves and set available reserves to 0
        _totalScheduleReserves[_scheduleID] -= _availableScheduleReserves[
            _scheduleID
        ];
        _availableScheduleReserves[_scheduleID] = 0;

        // Transfer tokens from this contract to another address.
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];
        IERC20(schedule.token).safeTransferFrom(
            address(this),
            _to,
            _availableScheduleReserves[_scheduleID]
        );
    }

    /***********************************|
    |    Capsule Creation Functions     |
    |__________________________________*/

    /**
     * @dev Performs additional validation checks on capsule params before creation.
     *
     * Requirements:
     *
     * - `_scheduleID` must exist.
     * - `_owner` cannot be zero address.
     * - `_startTime` must be >= `block.timestamp`.
     * - `_availableScheduleReserves` of `_scheduleID` must be >= `schedule.amount`
     *
     * @param _owner Address of new capsule owner.
     * @param _scheduleID ID of the schedule capsule will be created from.
     * @param _startTime Time at which cliff periods begin.
     */
    function _safeCreateCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) internal virtual returns (uint256) {
        require(_owner != address(0), "VestingVault: Owner cannot be 0x0");
        require(
            _startTime >= block.timestamp,
            "VestingVault: Start time cannot be in the past"
        );
        return _createCapsule(_owner, _scheduleID, _startTime);
    }

    /**
     * @dev Most basic function for capsule creation. This function
     * skips validation checks on `_owner` and `_startTime` to provide
     * inherited contracts with the ability to create more efficient batch operations.
     *
     * Requirements:
     *
     * - `_scheduleID` must exist.
     * - `_availableScheduleReserves` of `_scheduleID` must be >= `schedule.amount`
     *
     * @param _owner Address able to claim the tokens in the capsule.
     * @param _scheduleID ID of the schedule capsule will be created from.
     * @param _startTime The amount of claimable tokens in the capsule.
     */
    function _createCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) internal virtual returns (uint256) {
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingVault: Invalid schedule ID"
        );
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];
        require(
            _availableScheduleReserves[_scheduleID] > schedule.amount - 1,
            "VestingVault: Insufficient token reserves"
        );

        // Decrease schedule's reserves value by one capsule amount
        _availableScheduleReserves[_scheduleID] -= schedule.amount;

        // Get current capsule ID and increment
        uint256 currentId = _capsuleIdCounter.current();
        _capsuleIdCounter.increment();

        // Set owner of the capsule
        _capsuleOwners[currentId] = _owner;

        // Mark as active and create the capsule
        _activeCapsules[currentId] = true;
        _capsules[currentId] = Capsule(
            _scheduleID,
            _startTime,
            _startTime + schedule.duration,
            0
        );
        return currentId;
    }

    /***********************************|
    |   Capsule Destruction Functions   |
    |__________________________________*/

    /**
     * @dev Delete an active capsule and release funds back to reserves.
     *
     * Requirements:
     *
     * - `_owner` must equal `_capsuleOwners[_capsuleID]`.
     * - `_activeCapsules` value must be true
     *
     * @param _owner Address of current capsule owner.
     * @param _capsuleID ID of capsule to delete.
     */
    function _safeDestroyCapsule(uint256 _capsuleID, address _owner)
        internal
        virtual
    {
        require(
            _activeCapsules[_capsuleID],
            "VestingVault: Capsule is not active"
        );
        _destroyCapsule(_capsuleID, _owner);
    }

    /**
     * @dev Allows capsule owner to delete their Capsule and release its funds back to
     * reserves. This function skips validation checks on `_capsuleID` to provide inherited
     * contracts with the ability to create more efficient batch operations
     *
     * Requirements:
     *
     * - `_owner` must match `_capsuleOwners` record
     *
     * @param _capsuleID Capsule ID to delete.
     */
    function _destroyCapsule(uint256 _capsuleID, address _owner)
        internal
        virtual
    {
        require(
            _capsuleOwners[_capsuleID] == _owner,
            "VestingVault: Caller is not capsule owner"
        );

        Capsule storage capsule = _capsules[_capsuleID];
        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        // Calculate the amount of tokens remaining in the capsule (including vested tokens)
        uint256 fundsToRelease = schedule.amount - capsule.claimedAmount;

        // Return funds to schedule reserves
        _availableScheduleReserves[capsule.scheduleId] += fundsToRelease;

        // Delete capsule and owner reference
        delete _capsules[_capsuleID];
        delete _capsuleOwners[_capsuleID];
        delete _activeCapsules[_capsuleID];
    }

    /***********************************|
    |    Capsule Transfer Functions     |
    |__________________________________*/

    /**
     * @dev Allow Capsule owner to transfer ownership of an
     * active capsule to another address.
     *
     * Requirements:
     *
     * - `_to` cannot be zero address.
     * - `_from` cannot equal `_to`
     * - `_capsuleID` must exist.
     * - `capsule.endtime` must be > `block.timestamp`
     * - `msg.sender` must be capsule owner
     *
     * @param _from Address sending capsule.
     * @param _to Address to receive capsule.
     * @param _capsuleID ID of capsule to transfer.
     */
    function _safeTransferCapsule(
        address _from,
        address _to,
        uint256 _capsuleID
    ) internal virtual {
        require(
            _to != address(0),
            "VestingVault: Cannot transfer capsule to 0x0"
        );
        require(_from != _to, "VestingVault: Cannot transfer capsule to self");
        require(!_expired(_capsuleID), "VestingVault: Capsule is fully vested");
        _transferCapsule(_from, _to, _capsuleID);
    }

    /**
     * @dev Most basic function for capsule transfer. Allows capsule owner
     * to transfer ownership to another address. Unclaimed vested tokens
     * are stored in leftover reserves for prior owner. This function skips
     * validation checks on `_to` address and `capsule.endtime`to provide inherited
     * contracts with the ability to create more efficient batch operations
     *
     * Requirements:
     *
     * - `_capsuleID` must exist.
     * - `msg.sender` must be capsule owner
     *
     * @param _from Address to tranfer capsule from.
     * @param _to Address to receive capsule.
     * @param _capsuleID ID of capsule to transfer.
     */
    function _transferCapsule(
        address _from,
        address _to,
        uint256 _capsuleID
    ) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingVault: Invalid capsule ID"
        );
        require(
            _capsuleOwners[_capsuleID] == _from,
            "VestingVault: Caller is not capsule owner"
        );

        // Register _to address as new owner
        _capsuleOwners[_capsuleID] = _to;

        Capsule storage capsule = _capsules[_capsuleID];

        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        // Check if the capsule's cliff period has ended
        if (block.timestamp > capsule.startTime + schedule.cliff) {
            uint256 balance = _getVestedBalance(_capsuleID);

            if (balance > 0) {
                // Update capsule values to reflect that they have been "claimed"
                capsule.claimedAmount += balance;

                // Reduce the total schedule reserves by leftover balance
                _totalScheduleReserves[capsule.scheduleId] -= balance;

                // Add unclaimed vested tokens to previous owners leftover balance
                _leftoverBalance[_from][schedule.token] += balance;
            }
        }
    }

    /***********************************|
    |    Capsule Withdrawal Functions   |
    |__________________________________*/

    /**
     * @dev Transfers the amount of tokens in one Capsule that have
     * vested to the owner of the capsule.
     *
     * Requirements:
     *
     * - `_capsuleID` must exist.
     * - `_owner` must match `_capsuleOwners` record
     *
     * @param _capsuleID ID of the capsule to withdraw from.
     */
    function _withdrawCapsuleBalance(uint256 _capsuleID, address _owner)
        internal
        virtual
        returns (bool)
    {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingVault: Invalid capsule ID"
        );
        require(
            _capsuleOwners[_capsuleID] == _owner,
            "VestingVault: Caller is not capsule owner"
        );
        uint256 claimAmount = _getVestedBalance(_capsuleID);
        if (claimAmount > 0) {
            Capsule storage capsule = _capsules[_capsuleID];
            VestingSchedule storage schedule = _vestingSchedules[
                capsule.scheduleId
            ];

            // Reduce the total reserves by amount claimed by owner
            // Note - Have to update reserves before (possibly) deleting the capsule
            _totalScheduleReserves[capsule.scheduleId] -= claimAmount;

            if (block.timestamp >= capsule.endTime) {
                // Emptying Expired Capsule -> mark as inactive & delete
                delete _capsules[_capsuleID];
                delete _capsuleOwners[_capsuleID];
                delete _activeCapsules[_capsuleID];
            } else {
                // Not Fully Vested -> claim values
                capsule.claimedAmount += claimAmount;
            }

            // Transfer tokens to capsule owner
            IERC20(schedule.token).safeTransfer(_owner, claimAmount);
            return true;
        }
        return false;
    }

    /***********************************|
    |   Leftover Withdrawal Functions   |
    |__________________________________*/

    /**
     * @dev Transfers the amount of vested tokens leftover
     * after capsule was transfered by `_prevOwner`
     *
     * Requirements:
     *
     * - `_leftoverBalance[_prevOwner][_token]` must be > 0.
     *
     * @param _token Address of token to withdraw from.
     * @param _prevOwner Address of previous owner of token.
     */
    function _withdrawTokenLeftovers(address _token, address _prevOwner)
        internal
        virtual
    {
        uint256 leftoverBalance = _leftoverBalance[_prevOwner][_token];
        require(
            leftoverBalance > 0,
            "VestingVault: No leftover tokens to withdraw"
        );
        // Delete leftover balance of caller
        delete _leftoverBalance[_prevOwner][_token];

        // Transfer tokens to capsule owner
        IERC20(_token).safeTransfer(_prevOwner, leftoverBalance);
    }
}

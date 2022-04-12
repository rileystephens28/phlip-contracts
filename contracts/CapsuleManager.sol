// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CapsuleManager
 * @author Riley Stephens
 * @dev CapsuleManager is a protocol for creating custom vesting schedules and transferable vesting
 * capsules. This contract will hold ERC20 tokens on behalf of vesting beneficiaries and control the rate at which
 * beneficiaries can withdraw them. When a capsule is transferred, the tokens owed to the prior owner
 * are stored in leftover reserves waiting to be claimed.
 */
contract CapsuleManager is Context, AccessControl {
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
     * is stored in leftover reserves waiting to be claimed.
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
    mapping(uint256 => bool) private _registeredSchedules;

    // The amount of tokens this contract holds for each schedule
    mapping(uint256 => uint256) private _totalScheduleReserves;
    mapping(uint256 => uint256) private _availableScheduleReserves;

    // The amount of tokens this contract holds that are waiting for withdrawal
    mapping(address => uint256) private _leftoverReserves;

    // Maps addresses to their capsules
    mapping(uint256 => Capsule) private _capsules;

    // Maps capsules to their owners
    mapping(uint256 => address) private _capsuleOwners;

    // Maps prior capsule owners to tokens that vested in their capsules before being to transferred
    mapping(address => mapping(address => uint256)) private _leftoverBalance;

    /**
     * @dev Create a new CapsuleManager instance and grant msg.sender TREASURER role.
     */
    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function for checking if specified schedule is registered.
     * @param _scheduleID The ID of the VestingSchedule to be queried.
     * @return True if the schedule is registered, false otherwise.
     */
    function scheduleExists(uint256 _scheduleID) public view returns (bool) {
        return _registeredSchedules[_scheduleID];
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
     * @dev Accessor function for leftover reserves of specified token.
     * @param _token The address of the token to be queried.
     * @return The amount of specified tokens waiting to be withdrawn (no longer in capsules)
     */
    function leftoverReservesOf(address _token) public view returns (uint256) {
        return _leftoverReserves[_token];
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
     * @dev Calculates the amount of tokens that have vested for a given capsule.
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
     * @dev Calculates the amount of tokens that have vested for several capsules.
     * @param _capsuleIDs Array of IDs of capsules to be queried
     * @return Array of vested balances for respective capsules
     */
    function vestedBalancesOf(uint256[] calldata _capsuleIDs)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory balances = new uint256[](_capsuleIDs.length);
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            balances[i] = vestedBalanceOf(_capsuleIDs[i]);
        }
        return balances;
    }

    /**
     * @dev Accessor function for previous capsule owners leftover balance of given token.
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

    /**
     * @dev Accessor function for previous capsule owners leftover balance of several tokens.
     * @param _prevOwner The address of account whose balance to query
     * @param _tokens Array of token addresses to query
     * @return The amount of specified tokens leftover after capsule transfer
     */
    function leftoverBalancesOf(address _prevOwner, address[] calldata _tokens)
        public
        view
        returns (uint256[] memory)
    {
        uint256[] memory balances = new uint256[](_tokens.length);
        for (uint256 i = 0; i < _tokens.length; i++) {
            balances[i] = _leftoverBalance[_prevOwner][_tokens[i]];
        }
        return balances;
    }

    /***********************************|
    |       Treasurer Functions         |
    |__________________________________*/

    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens that will be deposited from treasurer.
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
    ) external onlyRole(TREASURER_ROLE) returns (uint256) {
        return _createCapsule(_owner, _scheduleID, _startTime);
    }

    /***********************************|
    |       External Functions          |
    |__________________________________*/

    /**
     * @dev Allows capsule owner to delete their Capsule and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function destroyCapsule(uint256 _capsuleID) external {
        _destroyCapsule(_capsuleID);
    }

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to transfer to.
     */
    function transfer(uint256 _capsuleID, address _to) external {
        _transfer(_capsuleID, _to);
    }

    /**
     * @dev transfers vested tokens to capsule owner.
     * @param _capsuleID ID of the Capsule to be claimed.
     */
    function claim(uint256 _capsuleID) external {
        _claim(_capsuleID);
    }

    /**
     * @dev Transfers leftover vested tokens from previously owned capsule
     * @param _token Address of token leftovers to claim
     */
    function withdrawLeftovers(address _token) external {
        _withdrawLeftovers(_token);
    }

    /***********************************|
    |    Batch Operation Functions      |
    |__________________________________*/

    /**
     * @dev Creates a batch of new Capsules.
     * @param _owners Array of beneficiaries of vesting capsules.
     * @param _scheduleIDs Array of schedule IDs of the associated vesting schedule.
     * @param _startTimes Array of times at which cliff periods begin.
     */
    function batchCreateCapsules(
        address[] calldata _owners,
        uint256[] calldata _scheduleIDs,
        uint256[] calldata _startTimes
    ) external onlyRole(TREASURER_ROLE) returns (uint256[] memory) {
        require(_owners.length > 0, "CapsuleManager: No owners provided");
        require(
            _owners.length == _scheduleIDs.length,
            "CapsuleManager: owners and schedule IDs must be the same length"
        );
        require(
            _owners.length == _startTimes.length,
            "CapsuleManager: owners and start times must be the same length"
        );
        uint256[] memory newCapsuleIds = new uint256[](_owners.length);
        for (uint256 i = 0; i < _owners.length; i++) {
            newCapsuleIds[i] = _createCapsule(
                _owners[i],
                _scheduleIDs[i],
                _startTimes[i]
            );
        }
        return newCapsuleIds;
    }

    /**
     * @dev Destroys a batch of Capsules owned by the caller.
     * @param _capsuleIDs Array of capsule IDs to destoy.
     */
    function batchDestoryCapsules(uint256[] calldata _capsuleIDs) external {
        require(
            _capsuleIDs.length > 0,
            "CapsuleManager: No capsule IDs provided"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _destroyCapsule(_capsuleIDs[i]);
        }
    }

    /**
     * @dev Tranfers a batch of Capsules owned by the caller to new addresses.
     * @param _capsuleIDs Array of capsule IDs to transfer.
     * @param _capsuleIDs Array of addresses to receive capsules.
     */
    function batchTranfer(
        uint256[] calldata _capsuleIDs,
        address[] calldata _recipients
    ) external {
        require(
            _capsuleIDs.length > 0,
            "CapsuleManager: No capsule IDs provided"
        );
        require(
            _capsuleIDs.length == _recipients.length,
            "CapsuleManager: capsule IDs and _recipients must be the same length"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _transfer(_capsuleIDs[i], _recipients[i]);
        }
    }

    /**
     * @dev Claim a batch of Capsules owned by the caller.
     * @param _capsuleIDs Array of capsule IDs to claim.
     */
    function batchClaim(uint256[] calldata _capsuleIDs) external {
        require(
            _capsuleIDs.length > 0,
            "CapsuleManager: No capsule IDs provided"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _claim(_capsuleIDs[i]);
        }
    }

    /**
     * @dev Withdraw leftovers of several tokens owed to caller.
     * @param _tokens Array of token address to withdraw from leftover reserves.
     */
    function batchWithdrawLeftovers(address[] calldata _tokens) external {
        require(
            _tokens.length > 0,
            "CapsuleManager: No token addresses provided"
        );
        for (uint256 i = 0; i < _tokens.length; i++) {
            _withdrawLeftovers(_tokens[i]);
        }
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

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
            "CapsuleManager: Token address cannot be 0x0"
        );
        require(
            _durationSeconds > 0,
            "CapsuleManager: Duration must be greater than 0"
        );
        require(
            _tokenRatePerSecond > 0,
            "CapsuleManager: Token release rate must be greater than 0"
        );
        require(
            _cliffSeconds < _durationSeconds,
            "CapsuleManager: Cliff must be less than duration."
        );

        uint256 currentScheduleId = _scheduleIDCounter.current();
        _scheduleIDCounter.increment();
        _registeredSchedules[currentScheduleId] = true;
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            _token,
            _durationSeconds * _tokenRatePerSecond,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /**
     * @dev Deposits tokens to fill a future capsules for a specified schedule.
     * Requires that TREASURER approves this contract to spend schedule tokens.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens transfered from sender to contract.
     */
    function _fillReserves(uint256 _scheduleID, uint256 _fillAmount)
        internal
        virtual
    {
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "CapsuleManager: Schedule does not exist"
        );
        require(
            _fillAmount > 0,
            "CapsuleManager: Fill amount must be greater than 0"
        );

        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];

        // Updates reserve values
        _totalScheduleReserves[_scheduleID] += _fillAmount;
        _availableScheduleReserves[_scheduleID] += _fillAmount;

        IERC20(schedule.token).safeTransferFrom(
            msg.sender,
            address(this),
            _fillAmount
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
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) internal virtual returns (uint256) {
        require(
            _owner != address(0),
            "CapsuleManager: Beneficiary cannot be 0x0"
        );
        require(
            _startTime >= block.timestamp,
            "CapsuleManager: Capsule startTime cannot be in the past."
        );
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "CapsuleManager: Invalid scheduleId"
        );
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];

        require(
            _availableScheduleReserves[_scheduleID] >= schedule.amount,
            "CapsuleManager: Schedule has insufficient token reserves for new capsule."
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
        return currentId;
    }

    /**
     * @dev Allows capsule owner to delete their Capsule and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function _destroyCapsule(uint256 _capsuleID) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "CapsuleManager: Invalid capsule ID"
        );
        require(
            ownerOf(_capsuleID) == msg.sender,
            "CapsuleManager: Cannot destory capsule because msg.sender is not the owner."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        uint256 fundsToRelease = schedule.amount - capsule.claimedAmount;

        // Return funds to schedule reserves
        _availableScheduleReserves[capsule.scheduleId] += fundsToRelease;

        // Delete capsule and owner reference
        delete _capsules[_capsuleID];
        delete _capsuleOwners[_capsuleID];
    }

    /**
     * @dev Transfers the amount of tokens in a Capsule that have vested to the owner of the capsule.
     * @param _capsuleID ID of the Capsule to be claimed.
     */
    function _claim(uint256 _capsuleID) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "CapsuleManager: Invalid capsule ID"
        );
        require(
            ownerOf(_capsuleID) == msg.sender,
            "CapsuleManager: Cannot claim capsule because msg.sender is not the owner."
        );
        uint256 claimAmount = vestedBalanceOf(_capsuleID);
        require(
            claimAmount > 0,
            "CapsuleManager: Capsule has no tokens to claim."
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
        IERC20(schedule.token).transfer(msg.sender, claimAmount);
    }

    /**
     * @dev Transfers the amount of tokens leftover owed to previous
     * capsule owner after capsule transfer(s).
     * @param _token ID of the Capsule to be claimed.
     */
    function _withdrawLeftovers(address _token) internal virtual {
        require(_token != address(0), "CapsuleManager: Token cannot be 0x0");

        uint256 leftoverBalance = _leftoverBalance[msg.sender][_token];
        require(
            leftoverBalance > 0,
            "CapsuleManager: No leftover tokens to withdraw."
        );
        // Reduce the leftover reserves and leftover balance of caller
        _leftoverReserves[_token] -= leftoverBalance;
        _leftoverBalance[msg.sender][_token] -= leftoverBalance;

        // Transfer tokens to capsule owner
        IERC20(_token).transfer(msg.sender, leftoverBalance);
    }

    /**
     * @dev Allow Capsule owner to transfer ownership to another address.
     * The amount of unclaimed vested tokens are transferred to the prior owner.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to the list of token beneficiaries.
     */
    function _transfer(uint256 _capsuleID, address _to) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "CapsuleManager: Invalid capsule ID"
        );
        require(
            _to != address(0),
            "CapsuleManager: Cannot transfer capsule to 0x0."
        );
        require(
            _to != msg.sender,
            "CapsuleManager: Cannot transfer capsule to self."
        );
        require(
            ownerOf(_capsuleID) == msg.sender,
            "CapsuleManager: Cannot transfer capsule because msg.sender is not the owner."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        require(
            capsule.endTime > block.timestamp,
            "CapsuleManager: Cannot transfer capsule because it has already been fully vested."
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

                // Reduce the total schedule reserves by leftover balance
                _totalScheduleReserves[capsule.scheduleId] -= balance;

                // Add unclaimed vested tokens to previous owners leftover balance
                _leftoverBalance[msg.sender][schedule.token] += balance;
                _leftoverReserves[schedule.token] += balance;
            }
        }
    }
}

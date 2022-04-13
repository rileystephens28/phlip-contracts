// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title VestingVault
 * @author Riley Stephens
 * @dev VestingVault provides contracts with the ability to create custom vesting schedules and transferable vesting
 * capsules. This contract is designed to hold ERC20 tokens on behalf of vesting beneficiaries and control the rate at which
 * beneficiaries can withdraw them. When a capsule is transferred, the tokens owed to the prior owner
 * are stored in leftover reserves waiting to be claimed.
 */
contract VestingVault {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    Counters.Counter internal _scheduleIDCounter;
    Counters.Counter internal _capsuleIdCounter;

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

    mapping(uint256 => VestingSchedule) internal _vestingSchedules;
    mapping(uint256 => bool) internal _registeredSchedules;

    // The amount of tokens this contract holds for each schedule
    mapping(uint256 => uint256) internal _totalScheduleReserves;
    mapping(uint256 => uint256) internal _availableScheduleReserves;

    // The amount of tokens this contract holds that are waiting for withdrawal
    mapping(address => uint256) internal _leftoverReserves;

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
     * @dev Accessor function for checking if capsule has expired and been claimed.
     * Note - capsules that do not actually exist are also considered inactive.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return True if capsule exists and has not been fully claimed, False otherwise.
     */
    function isCapsuleActive(uint256 _capsuleID) public view returns (bool) {
        return _activeCapsules[_capsuleID];
    }

    /**
     * @dev Accessor function for specified Capsule owner.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return The address of the capsule owner
     */
    function capsuleOwnerOf(uint256 _capsuleID) public view returns (address) {
        return _capsuleOwners[_capsuleID];
    }

    /**
     * @dev Accessor function for amount of tokens that have vested for a given capsule.
     * @param _capsuleID The ID of the capsule to be queried
     * @return The amount of claimable tokens in a capsule
     */
    function vestedBalanceOf(uint256 _capsuleID) public view returns (uint256) {
        return _getVestedBalance(_capsuleID);
    }

    /**
     * @dev Accessor function for amount of tokens that have vested for several capsules.
     * @param _capsuleIDs Array of IDs of capsules to be queried
     * @return (array of token addresses, array of vested balances for respective tokens)
     */
    function vestedBalancesOf(uint256[] calldata _capsuleIDs)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        return _getVestedBalances(_capsuleIDs);
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
    |       External Functions          |
    |__________________________________*/

    /**
     * @dev Allows capsule owner to delete one of their capsules and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function destroySingleCapsule(uint256 _capsuleID) external {
        _destroySingleCapsule(_capsuleID);
    }

    /**
     * @dev Destroys a batch of Capsules owned by the caller.
     * @param _capsuleIDs Array of capsule IDs to destoy.
     */
    function destroyMultiCapsule(uint256[] calldata _capsuleIDs) external {
        _destroyMultiCapsule(_capsuleIDs);
    }

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to transfer to.
     */
    function transferSingleCapsule(uint256 _capsuleID, address _to) external {
        _transferSingleCapsule(_capsuleID, _to);
    }

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleIDs Array of capsule IDs to transfer.
     * @param _to Address to transfer to.
     */
    function transferMultiCapsule(uint256[] calldata _capsuleIDs, address _to)
        external
    {
        _transferMultiCapsule(_capsuleIDs, _to);
    }

    /**
     * @dev Transfers the amount of tokens in one Capsule that have
     * vested to the owner of the capsule.
     * @param _capsuleID ID of the capsule to withdraw from.
     */
    function withdrawSingleCapsule(uint256 _capsuleID) external {
        _withdrawSingleCapsule(_capsuleID);
    }

    /**
     * @dev Transfers the amount of tokens in several capsules that have
     * vested to the owners of the capsules.
     * @param _capsuleIDs Array of capsule IDs to withdraw from.
     */
    function withdrawMultiCapsule(uint256[] calldata _capsuleIDs) external {
        _withdrawMultiCapsule(_capsuleIDs);
    }

    /**
     * @dev Transfers the amount of tokens leftover owed caller.
     * @param _token ID of the Capsule to be claimed.
     */
    function withdrawSingleTokenLeftovers(address _token) external {
        _withdrawSingleTokenLeftovers(_token);
    }

    /**
     * @dev Withdraw leftovers of several tokens owed to caller.
     * @param _tokens Array of token address to withdraw from leftover reserves.
     */
    function withdrawMultiTokenLeftovers(address[] calldata _tokens) external {
        _withdrawMultiTokenLeftovers(_tokens);
    }

    /***********************************|
    |     Private Getter Functions      |
    |__________________________________*/

    /**
     * @dev Accessor function for checking if specified schedule is registered.
     * @param _scheduleID The ID of the VestingSchedule to be queried.
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
     * @dev Calculates the amount of tokens that have vested for a given capsule.
     * @param _capsuleID The ID of the capsule to be queried
     * @return The amount of claimable tokens in a capsule
     */
    function _getVestedBalance(uint256 _capsuleID)
        internal
        view
        virtual
        returns (uint256)
    {
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
     * @return (array of token addresses, array of vested balances for respective tokens)
     */
    function _getVestedBalances(uint256[] memory _capsuleIDs)
        internal
        view
        virtual
        returns (address[] memory, uint256[] memory)
    {
        address[] memory tokens = new address[](_capsuleIDs.length);
        uint256[] memory balances = new uint256[](_capsuleIDs.length);

        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            balances[i] = _getVestedBalance(_capsuleIDs[i]);
            tokens[i] = _vestingSchedules[_capsules[_capsuleIDs[i]].scheduleId]
                .token;
        }
        return (tokens, balances);
    }

    /***********************************|
    |    Schedule Creation Functions    |
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
            "VestingVault: Token address cannot be 0x0"
        );
        require(
            _durationSeconds > 0,
            "VestingVault: Duration must be greater than 0"
        );
        require(
            _tokenRatePerSecond > 0,
            "VestingVault: Token release rate must be greater than 0"
        );
        require(
            _cliffSeconds < _durationSeconds,
            "VestingVault: Cliff must be less than duration."
        );

        // Get the next schedule ID and increment the counter
        uint256 currentScheduleId = _scheduleIDCounter.current();
        _scheduleIDCounter.increment();

        // Mark as registered and create the schedule
        _registeredSchedules[currentScheduleId] = true;
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            _token,
            _durationSeconds * _tokenRatePerSecond,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /***********************************|
    |     Reserve Filling Functions     |
    |__________________________________*/

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
            msg.sender,
            address(this),
            _fillAmount
        );
    }

    /***********************************|
    |    Capsule Creation Functions     |
    |__________________________________*/

    /**
     * @dev Creates one new Capsule for the given address if the contract holds
     * enough tokens to cover the amount of tokens required for the vesting schedule.
     * @param _scheduleID The ID of the schedule to be used for the capsule.
     * @param _startTime The amount of claimable tokens in the capsule.
     * @param _owner Address able to claim the tokens in the capsule.
     */
    function _createSingleCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) internal virtual returns (uint256) {
        require(
            _owner != address(0),
            "VestingVault: Beneficiary cannot be 0x0"
        );
        require(
            _scheduleID < _scheduleIDCounter.current(),
            "VestingVault: Invalid schedule ID"
        );
        require(
            _startTime >= block.timestamp,
            "VestingVault: Capsule startTime cannot be in the past."
        );
        return _createCapsule(_owner, _scheduleID, _startTime);
    }

    /**
     * @dev Creates multiple new Capsules, all with same owner and start time.
     * @param _owner Single beneficiary of new vesting capsules.
     * @param _scheduleIDs Array of schedule IDs of the associated vesting schedule.
     * @param _startTime Time at which cliff periods begin.
     */
    function _createMultiCapsule(
        address _owner,
        uint256[] memory _scheduleIDs,
        uint256 _startTime
    ) internal virtual returns (uint256[] memory) {
        require(
            _owner != address(0),
            "VestingVault: Beneficiary cannot be 0x0"
        );
        require(
            _startTime >= block.timestamp,
            "VestingVault: Capsule startTime cannot be in the past."
        );
        require(
            _scheduleIDs.length > 0,
            "VestingVault: No vesting schedule IDs provided"
        );

        uint256[] memory newCapsuleIds = new uint256[](_scheduleIDs.length);
        for (uint256 i = 0; i < _scheduleIDs.length; i++) {
            newCapsuleIds[i] = _createCapsule(
                _owner,
                _scheduleIDs[i],
                _startTime
            );
        }
        return newCapsuleIds;
    }

    /**
     * @dev Creates a batch of new Capsules from array params.
     * Note - May end up not using this function.
     * @param _owners Array of beneficiaries of vesting capsules.
     * @param _scheduleIDs Array of schedule IDs of the associated vesting schedule.
     * @param _startTimes Array of times at which cliff periods begin.
     */
    function _batchCreateCapsules(
        address[] calldata _owners,
        uint256[] calldata _scheduleIDs,
        uint256[] calldata _startTimes
    ) internal virtual returns (uint256[] memory) {
        require(_owners.length > 0, "VestingVault: No owners provided");
        require(
            _owners.length == _scheduleIDs.length,
            "VestingVault: owners and schedule IDs must be the same length"
        );
        require(
            _owners.length == _startTimes.length,
            "VestingVault: owners and start times must be the same length"
        );
        uint256[] memory newCapsuleIds = new uint256[](_owners.length);
        for (uint256 i = 0; i < _owners.length; i++) {
            newCapsuleIds[i] = _createSingleCapsule(
                _owners[i],
                _scheduleIDs[i],
                _startTimes[i]
            );
        }
        return newCapsuleIds;
    }

    /**
     * @dev Most basic function for capsule creation, skips some parameter validation.
     * Creates a new capsule for the given address if the contract holdsenough tokens
     * to cover the amount of tokens required for the vesting schedule.
     * @param _scheduleID The ID of the schedule to be used for the capsule.
     * @param _startTime The amount of claimable tokens in the capsule.
     * @param _owner Address able to claim the tokens in the capsule.
     */
    function _createCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) internal virtual returns (uint256) {
        VestingSchedule storage schedule = _vestingSchedules[_scheduleID];
        require(
            _availableScheduleReserves[_scheduleID] >= schedule.amount,
            "VestingVault: Insufficient token reserves for new capsule."
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
            _startTime,
            0
        );
        return currentId;
    }

    /***********************************|
    |   Capsule Destruction Functions   |
    |__________________________________*/

    /**
     * @dev Allows capsule owner to delete their Capsule and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function _destroySingleCapsule(uint256 _capsuleID) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingVault: Invalid capsule ID"
        );
        require(
            _capsuleOwners[_capsuleID] == msg.sender,
            "VestingVault: Cannot destory capsule because msg.sender is not the owner."
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
    }

    /**
     * @dev Destroys a batch of Capsules owned by the caller.
     * @param _capsuleIDs Array of capsule IDs to destoy.
     */
    function _destroyMultiCapsule(uint256[] memory _capsuleIDs)
        internal
        virtual
    {
        require(
            _capsuleIDs.length > 0,
            "VestingVault: No capsule IDs provided"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _destroySingleCapsule(_capsuleIDs[i]);
        }
    }

    /***********************************|
    |    Capsule Transfer Functions     |
    |__________________________________*/

    /**
     * @dev Allow Capsule owner to transfer ownership of one capsule to another address.
     * The amount of unclaimed vested tokens are stored in leftover reseverves for prior owner.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to receive one capsule
     */
    function _transferSingleCapsule(uint256 _capsuleID, address _to)
        internal
        virtual
    {
        require(
            _to != address(0),
            "VestingVault: Cannot transfer capsule to 0x0."
        );
        require(
            _to != msg.sender,
            "VestingVault: Cannot transfer capsule to self."
        );
        _transferCapsule(_capsuleID, _to);
    }

    /**
     * @dev Transfers a batch of Capsules owned by the caller to a single address.
     * @param _capsuleIDs Array of capsule IDs to transfer.
     * @param _to Address to receive all capsules.
     */
    function _transferMultiCapsule(uint256[] memory _capsuleIDs, address _to)
        internal
        virtual
    {
        require(
            _capsuleIDs.length > 0,
            "VestingVault: No capsule IDs provided"
        );
        require(
            _to != address(0),
            "VestingVault: Cannot transfer capsule to 0x0."
        );
        require(
            _to != msg.sender,
            "VestingVault: Cannot transfer capsule to self."
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _transferCapsule(_capsuleIDs[i], _to);
        }
    }

    /**
     * @dev Transfers a batch of Capsules owned by the caller to new addresses.
     * Note - May not end up using this function.
     * @param _capsuleIDs Array of capsule IDs to transfer.
     * @param _recipients Array of addresses to receive capsules.
     */
    function _batchTransferCapsules(
        uint256[] memory _capsuleIDs,
        address[] memory _recipients
    ) internal virtual {
        require(
            _capsuleIDs.length > 0,
            "VestingVault: No capsule IDs provided"
        );
        require(
            _capsuleIDs.length == _recipients.length,
            "VestingVault: capsule IDs and _recipients must be the same length"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _transferSingleCapsule(_capsuleIDs[i], _recipients[i]);
        }
    }

    /**
     * @dev Most basic function for capsule transfer, skips some parameter
     * validation. Allows capsule owner to transfer ownership to another address.
     * Unclaimed vested tokens are stored in leftover reserves for prior owner.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to the list of token beneficiaries.
     */
    function _transferCapsule(uint256 _capsuleID, address _to)
        internal
        virtual
    {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingVault: Invalid capsule ID"
        );
        require(
            _capsuleOwners[_capsuleID] == msg.sender,
            "VestingVault: Cannot transfer capsule because msg.sender is not the owner."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        require(
            capsule.endTime > block.timestamp,
            "VestingVault: Cannot transfer capsule because it has already been fully vested."
        );

        // Register _to address as new owner
        _capsuleOwners[_capsuleID] = _to;

        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        // Check if the capsule's cliff period has ended
        if (block.timestamp > capsule.startTime + schedule.cliff) {
            uint256 balance = _getVestedBalance(_capsuleID);

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

    /***********************************|
    |    Capsule Withdrawal Functions   |
    |__________________________________*/

    /**
     * @dev Transfers the amount of tokens in one Capsule that have
     * vested to the owner of the capsule.
     * @param _capsuleID ID of the capsule to withdraw from.
     */
    function _withdrawSingleCapsule(uint256 _capsuleID) internal virtual {
        require(
            _capsuleID < _capsuleIdCounter.current(),
            "VestingVault: Invalid capsule ID"
        );
        require(
            _capsuleOwners[_capsuleID] == msg.sender,
            "VestingVault: Cannot claim capsule because msg.sender is not the owner."
        );
        uint256 claimAmount = _getVestedBalance(_capsuleID);
        require(
            claimAmount > 0,
            "VestingVault: Capsule has no tokens to claim."
        );

        Capsule storage capsule = _capsules[_capsuleID];
        VestingSchedule storage schedule = _vestingSchedules[
            capsule.scheduleId
        ];

        // Reduce the total reserves by amount claimed by owner
        // Note - Have to do think before (possibly) deleting the capsule
        _totalScheduleReserves[capsule.scheduleId] -= claimAmount;

        if (block.timestamp > capsule.endTime) {
            // Emptying Expired Capsule -> mark as inactive & delete
            _activeCapsules[_capsuleID] = false;
            delete _capsules[_capsuleID];
            delete _capsuleOwners[_capsuleID];
        } else {
            // Not Fully Vested -> claim values
            capsule.claimedAmount += claimAmount;
            capsule.lastClaimedTimestamp = block.timestamp;
        }

        // Transfer tokens to capsule owner
        IERC20(schedule.token).safeTransfer(msg.sender, claimAmount);
    }

    /**
     * @dev Transfers the amount of tokens in several capsules that have
     * vested to the owners of the capsules.
     * @param _capsuleIDs Array of capsule IDs to withdraw from.
     */
    function _withdrawMultiCapsule(uint256[] memory _capsuleIDs)
        internal
        virtual
    {
        require(
            _capsuleIDs.length > 0,
            "VestingVault: No capsule IDs provided"
        );
        for (uint256 i = 0; i < _capsuleIDs.length; i++) {
            _withdrawSingleCapsule(_capsuleIDs[i]);
        }
    }

    /***********************************|
    |   Leftover Withdrawal Functions   |
    |__________________________________*/

    /**
     * @dev Transfers the amount of tokens leftover owed caller.
     * @param _token ID of the Capsule to be claimed.
     */
    function _withdrawSingleTokenLeftovers(address _token) internal virtual {
        uint256 leftoverBalance = _leftoverBalance[msg.sender][_token];
        require(
            leftoverBalance > 0,
            "VestingVault: No leftover tokens to withdraw."
        );
        // Reduce the leftover reserves and delete balance of caller
        _leftoverReserves[_token] -= leftoverBalance;
        delete _leftoverBalance[msg.sender][_token];

        // Transfer tokens to capsule owner
        IERC20(_token).safeTransfer(msg.sender, leftoverBalance);
    }

    /**
     * @dev Withdraw leftovers of several tokens owed to caller.
     * @param _tokens Array of token address to withdraw from leftover reserves.
     */
    function _withdrawMultiTokenLeftovers(address[] memory _tokens)
        internal
        virtual
    {
        require(
            _tokens.length > 0,
            "VestingVault: No token addresses provided"
        );
        for (uint256 i = 0; i < _tokens.length; i++) {
            _withdrawSingleTokenLeftovers(_tokens[i]);
        }
    }
}

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
 * are stored in a temporary capsule that is destoyed once the prior owner withdraws them.
 */
contract VestingCapsule is Context, AccessControl {
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    Counters.Counter private _scheduleIdCounter;
    Counters.Counter private _activeCapsuleIdCounter;
    Counters.Counter private _dormantCapsuleIdCounter;

    /**
     * @dev A VestingSchedule represents a uinque graded vesting schedule for a given token.
     * ActiveCapsules refer to VestingSchedules to determine the amount of tokens owned to beneficiaries.
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
     * @dev An ActiveCapsule represents a capsule that has not fully vested. When ownership of an
     * ActiveCapsule is transferred to a new owner, the claimedAmount no longer represents the amount
     * of tokens that have actually been claimed, but rather the total amount of tokens that have vested
     * up until the transfer. The difference between the actual claimed amount and the total vested amount
     * is stuck into a DormantCapusle so the previous owner can still withdraw the tokens that vested
     * under their onwership of the capsule.
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
        uint256 lastClaimedTimestamp;
        uint256 claimedAmount;
    }

    /**
     * @dev A DormantCapsule represents a stake in a capsule that is no longer owned by an address. When an
     * ActiveCapsule is transferred, the tokens that have vested but NOT been claimed are stored in a DormantCapsule.
     * A single address can have several DormantCapsules (one per token) but once one is empty it is deleted.
     * @param token Token to be claimed
     * @param totalAmount Total amount of tokens to be claimed
     * @param claimedAmount Amount of tokens claimed from dormant capsule
     */
    struct DormantCapsule {
        address token;
        uint256 totalAmount;
        uint256 claimedAmount;
    }

    mapping(uint256 => VestingSchedule) private _vestingSchedules;
    // Maps addresses to their active and dormant capsules
    mapping(address => mapping(uint256 => ActiveCapsule))
        private _activeCapsules;
    mapping(address => mapping(uint256 => DormantCapsule))
        private _dormantCapsules;

    // Maps capsules to their owners
    mapping(uint256 => address) private _activeCapsuleOwners;
    mapping(uint256 => address) private _dormantCapsuleOwners;

    // Total amount of tokens locked in capsules
    mapping(address => uint256) private _activeCapsuleValueLocked;
    mapping(address => uint256) private _dormantCapsuleValueLocked;

    // scheduleId -> value locked in active capsules using specific schedule (will be denominated in token)
    mapping(uint256 => uint256) private _valueLockedInSchedules;

    /**
     * @dev Create a new VestingCapsule instance and grant msg.sender TREASURER role.
     */
    constructor() {
        _grantRole(TREASURER_ROLE, msg.sender);
    }

    /**
     * @dev Accessor function for specified VestingSchedule details.
     * @param _scheduleID The ID of the VestingSchedule to be queried.
     * @return The struct values of the vesting schedule
     */
    function getScheduleDetails(uint256 _scheduleID)
        public
        view
        returns (VestingSchedule memory)
    {
        return _vestingSchedules[_scheduleID];
    }

    /**
     * @dev Accessor function for specified ActiveCapsule details.
     * @param _capsuleID The ID of the ActiveCapsule to be queried.
     * @return The struct values of the actve capsule
     */
    function getCapsuleDetails(uint256 _capsuleID)
        public
        view
        returns (ActiveCapsule memory)
    {
        return _activeCapsules[_activeCapsuleOwners[_capsuleID]][_capsuleID];
    }

    /**
     * @dev Accessor function for specified ActiveCapsule owner.
     * @param _capsuleID The ID of the ActiveCapsule to be queried.
     * @return The address of the active capsule owner
     */
    function getActiveCapsuleOwner(uint256 _capsuleID)
        public
        view
        returns (address)
    {
        return _activeCapsuleOwners[_capsuleID];
    }

    /**
     * @dev Accessor function for specified DormantCapsule owner.
     * @param _capsuleID The ID of the DormantCapsule to be queried.
     * @return The address of the dormant capsule owner
     */
    function getDormantCapsuleOwner(uint256 _capsuleID)
        public
        view
        returns (address)
    {
        return _dormantCapsuleOwners[_capsuleID];
    }

    /**
     * @dev Accessor function for specific tokens _activeCapsuleValueLocked value.
     * @param _token The address of the token to be queried
     * @return The total qty locked in active capsules for a given token
     */
    function valueInActiveCapsules(address _token)
        public
        view
        returns (uint256)
    {
        return _activeCapsuleValueLocked[_token];
    }

    /**
     * @dev Accessor function for specific tokens _dormantCapsuleValueLocked value.
     * @param _token The address of the token to be queried
     * @return The total qty locked in dormant capsules for a given token
     */
    function valueInDormantCapsules(address _token)
        public
        view
        returns (uint256)
    {
        return _dormantCapsuleValueLocked[_token];
    }

    /**
     * @dev Sums the _activeCapsuleValueLocked and _dormantCapsuleValueLocked
     * @param _token The address of the token to be queried
     * @return The total qty locked in all capsules for a given token
     */
    function valueLockedInCapsules(address _token)
        public
        view
        returns (uint256)
    {
        return
            _activeCapsuleValueLocked[_token] +
            _dormantCapsuleValueLocked[_token];
    }

    /**
     * @dev Calculates the total amount of tokens that have vested up until a the current time
     * @param _owner The capsules owner address
     * @param _capsuleID The ID of the active capsule to be queried
     * @return The amount of claimable tokens in an active capsule
     */
    function activeCapsuleBalance(address _owner, uint256 _capsuleID)
        public
        view
        returns (uint256)
    {
        ActiveCapsule memory capsule = _activeCapsules[_owner][_capsuleID];
        VestingSchedule memory schedule = _vestingSchedules[capsule.scheduleId];
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
     * @dev Calculates the total amount of tokens remaining in a dormant capsule
     * @param _owner The capsules owner address
     * @param _capsuleID The ID of the dormant capsule to be queried
     * @return The amount of claimable tokens in a dormant capsule
     */
    function dormantCapsuleBalance(address _owner, uint256 _capsuleID)
        public
        view
        returns (uint256)
    {
        DormantCapsule memory capsule = _dormantCapsules[_owner][_capsuleID];
        return capsule.totalAmount - capsule.claimedAmount;
    }

    /**
     * @dev Creates a new VestingSchedule that can be used by future ActiveCapsules.
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

        uint256 currentScheduleId = _scheduleIdCounter.current();
        _scheduleIdCounter.increment();
        _vestingSchedules[currentScheduleId] = VestingSchedule(
            _token,
            _durationSeconds * _tokenRatePerSecond,
            _cliffSeconds,
            _durationSeconds,
            _tokenRatePerSecond
        );
    }

    /**
     * @dev Create a new ActiveCapsule with specified schedule ID for a given address.
     * @param _beneficiary Beneficiary of vesting tokens.
     * @param _scheduleId Schedule ID of the associated vesting schedule.
     * @param _startTime Time at which cliff period begins.
     */
    function createCapsule(
        address _beneficiary,
        uint256 _scheduleId,
        uint256 _startTime
    ) external onlyRole(TREASURER_ROLE) {
        require(
            _beneficiary != address(0),
            "VestingCapsule: Beneficiary cannot be 0x0"
        );
        require(
            _startTime >= block.timestamp,
            "VestingCapsule: Capsule startTime cannot be in the past."
        );
        require(
            _scheduleId < _scheduleIdCounter.current(),
            "VestingCapsule: Invalid scheduleId"
        );
        _createActiveCapsule(_scheduleId, _startTime, _beneficiary);
    }

    /**
     * @dev Allow ActiveCapsule owner to transfer ownership to another address. If the current
     * owner has not claimed all of the vested tokens, a DormantCapsule is created to store
     * remaining tokens owned to the current owner.
     * @param _capsuleID ID of the ActiveCapsule to be transferred.
     * @param _to Address to the list of token beneficiaries.
     */
    function transferCapsule(uint256 _capsuleID, address _to) external {
        require(
            msg.sender != _to,
            "VestingCapsule: Cannot transfer capsule to self."
        );
        require(
            address(0) != _to,
            "VestingCapsule: Cannot transfer capsule to 0x0."
        );
        require(
            _capsuleID < _activeCapsuleIdCounter.current(),
            "VestingCapsule: Invalid capsule ID"
        );
        require(
            msg.sender == _activeCapsuleOwners[_capsuleID],
            "VestingCapsule: Cannot transfer capsule because msg.sender is not the owner."
        );
        ActiveCapsule memory capsule = _activeCapsules[msg.sender][_capsuleID];
        require(
            capsule.endTime > block.timestamp,
            "VestingCapsule: Cannot transfer capsule because it has already been fully vested."
        );

        // Register _to address as new owner to prevent reentry
        _activeCapsuleOwners[_capsuleID] = _to;

        VestingSchedule memory schedule = _vestingSchedules[capsule.scheduleId];

        // Check if the capsule's cliff period has ended
        if (block.timestamp > capsule.startTime + schedule.cliff) {
            uint256 unclaimedVestedAmount = activeCapsuleBalance(
                msg.sender,
                _capsuleID
            );

            if (unclaimedVestedAmount > 0) {
                // Decrease amount locked in schedule & active capsules
                _activeCapsuleValueLocked[
                    schedule.token
                ] -= unclaimedVestedAmount;

                _valueLockedInSchedules[
                    capsule.scheduleId
                ] -= unclaimedVestedAmount;

                // Update capsule values to reflect that they have been "claimed"
                capsule.claimedAmount += unclaimedVestedAmount;
                capsule.lastClaimedTimestamp = block.timestamp;

                _createDormantCapsule(
                    schedule.token,
                    unclaimedVestedAmount,
                    msg.sender
                );
            }
        }
        // Transfer capsule to new owner
        delete _activeCapsules[msg.sender][_capsuleID];
        _activeCapsules[_to][_capsuleID] = capsule;
    }

    /**
     * @dev Tranfers the amount of tokens in an ActiveCapsule that have vested to the owner of the capsule.
     * @param _capsuleID ID of the ActiveCapsule to be claimed.
     */
    function claimActiveCapsule(uint256 _capsuleID) external {
        require(
            msg.sender == _activeCapsuleOwners[_capsuleID],
            "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
        );
        uint256 claimAmount = activeCapsuleBalance(msg.sender, _capsuleID);
        require(
            claimAmount > 0,
            "VestingCapsule: Cannot claim capsule because it has already been emptied."
        );

        ActiveCapsule storage capsule = _activeCapsules[msg.sender][_capsuleID];
        VestingSchedule memory schedule = _vestingSchedules[capsule.scheduleId];

        // Decrease amount locked in active capsules & schedule
        _activeCapsuleValueLocked[schedule.token] -= claimAmount;
        _valueLockedInSchedules[capsule.scheduleId] -= claimAmount;

        if (block.timestamp > capsule.endTime) {
            // Capsule has been emptied so delete it
            delete _activeCapsules[msg.sender][_capsuleID];
            delete _activeCapsuleOwners[_capsuleID];
        } else {
            // Update capsule's claim values
            capsule.claimedAmount += claimAmount;
            capsule.lastClaimedTimestamp = block.timestamp;
        }

        // Transfer tokens to capsule owner
        IERC20(schedule.token).transfer(msg.sender, claimAmount);
    }

    /**
     * @dev Tranfers the amount of tokens in a DormantCapsule to the owner of the capsule.
     * @param _capsuleID ID of the DormantCapsule to be claimed.
     */
    function claimDormantCapsule(uint256 _capsuleID) external {
        require(
            msg.sender == _dormantCapsuleOwners[_capsuleID],
            "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
        );
        DormantCapsule memory capsule = _dormantCapsules[msg.sender][
            _capsuleID
        ];
        require(
            capsule.claimedAmount < capsule.totalAmount,
            "VestingCapsule: Cannot claim capsule because it has already been emptied."
        );

        uint256 claimAmount = capsule.totalAmount - capsule.claimedAmount;

        // Decrease amount locked in dormant capsules
        _dormantCapsuleValueLocked[capsule.token] -= claimAmount;

        // Delete capsule records
        delete _dormantCapsuleOwners[_capsuleID];
        delete _dormantCapsules[msg.sender][_capsuleID];

        // Transfer tokens to capsule owner
        IERC20(capsule.token).transfer(msg.sender, claimAmount);
    }

    /**
     * @dev Creates a new ActiveCapsule for the given address if the contract holds
     * enough tokens to cover the amount of tokens required for the vesting schedule.
     * @param _scheduleId The ID of the schedule to be used for the capsule.
     * @param _startTime The amount of claimable tokens in the capsule.
     * @param _beneficiary Address able to claim the tokens in the capsule.
     */
    function _createActiveCapsule(
        uint256 _scheduleId,
        uint256 _startTime,
        address _beneficiary
    ) internal {
        VestingSchedule memory schedule = _vestingSchedules[_scheduleId];
        require(
            IERC20(schedule.token).balanceOf(address(this)) -
                valueLockedInCapsules(schedule.token) >=
                schedule.amount,
            "VestingCapsule: Contract does not hold enough tokens to create a new capsule."
        );

        // Get current ID and increment
        uint256 currentId = _activeCapsuleIdCounter.current();
        _activeCapsuleIdCounter.increment();

        // Set beneficiary as owner of the dormant capsule
        _activeCapsuleOwners[currentId] = _beneficiary;

        // Increase amount of tokens locked in active capsules
        _activeCapsuleValueLocked[schedule.token] += schedule.amount;
        _valueLockedInSchedules[_scheduleId] += schedule.amount;

        // Save new ActiveCapsule for the address
        _activeCapsules[_beneficiary][currentId] = ActiveCapsule(
            _scheduleId,
            _startTime,
            _startTime + schedule.duration,
            _startTime,
            0
        );
    }

    /**
     * @dev Creates a new DormantCapsule for the given address.
     * @param _token The ERC20 token claimable from the capsule.
     * @param _amount The amount of claimable tokens in the capsule.
     * @param _beneficiary Address able to claim the tokens in the capsule.
     */
    function _createDormantCapsule(
        address _token,
        uint256 _amount,
        address _beneficiary
    ) internal {
        // Get current ID and increment
        uint256 currentId = _dormantCapsuleIdCounter.current();
        _dormantCapsuleIdCounter.increment();

        // Set beneficiary as owner of the dormant capsule
        _dormantCapsuleOwners[currentId] = _beneficiary;

        // Increase amount of tokens locked in dormant capsules
        _dormantCapsuleValueLocked[_token] += _amount;

        // Create a new dormant capsule
        _dormantCapsules[_beneficiary][currentId] = DormantCapsule(
            _token,
            _amount,
            0
        );
    }
}

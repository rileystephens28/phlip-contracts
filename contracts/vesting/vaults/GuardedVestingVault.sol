// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./VestingVault.sol";

/**
 * @title GuardedVestingVault
 * @author Riley Stephens
 * @dev GuardedVestingVault is a role based access-control implementation
 * of the VestingVault protocol. This contract is managed by one or more treasurers
 * and can act as external capsule manager or be extended by other contracts.
 */
contract GuardedVestingVault is AccessControl, VestingVault {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

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
        return _scheduleExists(_scheduleID);
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
        override
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
    ) external override onlyRole(TREASURER_ROLE) {
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
    function createSingleCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) external override onlyRole(TREASURER_ROLE) returns (uint256) {
        return _createSingleCapsule(_owner, _scheduleID, _startTime);
    }

    /**
     * @dev Create multiple new Capsule with specified schedule ID for a given address.
     * @param _owner Single beneficiary of new vesting capsules.
     * @param _scheduleIDs Array of schedule IDs of the associated vesting schedule.
     * @param _startTime Time at which cliff periods begin.
     */
    function createMultiCapsule(
        address _owner,
        uint256[] calldata _scheduleIDs,
        uint256 _startTime
    ) external override onlyRole(TREASURER_ROLE) returns (uint256[] memory) {
        return _createMultiCapsule(_owner, _scheduleIDs, _startTime);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../vesting/VestingVault.sol";

contract VestingVaultMock is VestingVault {
    bool public didProtectedAction;

    constructor() {
        didProtectedAction = false;
    }

    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens that will be deposited from treasurer.
     */
    function fillReserves(uint256 _scheduleID, uint256 _fillAmount) external {
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
    ) external {
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
    ) external returns (uint256) {
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
    ) external returns (uint256[] memory) {
        return _createMultiCapsule(_owner, _scheduleIDs, _startTime);
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
     * @dev Allows capsule owner to delete one of their capsules and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function destroyCapsule(uint256 _capsuleID) external {
        _destroyCapsule(_capsuleID);
    }

    /**
     * @dev Transfers the amount of tokens in one Capsule that have
     * vested to the owner of the capsule.
     * @param _capsuleID ID of the capsule to withdraw from.
     */
    function withdrawCapsuleBalance(uint256 _capsuleID) external {
        _withdrawCapsuleBalance(_capsuleID);
    }

    /**
     * @dev Transfers the amount of tokens leftover owed caller.
     * @param _token ID of the Capsule to be claimed.
     */
    function withdrawTokenLeftovers(address _token) external {
        _withdrawTokenLeftovers(_token);
    }
}

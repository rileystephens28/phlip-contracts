// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title IVestingVault
 * @author Riley Stephens
 * @dev IVestingVault describes the functions required to implement a vesting vault.
 * note - This interface may be split up into single capsule and multi capsule interfaces.
 */
interface IVestingVault {
    /**
     * @dev Accessor function for available reserves of specified schedule.
     * @param _scheduleID The ID of the schedule to be queried.
     * @return The amount of schedule denominated tokens available to create capsules with
     */
    function availableReservesOf(uint256 _scheduleID)
        external
        view
        returns (uint256);

    /**
     * @dev Calculates amount of schedule reserves locked in capsules
     * @param _scheduleID The ID of the schedule to be queried.
     * @return The amount of schedule denominated tokens locked in capsules
     */
    function lockedReservesOf(uint256 _scheduleID)
        external
        view
        returns (uint256);

    /**
     * @dev Accessor function for leftover reserves of specified token.
     * @param _token The address of the token to be queried.
     * @return The amount of specified tokens waiting to be withdrawn (no longer in capsules)
     */
    function leftoverReservesOf(address _token) external view returns (uint256);

    /**
     * @dev Accessor function for checking if capsule has expired and been claimed.
     * Note - capsules that do not actually exist are also considered inactive.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return True if capsule exists and has not been fully claimed, False otherwise.
     */
    function isCapsuleActive(uint256 _capsuleID) external view returns (bool);

    /**
     * @dev Accessor function for specified Capsule owner.
     * @param _capsuleID The ID of the Capsule to be queried.
     * @return The address of the capsule owner
     */
    function capsuleOwnerOf(uint256 _capsuleID) external view returns (address);

    /**
     * @dev Accessor function for amount of tokens that have vested for a given capsule.
     * @param _capsuleID The ID of the capsule to be queried
     * @return The amount of claimable tokens in a capsule
     */
    function vestedBalanceOf(uint256 _capsuleID)
        external
        view
        returns (uint256);

    /**
     * @dev Accessor function for previous capsule owners leftover balance of given token.
     * @param _prevOwner The address of previous owner whose balance to query
     * @param _token The address of a token to query
     * @return The amount of specified tokens leftover after capsule transfer
     */
    function leftoverBalanceOf(address _prevOwner, address _token)
        external
        view
        returns (uint256);

    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens that will be deposited from treasurer.
     */
    function fillReserves(uint256 _scheduleID, uint256 _fillAmount) external;

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
    ) external;

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
    ) external returns (uint256);

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
    ) external returns (uint256[] memory);

    /**
     * @dev Allows capsule owner to delete one of their capsules and release its funds back to reserves.
     * @param _capsuleID Capsule ID to delete.
     */
    function destroySingleCapsule(uint256 _capsuleID) external;

    /**
     * @dev Destroys a batch of Capsules owned by the caller.
     * @param _capsuleIDs Array of capsule IDs to destoy.
     */
    function destroyMultiCapsule(uint256[] calldata _capsuleIDs) external;

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleID ID of the Capsule to be transferred.
     * @param _to Address to transfer to.
     */
    function transferSingleCapsule(uint256 _capsuleID, address _to) external;

    /**
     * @dev Transfers capsule ownership to a new address.
     * @param _capsuleIDs Array of capsule IDs to transfer.
     * @param _to Address to transfer to.
     */
    function transferMultiCapsule(uint256[] calldata _capsuleIDs, address _to)
        external;

    /**
     * @dev Transfers the amount of tokens in one Capsule that have
     * vested to the owner of the capsule.
     * @param _capsuleID ID of the capsule to withdraw from.
     */
    function withdrawSingleCapsule(uint256 _capsuleID) external;

    /**
     * @dev Transfers the amount of tokens in several capsules that have
     * vested to the owners of the capsules.
     * @param _capsuleIDs Array of capsule IDs to withdraw from.
     */
    function withdrawMultiCapsule(uint256[] calldata _capsuleIDs) external;

    /**
     * @dev Transfers the amount of tokens leftover owed caller.
     * @param _token ID of the Capsule to be claimed.
     */
    function withdrawSingleTokenLeftovers(address _token) external;

    /**
     * @dev Withdraw leftovers of several tokens owed to caller.
     * @param _tokens Array of token address to withdraw from leftover reserves.
     */
    function withdrawMultiTokenLeftovers(address[] calldata _tokens) external;
}

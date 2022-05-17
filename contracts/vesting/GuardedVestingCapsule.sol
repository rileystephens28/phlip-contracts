// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "../interfaces/IVestingTreasury.sol";
import "./VestingCapsule.sol";

/**
 * @title GuardedVestingCapsule
 * @author Riley Stephens
 * @dev The GuardedVestingCapsule is an implementation of a VestingCapsule that supports
 * treasury management of vesting shedules and their respective reserves.
 *
 * NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.
 */
abstract contract GuardedVestingCapsule is
    IVestingTreasury,
    VestingCapsule,
    AccessControl
{
    // Role required for filling reserves and creating schedules
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    /***********************************|
    |       Treasurer Functions         |
    |__________________________________*/

    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _filler Address that holds tokens to be deposited.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens that will be deposited from treasurer.
     */
    function fillReserves(
        address _filler,
        uint256 _scheduleID,
        uint256 _fillAmount
    ) external onlyRole(TREASURER_ROLE) {
        _fillReserves(_filler, _scheduleID, _fillAmount);
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
    function withdrawAvailableReserves(address _to, uint256 _scheduleID)
        external
        onlyRole(TREASURER_ROLE)
    {
        _withdrawAvailableReserves(_to, _scheduleID);
    }

    /**
     * @dev Creates a new VestingSchedule that can be used by future Capsules.
     * @param _token The token to be vested.
     * @param _cliff The number of seconds after schedule starts and vesting begins.
     * @param _duration The number of seconds until vesting ends.
     * @param _amount Desired amount of tokens (10^18 denominated) to be vested.
     * Ex: If the schedule should vest 100 tokens, _amount should be 100000000000000000000
     * @return The ID of the newly created vesting schedule.
     */
    function createVestingSchedule(
        address _token,
        uint256 _cliff,
        uint256 _duration,
        uint256 _amount
    ) external onlyRole(TREASURER_ROLE) returns (uint256) {
        return _createSchedule(_token, _cliff, _duration, _amount);
    }

    /**
     * @dev Getter function for checking if specified schedule is registered.
     * @param _scheduleID The ID of the VestingSchedule to query.
     * @return True if the schedule is registered, false otherwise.
     */
    function scheduleExists(uint256 _scheduleID)
        public
        view
        override(VestingVault, IVestingTreasury)
        returns (bool)
    {
        return super.scheduleExists(_scheduleID);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

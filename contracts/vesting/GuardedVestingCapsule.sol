// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./VestingCapsule.sol";

/**
 * @title GuardedVestingCapsule
 * @author Riley Stephens
 * @dev The GuardedVestingCapsule is an implementation of a VestingCapsule that supports
 * treasury management of vesting shedules and their respective reserves.
 *
 * NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.
 */
abstract contract GuardedVestingCapsule is VestingCapsule, AccessControl {
    // Role required for filling reserves and creating schedules
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

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
        _fillReserves(msg.sender, _scheduleID, _fillAmount);
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

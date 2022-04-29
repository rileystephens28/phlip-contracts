// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IVestingTreasury
 * @author Riley Stephens
 * @dev Describes the functions required to implement a vesting treasury.
 */
interface IVestingTreasury {
    /**
     * @dev Deposits tokens to schedule reserves for future capsules.
     * @param _filler Address that holds tokens to be deposited.
     * @param _scheduleID The ID of the schedule to fill.
     * @param _fillAmount Amount of tokens (10^18 denominated) that will be deposited from treasurer.
     */
    function fillReserves(
        address _filler,
        uint256 _scheduleID,
        uint256 _fillAmount
    ) external;

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
    ) external returns (uint256);
}

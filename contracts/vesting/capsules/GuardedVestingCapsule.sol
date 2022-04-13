// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
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
contract GuardedVestingCapsule is VestingCapsule, AccessControl {
    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE");

    /**
     * @dev Create a new CapsuleManager instance and grant msg.sender TREASURER role.
     */
    constructor(string memory _name, string memory _symbol)
        VestingCapsule(_name, _symbol)
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(TREASURER_ROLE, msg.sender);
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

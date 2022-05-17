// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;
import "@openzeppelin/contracts/utils/Counters.sol";
import "../vesting/VestingCapsule.sol";

contract VestingCapsuleMock is VestingCapsule {
    using Counters for Counters.Counter;

    Counters.Counter public tokenIds;

    constructor() ERC721("VestingCapsuleMock", "VEST") {}

    function fillReserves(uint256 _scheduleID, uint256 _fillAmount) external {
        _fillReserves(msg.sender, _scheduleID, _fillAmount);
    }

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

    function mint(
        address _to,
        uint256 _startTime,
        uint256[] calldata _scheduleIDs
    ) external {
        uint256 id = tokenIds.current();
        tokenIds.increment();
        _mint(_to, id);
        _createCapsuleGroup(id, _to, _startTime, _scheduleIDs);
    }

    function burn(uint256 _id) external {
        _burn(_id);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "../vesting/VestingVault.sol";

contract VestingVaultMock is VestingVault {
    bool public didProtectedAction;

    constructor() {
        didProtectedAction = false;
    }

    function fillReserves(
        address _filler,
        uint256 _scheduleID,
        uint256 _fillAmount
    ) external {
        _fillReserves(_filler, _scheduleID, _fillAmount);
    }

    function withdrawAvailableReserves(address _to, uint256 _scheduleID)
        external
    {
        _withdrawAvailableReserves(_to, _scheduleID);
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

    function safeCreateCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) external returns (uint256) {
        return _safeCreateCapsule(_owner, _scheduleID, _startTime);
    }

    function createCapsule(
        address _owner,
        uint256 _scheduleID,
        uint256 _startTime
    ) external returns (uint256) {
        return _createCapsule(_owner, _scheduleID, _startTime);
    }

    function safeTransferCapsule(uint256 _capsuleID, address _to) external {
        _safeTransferCapsule(msg.sender, _to, _capsuleID);
    }

    function transferCapsule(uint256 _capsuleID, address _to) external {
        _transferCapsule(msg.sender, _to, _capsuleID);
    }

    function safeDestroyCapsule(uint256 _capsuleID) external {
        _safeDestroyCapsule(_capsuleID, msg.sender);
    }

    function destroyCapsule(uint256 _capsuleID) external {
        _destroyCapsule(_capsuleID, msg.sender);
    }

    function withdrawCapsuleBalance(uint256 _capsuleID)
        external
        returns (bool)
    {
        return _withdrawCapsuleBalance(_capsuleID, msg.sender);
    }

    function withdrawTokenLeftovers(address _token) external {
        _withdrawTokenLeftovers(_token, msg.sender);
    }
}

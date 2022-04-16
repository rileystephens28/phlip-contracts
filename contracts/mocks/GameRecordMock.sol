// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../gameRecords/GameRecord.sol";

contract GameRecordMock is GameRecord {
    function createGameRecord(uint256 _id) public {
        _createGameRecord(_id);
    }

    function recordNoRewardWin(uint256 _id) public {
        _recordWin(_id);
    }

    function recordTokenWin(
        uint256 _id,
        address _token,
        uint256 _amount
    ) public {
        _recordTokenWin(_id, _token, _amount);
    }

    function recordEthWin(uint256 _id, uint256 _amount) public {
        _recordEthWin(_id, _amount);
    }

    function recordLoss(uint256 _id) public {
        _recordLoss(_id);
    }
}

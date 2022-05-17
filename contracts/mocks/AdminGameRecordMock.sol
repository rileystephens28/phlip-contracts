// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "../gameRecords/AdminGameRecord.sol";

/**
 * @title AdminGameRecordMock
 * @author Riley Stephens
 * @dev Mock contract for AdminGameRecorder.
 */
contract AdminGameRecordMock is AdminGameRecord {
    constructor() AdminGameRecord() {}

    /**
     * @dev External function to create a game record
     * @param _newRecordID The ID of new record to create
     */
    function createGameRecord(uint256 _newRecordID)
        external
        onlyRole(RECORDER_ROLE)
    {
        // Create a game record for the new card
        _createGameRecord(_newRecordID);
    }
}

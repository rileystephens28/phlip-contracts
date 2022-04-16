// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GameRecord.sol";

/**
 * @title AdminGameRecord
 * @author Riley Stephens
 * @dev Contract that provides default game recording functionality with role based access control.
 */
abstract contract AdminGameRecord is AccessControl, GameRecord {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    /**
     * @dev Records a game win (NO REWARDS)
     * @param _id The ID of the token to record.
     */
    function recordWin(uint256 _id) external onlyRole(RECORDER_ROLE) {
        _recordWin(_id);
    }

    /**
     * @dev Records a game win (ETH REWARDS)
     * @param _id The ID of the token to record.
     * @param _amount The amount of ETH won.
     */
    function recordWin(uint256 _id, uint256 _amount)
        external
        onlyRole(RECORDER_ROLE)
    {
        _recordEthWin(_id, _amount);
    }

    /**
     * @dev Records a game win (TOKEN REWARDS)
     * @param _id The ID of the token to record.
     * @param _token The address of token rewarded for winning.
     * @param _amount The amount of tokens won.
     */
    function recordWin(
        uint256 _id,
        address _token,
        uint256 _amount
    ) external onlyRole(RECORDER_ROLE) {
        _recordTokenWin(_id, _token, _amount);
    }

    /**
     * @dev Records a game loss for a given token
     * @param _id The ID of the token to record.
     */
    function recordLoss(uint256 _id) external onlyRole(RECORDER_ROLE) {
        _recordLoss(_id);
    }
}

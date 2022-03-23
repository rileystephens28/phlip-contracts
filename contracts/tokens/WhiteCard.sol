// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @notice Implementation of a PhlipCard with with basic game recording functionality.
 */
contract WhiteCard is PhlipCard {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

    struct GameRecord {
        uint256 wins;
        uint256 losses;
    }

    mapping(uint256 => GameRecord) private _gameRecords;

    constructor(
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress
    )
        PhlipCard(
            "Phlip White Card",
            "WPC",
            _baseUri,
            _maxDownvotes,
            _maxUriChanges,
            _minDaoTokensRequired,
            _daoTokenAddress
        )
    {
        _grantRole(RECORDER_ROLE, msg.sender);
    }

    /**
     * @notice Record token game win.
     * @param _tokenID The ID of the token to record.
     */
    function recordWin(uint256 _tokenID)
        external
        tokenExists(_tokenID)
        onlyRole(RECORDER_ROLE)
    {
        // NOTE - Should we explicitly prevent recording wins on unplayable cards?
        GameRecord storage game = _gameRecords[_tokenID];
        game.wins += 1;
    }

    /**
     * @notice Record token game loss.
     * @param _tokenID The ID of the token to record.
     */
    function recordLoss(uint256 _tokenID)
        external
        tokenExists(_tokenID)
        onlyRole(RECORDER_ROLE)
    {
        // NOTE - Should we explicitly prevent recording losses on unplayable cards?
        GameRecord storage game = _gameRecords[_tokenID];
        game.losses += 1;
    }
}

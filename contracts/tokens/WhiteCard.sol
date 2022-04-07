// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";
import "../extensions/GameRecord.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard with with basic game recording functionality.
 */
contract WhiteCard is PhlipCard, GameRecord {
    bytes32 public constant RECORDER_ROLE = keccak256("RECORDER_ROLE");

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
     * @dev Overrides PhlipCard._mintCard() to include game recording functionality.
     * @param _cardID The ID of card being minted
     * @param _to The address to mint card to
     * @param _uri The IPFS CID referencing the new card's metadata
     */
    function _mintCard(
        uint256 _cardID,
        address _to,
        string memory _uri
    ) internal override {
        super._mintCard(_cardID, _to, _uri);

        // Create a ballot for the new card
        _createGameRecord(_cardID);
    }

    /**
     * @dev Records a game win (NO REWARDS)
     * @param _cardID The ID of the card to record.
     */
    function recordWin(uint256 _cardID) external onlyRole(RECORDER_ROLE) {
        // NOTE - Should we explicitly prevent recording wins on unplayable cards?
        _recordWin(_cardID);
    }

    /**
     * @dev Records a game win (ETH REWARDS)
     * @param _cardID The ID of the card to record.
     * @param _amount The amount of ETH won.
     */
    function recordWin(uint256 _cardID, uint256 _amount)
        external
        onlyRole(RECORDER_ROLE)
    {
        // NOTE - Should we explicitly prevent recording wins on unplayable cards?
        _recordEthWin(_cardID, _amount);
    }

    /**
     * @dev Records a game win (TOKEN REWARDS)
     * @param _cardID The ID of the card to record.
     * @param _token The address of token rewarded for winning.
     * @param _amount The amount of tokens won.
     */
    function recordWin(
        uint256 _cardID,
        address _token,
        uint256 _amount
    ) external onlyRole(RECORDER_ROLE) {
        // NOTE - Should we explicitly prevent recording wins on unplayable cards?
        _recordTokenWin(_cardID, _token, _amount);
    }

    /**
     * @dev Records a game loss for a given card
     * @param _cardID The ID of the card to record.
     */
    function recordLoss(uint256 _cardID) external onlyRole(RECORDER_ROLE) {
        // NOTE - Should we explicitly prevent recording losses on unplayable cards?
        _recordLoss(_cardID);
    }
}

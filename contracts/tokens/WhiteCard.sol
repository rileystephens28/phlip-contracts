// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";
import "../presets/AdminGameRecord.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard with with basic game recording functionality.
 */
contract WhiteCard is PhlipCard, AdminGameRecord {
    constructor(
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress,
        address _vestingCapsuleAddress
    )
        PhlipCard(
            "Phlip White Card",
            "WPC",
            _baseUri,
            _maxDownvotes,
            _maxUriChanges,
            _minDaoTokensRequired,
            _daoTokenAddress,
            _vestingCapsuleAddress
        )
        AdminGameRecord()
    {}

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

        // Create a game record for the new card
        _createGameRecord(_cardID);
    }

    /**
     * @dev Override of PhlipCard and AccessControl supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(PhlipCard, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

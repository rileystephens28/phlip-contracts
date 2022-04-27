// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./PhlipCard.sol";
import "../interfaces/IBlankCard.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard that supports text and blank cards.
 */
contract WhiteCard is PhlipCard {
    using Counters for Counters.Counter;

    // Possible data types of a card
    enum CardType {
        TEXT,
        BLANK
    }

    // Token ID => Card type (text or blank)
    mapping(uint256 => CardType) private _cardTypes;

    constructor(string memory _baseUri, uint256 _maxUriChanges)
        PhlipCard("Phlip White Card", "WPC", _baseUri, _maxUriChanges)
    {}

    /**
     * @dev Accessor function for getting card's URI from ID
     * Override to return empty string if card is blank
     * @param _tokenId ID of the card to get URI of
     * @return URI of the card
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        if (_cardTypes[_tokenId] == CardType.BLANK) {
            return "";
        }

        return super.tokenURI(_tokenId);
    }

    /***********************************|
    |        External Functions         |
    |__________________________________*/

    /**
     * @dev Override PhlipCard.updateMetadata to prevent blank
     * cards from setting their URI.
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateMetadata(uint256 _cardID, string memory _uri)
        public
        virtual
        override
    {
        require(
            _cardTypes[_cardID] == CardType.TEXT,
            "WhiteCard: Cannot update blank card URI"
        );
        super.updateMetadata(_cardID, _uri);
    }

    /**
     * @dev Mint card with ID that has been reserved by the callers voucher
     * Requires that caller has >=1 remaining card vouchers.
     * @param _reservedID ID reserved by the callers voucher
     * @param _uri URI of text card (pass empty string for blank cards)
     */
    function redeemVoucher(uint256 _reservedID, string memory _uri)
        public
        virtual
        override
    {
        if (_cardTypes[_reservedID] == CardType.BLANK) {
            super.redeemVoucher(_reservedID, "");
        } else {
            require(bytes(_uri).length > 0, "WhiteCard: URI cannot be empty");
            super.redeemVoucher(_reservedID, _uri);
        }
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Override of PhlipCard._setCardType to handle setting
     * card to type TEXT or BLANK.
     * @param _cardID The ID of card whose type to set
     * @param _type Int type of card (0 - text, 1 - blank)
     */
    function _setCardType(uint256 _cardID, uint256 _type)
        internal
        virtual
        override
    {
        require(_type < 2, "WhiteCard: Invalid card type");
        _cardTypes[_cardID] = CardType(_type);
    }

    /**
     * @dev Override of PhlipCard._setCardType to handle accessing
     * whether card is a TEXT or BLANK card.
     * @param _cardID The ID of card whose type to set
     * @return Integer type of card (0 - text, 1 - blank)
     */
    function _getCardType(uint256 _cardID)
        internal
        view
        virtual
        override
        returns (uint256)
    {
        return uint256(_cardTypes[_cardID]);
    }
}

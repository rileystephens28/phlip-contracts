// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./PhlipCard.sol";

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

    /**
     * @dev Create a new instance of the WhiteCard contract.
     *
     * Requirements:
     *
     * - `_baseUri` cannot be blank.
     * - `_maxUriChanges` must be >= 1.
     */
    constructor(string memory _baseUri, uint256 _maxUriChanges)
        PhlipCard("Phlip White Card", "WPC", _baseUri, _maxUriChanges)
    {}

    /**
     * @dev Accessor function for getting card's URI from ID
     * Override to return empty string if card is blank
     *
     * Requirements:
     *
     * - `_tokenId` must exist.
     *
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
     *
     * Requirements:
     *
     * - `_cardID` must exist.
     * - `_cardID` cannot be a blank card.
     * - `_uri` cannot be blank.
     * - `msg.sender` must be owner of `_cardID`
     * - `msg.sender` must be minter of `_cardID`
     * - card's `_metadataChangeCount` must be < `MAX_URI_CHANGES`
     *
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
     *
     * Requirements:
     *
     * - `_uri` cannot be blank when redeeming text cards.
     * - `msg.sender` has >= 1 `_remainingVouchers`.
     * - `_paused` must be false.
     *
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
     *
     * Requirements:
     *
     * - `_type` must be one of 0 (text) or 1 (blank).
     *
     * @param _cardID The ID of card whose type to set
     * @param _type Integer corresponding to card type of card (0 or 1)
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
     * @dev Override of PhlipCard._setCardType to handle
     * TEXT or BLANK card logic.
     * @param _cardID The ID of card to query
     * @return Integer corresponding to card type of card (0 or 1)
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

// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./PhlipCard.sol";

/**
 * @title PinkCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard that supports text and image cards.
 */
contract PinkCard is PhlipCard {
    using Counters for Counters.Counter;

    // Possible data types of a card
    enum CardType {
        TEXT,
        IMAGE
    }

    // Token ID => Card type (text or image)
    mapping(uint256 => CardType) private _cardTypes;

    constructor(string memory _baseUri, uint256 _maxUriChanges)
        PhlipCard("Phlip Pink Card", "PPC", _baseUri, _maxUriChanges)
    {}

    /***********************************|
    |        External Functions         |
    |__________________________________*/

    /**
     * @dev Mint card with ID that has been reserved by the callers voucher
     * Requires that caller has >=1 remaining card vouchers.
     * @param _reservedID ID reserved by the callers voucher
     * @param _uri Should be left blank. Only used to match interface function signature.
     */
    function redeemVoucher(uint256 _reservedID, string memory _uri)
        public
        virtual
        override
    {
        // Passes empty uri
        require(bytes(_uri).length > 0, "PinkCard: URI cannot be empty");
        super.redeemVoucher(_reservedID, _uri);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Override of PhlipCard._setCardType to handle setting
     * card to type TEXT or IMAGE.
     * @param _cardID The ID of card whose type to set
     * @param _type Int type of card (0 - text, 1 - image)
     */
    function _setCardType(uint256 _cardID, uint256 _type)
        internal
        virtual
        override
    {
        require(_type < 2, "PinkCard: Invalid card type");
        _cardTypes[_cardID] = CardType(_type);
    }

    /**
     * @dev Override of PhlipCard._setCardType to handle accessing
     * whether card is a TEXT or IMAGE card.
     * @param _cardID The ID of card whose type to set
     * @return Integer type of card (0 - text, 1 - image, etc)
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

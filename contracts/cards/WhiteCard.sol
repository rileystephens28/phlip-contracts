// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/utils/Counters.sol";
import "./PhlipCard.sol";
import "./IBlankCard.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard that supports text and blank cards.
 */
contract WhiteCard is PhlipCard, IBlankCard {
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

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function to get type of card
     * @param _cardID The ID of the card to check
     * @return 0 if blank, 1 if blank
     */
    function typeOf(uint256 _cardID) public view returns (uint256) {
        return uint256(_cardTypes[_cardID]);
    }

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
    |      Minter Admin Functions       |
    |__________________________________*/

    /**
     * @dev Allow minter to mint a blank card to a given address.
     * @param _to The address to mint to.
     */
    function mintBlankCard(address _to) external onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 tokenId = _tokenIds.current();
        _tokenIds.increment();

        // Mint card for _to address
        _mintCard(tokenId, _to, "");
        _cardTypes[tokenId] = CardType.BLANK;
    }

    /**
     * @dev Allow minter to issue a blank card voucher to a given address.
     * @param _to The address to issue voucher to.
     */
    function issueBlankCardVoucher(address _to) external onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 reservedTokenId = _tokenIds.current();
        _tokenIds.increment();

        // Issue voucher for reserved token ID
        _issueVoucher(_to, reservedTokenId);
        _cardTypes[reservedTokenId] = CardType.BLANK;
    }

    /**
     * @dev Allow minter to issue many blank card vouchers to a given address.
     * @param _to The address to mint tokens to.
     * @param _amount The number of card vouchers to issue.
     */
    function batchIssueBlankCardVouchers(address _to, uint256 _amount)
        external
        onlyRole(MINTER_ROLE)
    {
        for (uint256 i = 0; i < _amount; i++) {
            // Get the next token ID then increment the counter
            uint256 reservedTokenId = _tokenIds.current();
            _tokenIds.increment();
            _issueVoucher(_to, reservedTokenId);
            _cardTypes[reservedTokenId] = CardType.BLANK;
        }
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
        require(_cardTypes[_cardID] == CardType.TEXT, "Cant update blank card");
        super.updateMetadata(_cardID, _uri);
    }

    /**
     * @dev Mint card with ID that has been reserved by the callers voucher
     * Requires that caller has >=1 remaining card vouchers.
     * @param _reservedID ID reserved by the callers voucher
     * @param _uri Should be left blank. Only used to match super function signature.
     */
    function redeemVoucher(uint256 _reservedID, string memory _uri)
        public
        virtual
        override
    {
        // Passes empty uri
        super.redeemVoucher(_reservedID, "");
    }
}

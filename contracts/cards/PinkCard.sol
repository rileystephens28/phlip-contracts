// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";

/**
 * @title PinkCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard that supports text and image cards.
 */
contract PinkCard is PhlipCard {
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
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function to get type of card
     * @param _cardID The ID of the card to check
     * @return 0 if image, 1 if image
     */
    function typeOf(uint256 _cardID) public view returns (uint256) {
        return uint256(_cardTypes[_cardID]);
    }

    /***********************************|
    |      Minter Admin Functions       |
    |__________________________________*/

    /**
     * @dev Allow minter to mint a image card to a given address.
     * @param _to The address to mint to.
     * @param _uri The IPFS CID referencing the new cards image metadata.
     */
    function mintImageCard(address _to, string memory _uri)
        external
        onlyRole(MINTER_ROLE)
    {
        // Get the next token ID then increment the counter
        uint256 tokenId = _tokenIds.current();
        _tokenIds.increment();

        // Mint card for _to address
        _mintCard(tokenId, _to, _uri);
        _cardTypes[tokenId] = CardType.IMAGE;
    }

    /**
     * @dev Allow minter to issue a image card voucher to a given address.
     * @param _to The address to issue voucher to.
     */
    function issueImageCardVoucher(address _to) external onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 reservedTokenId = _tokenIds.current();
        _tokenIds.increment();

        // Issue voucher for reserved token ID
        _issueVoucher(_to, reservedTokenId);
        _cardTypes[reservedTokenId] = CardType.IMAGE;
    }

    /**
     * @dev Allow minter to issue many image card vouchers to a given address.
     * @param _to The address to mint tokens to.
     * @param _amount The number of card vouchers to issue.
     */
    function batchIssueImageCardVouchers(address _to, uint256 _amount)
        external
        onlyRole(MINTER_ROLE)
    {
        for (uint256 i = 0; i < _amount; i++) {
            // Get the next token ID then increment the counter
            uint256 reservedTokenId = _tokenIds.current();
            _tokenIds.increment();
            _issueVoucher(_to, reservedTokenId);
            _cardTypes[reservedTokenId] = CardType.IMAGE;
        }
    }
}

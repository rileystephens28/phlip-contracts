// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IPhlipCard
 * @author Riley Stephens
 * @dev Functionality required to be considered a basic Phlip card.
 */
interface IPhlipCard {
    /**
     * @dev Accessor function to get address of card minter
     * @param _cardID The ID of the card to check
     * @return Address that minted the card
     */
    function minterOf(uint256 _cardID) external view returns (address);

    /**
     * @dev Accessor function to get type of card
     * @param _cardID The ID of the card to check
     * @return Int corresponding to the type of card
     * Example: 0 if text, 1 if image
     */
    function typeOf(uint256 _cardID) external view returns (uint256);

    /**
     * @dev Accessor function for getting card's URI from ID
     * Modified implementation of ERC721URIStorage.tokenURI
     * @param _tokenId ID of the card to get URI of
     * @return URI of the card
     */
    function tokenURI(uint256 _tokenId) external view returns (string memory);

    /**
     * @dev Transfer creatorship of a card to a new address.
     * @param _to The address to transfer creatorship to.
     * @param _cardID ID of the card whose creatorship to transfer
     */
    function transferCreatorship(address _to, uint256 _cardID) external;

    /**
     * @dev Allows owner of a card to update the URI of their card.
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateMetadata(uint256 _cardID, string memory _uri)
        external
        payable;

    /**
     * @dev Issue a card voucher to a given address.
     * @param _to The address to issue voucher to.
     * @param _type The type of card voucher can be redeemed for (text, image, blank, etc)
     * @param _scheduleIDs Array of vesting schedule IDs to create future card with
     */
    function issueCardVoucher(
        address _to,
        uint256 _type,
        uint256[] calldata _scheduleIDs
    ) external;

    /**
     * @dev Mint a card to a given address.
     * @param _to The address to mint to.
     * @param _uri The IPFS CID referencing the new cards text metadata.
     * @param _type Int type of card to mint (text, image, blank, etc)
     * @param _scheduleIDs Array of vesting schedule IDs to create card's vesting capsules from
     */
    function mintCard(
        address _to,
        string memory _uri,
        uint256 _type,
        uint256[] calldata _scheduleIDs
    ) external;
}

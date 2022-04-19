// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title IBaseCard
 * @author Riley Stephens
 * @dev Functionality required to be considered a basic Phlip card.
 */
interface IBaseCard {
    /**
     * @dev Accessor function to get address of card minter
     * @param _cardID The ID of the card to check
     * @return Address that minted the card
     */
    function minterOf(uint256 _cardID) external view returns (address);

    /**
     * @dev Transfer creatorship of a card to a new address.
     * @param _to The address to transfer creatorship to.
     * @param _cardID ID of the card whose creatorship to transfer
     */
    function transferCreatorship(address _to, uint256 _cardID) external;

    /**
     * @dev Allows MINTER to set the base URI for all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI) external;

    /**
     * @dev Allows Settings Admin to set max number of times minter can change the URI of a card.
     * @param _newMax New max changes allowed
     */
    function setMaxUriChanges(uint256 _newMax) external;

    /**
     * @dev Allows MINTER to set the address of the PhlipDAO token contract
     * @param _ids New contract address
     */
    function setVestingScheme(uint256[] calldata _ids) external;

    /**
     * @dev Allows owner of a card to update the URI of their card.
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateMetadata(uint256 _cardID, string memory _uri) external;
}

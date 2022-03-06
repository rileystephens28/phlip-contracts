// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

interface IPhlipCard {
    /**
     * @dev Prevent the card from being transfered or interacted with.
     */
    function pause() external;

    /**
     * @dev Allow the card to be transfered and interacted with again.
     */
    function unpause() external;

    /**
     * @dev Add address to the list of addresses that can not interact with cards.
     */
    function blacklistAddress(address _address) external;

    /**
     * @dev Remove address from the list of addresses that can not interact with cards.
     */
    function unblacklistAddress(address _address) external;

    /**
     * @dev Register a new claim of a specified amount to an address.
     */
    function createClaim(address _address, uint256 _amount) external;

    /**
     * @dev Increase the size of an existing address' claim by a specified amount.
     */
    function increaseClaim(address _address, uint256 _amount) external;

    /**
     * @dev Mint a new card to an address. Implementation should use role-based access control.
     */
    function mintCard(address _to, string memory _uri) external;

    /**
     * @dev Mints card to an address and reduces the claim amount by 1.
     */
    function redeemCard(address _address) external;

    /**
     * @dev Updates the URI of an existing token. If the current owner of the token is
     * not the minter, this function should revert.
     */
    function updateCardURI(uint256 _tokenID, string memory _uri) external;

    /**
     * @dev Record the upvote of a specified address on a specified token.
     */
    function upVote(uint256 _tokenID) external;

    /**
     * @dev Record the downvote of a specified address on a specified token.
     */
    function downVote(uint256 _tokenID) external;

    /**
     * @dev Set the max number of downvotes a card can have before it is marked unplayable.
     */
    function setDownVoteMax(uint256 _newMax) external;
}

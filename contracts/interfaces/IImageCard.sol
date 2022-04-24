// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IImageCard
 * @author Riley Stephens
 * @dev Functionality required to for implmenting Phlip image card.
 */
interface IImageCard {
    /**
     * @dev Mint a image card to a given address.
     * @param _to The address to mint to.
     * @param _uri The IPFS CID referencing the new cards image metadata.
     */
    function mintImageCard(address _to, string memory _uri) external;

    /**
     * @dev Issue a image card voucher to a given address.
     * @param _to The address to issue voucher to.
     */
    function issueImageCardVoucher(address _to) external;

    /**
     * @dev Issue many image card vouchers to a given address.
     * @param _to The address to mint tokens to.
     * @param _amount The number of card vouchers to issue.
     */
    function batchIssueImageCardVouchers(address _to, uint256 _amount) external;
}

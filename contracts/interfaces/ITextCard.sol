// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title ITextCard
 * @author Riley Stephens
 * @dev Functionality required to for implmenting Phlip text card.
 */
interface ITextCard {
    /**
     * @dev Mint a text card to a given address.
     * @param _to The address to mint to.
     * @param _uri The IPFS CID referencing the new cards text metadata.
     */
    function mintTextCard(address _to, string memory _uri) external;

    /**
     * @dev Issue a text card voucher to a given address.
     * @param _to The address to issue voucher to.
     */
    function issueTextCardVoucher(address _to) external;

    /**
     * @dev Issue many text card vouchers to a given address.
     * @param _to The address to mint tokens to.
     * @param _amount The number of card vouchers to issue.
     */
    function batchIssueTextCardVouchers(address _to, uint256 _amount) external;
}

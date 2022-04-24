// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

/**
 * @title IBlankCard
 * @author Riley Stephens
 * @dev Functionality required to for implmenting Phlip blank card.
 */
interface IBlankCard {
    /**
     * @dev Mint a blank card to a given address.
     * @param _to The address to mint to.
     */
    function mintBlankCard(address _to) external;

    /**
     * @dev Issue a blank card voucher to a given address.
     * @param _to The address to issue voucher to.
     */
    function issueBlankCardVoucher(address _to) external;

    /**
     * @dev Issue many blank card vouchers to a given address.
     * @param _to The address to mint tokens to.
     * @param _amount The number of card vouchers to issue.
     */
    function batchIssueBlankCardVouchers(address _to, uint256 _amount) external;
}

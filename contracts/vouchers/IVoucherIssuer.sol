// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title IVoucherIssuer
 * @author Riley Stephens
 * @dev The IVoucherIssuer interface is used to define the functions that a
 * voucher issuing contract must implement. Inheriting contracts should practice
 * access-control for managing the issuance and redemption of vouchers.
 *
 */
interface IVoucherIssuer {
    /**
     * @dev Issue a voucher to an address.
     * @param _to The address to check.
     */
    function issueVoucher(address _to) external;

    /**
     * @dev Issue many vouchers to an address.
     * @param _to The address to check.
     */
    function issueVouchers(address _to, uint256 _amount) external;

    /**
     * @dev Redeem a voucher.
     * @param _id ID associated with the voucher to redeem.
     */
    function redeemVoucher(uint256 _id) external;

    /**
     * @dev Redeem many vouchers.
     * @param _ids Array of IDs associated with the vouchers to redeem.
     */
    function redeemVouchers(uint256[] calldata _ids) external;
}

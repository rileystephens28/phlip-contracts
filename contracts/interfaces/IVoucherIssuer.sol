// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

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
     * @dev Accessor function to see if an address has any vouchers.
     * @param _address The address to check.
     * @return Whether or not the address has >= 1 vouchers
     */
    function hasVoucher(address _address) external view returns (bool);

    /**
     * @dev Accessor function for address of voucher holder
     * @param _id ID associated with voucher.
     * @return Address of voucher holder.
     */
    function voucherHolderOf(uint256 _id) external view returns (address);

    /**
     * @dev Helper to get vouchers of claims for an address.
     * @param _for Address of check for remaing vouchers.
     * @return Number of vouchers for an address.
     */
    function remainingVouchers(address _for) external view returns (uint256);

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

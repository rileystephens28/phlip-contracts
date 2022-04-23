// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title VoucherRegistry
 * @author Riley Stephens
 * @dev Vouchers represent the ability for an address to "cash in" on something at a future date.
 * This contract can be used to manage the issuance and redemption of vouchers.
 */
contract VoucherRegistry {
    // Unminted token IDs => Address that holds voucher to mint respective token ID
    mapping(uint256 => address) private _voucherRegistry;

    // Address => number of vouchers available for redemption
    mapping(address => uint256) private _remainingVouchers;

    /**
     * @dev Require address to have at least 1 voucher and reverts if not.
     */
    modifier onlyVoucherHolders() {
        require(
            _remainingVouchers[msg.sender] > 0,
            "VoucherRegistry: No vouchers"
        );
        _;
    }

    /**
     * @dev Accessor function to see if an address has any vouchers.
     * @param _address The address to check.
     * @return Whether or not the address has >= 1 vouchers
     */
    function hasVoucher(address _address) public view virtual returns (bool) {
        return _remainingVouchers[_address] > 0;
    }

    /**
     * @dev Accessor function for address of voucher holder
     * @param _reservedTokenID ID of reserved token.
     * @return Address of voucher holder.
     */
    function voucherHolderOf(uint256 _reservedTokenID)
        public
        view
        virtual
        returns (address)
    {
        return _voucherRegistry[_reservedTokenID];
    }

    /**
     * @dev Helper to get vouchers of claims for an address.
     * @param _address Address of check.
     * @return Number of vouchers for an address.
     */
    function remainingVouchers(address _address)
        public
        view
        virtual
        returns (uint256)
    {
        return _remainingVouchers[_address];
    }

    /**
     * @dev Issue voucher to address for a token that will be minted at a future time.
     * @param _to Address to issue voucher to.
     * @param _reservedTokenID ID of token to reserve.
     */
    function _issueVoucher(address _to, uint256 _reservedTokenID)
        internal
        virtual
    {
        require(
            _to != address(0),
            "VoucherRegistry: Cannot issue voucher to 0x0"
        );
        require(
            _voucherRegistry[_reservedTokenID] == address(0),
            "VoucherRegistry: Voucher already exists"
        );

        // Update registry and increment remaining vouchers
        _voucherRegistry[_reservedTokenID] = _to;
        _remainingVouchers[_to] += 1;
    }

    /**
     * @dev Issue voucher to address for a token that will be minted at a future time.
     * @param _from Address to redeem voucher from.
     * @param _reservedTokenID ID of token to reserve.
     */
    function _redeemVoucher(address _from, uint256 _reservedTokenID)
        internal
        virtual
    {
        require(
            _voucherRegistry[_reservedTokenID] == _from,
            "VoucherRegistry: Not voucher holder"
        );
        // Delete from registry and decrement remaining vouchers
        delete _voucherRegistry[_reservedTokenID];
        _remainingVouchers[_from] -= 1;
    }
}

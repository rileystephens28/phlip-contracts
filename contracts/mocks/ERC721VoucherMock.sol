// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../vouchers/VoucherRegistry.sol";
import "../vouchers/IVoucherIssuer.sol";

abstract contract ERC721VoucherMock is ERC721, IVoucherIssuer, VoucherRegistry {
    using Counters for Counters.Counter;

    Counters.Counter public tokenIds;

    constructor() ERC721("ERC721VoucherMock", "VOUCH") {}

    /**
     * @dev Accessor function to see if an address has any vouchers.
     * @param _address The address to check.
     * @return Whether or not the address has >= 1 vouchers
     */
    function hasVoucher(address _address)
        public
        view
        virtual
        override(IVoucherIssuer, VoucherRegistry)
        returns (bool)
    {
        return super.hasVoucher(_address);
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
        override(IVoucherIssuer, VoucherRegistry)
        returns (address)
    {
        return super.voucherHolderOf(_reservedTokenID);
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
        override(IVoucherIssuer, VoucherRegistry)
        returns (uint256)
    {
        return super.remainingVouchers(_address);
    }

    /**
     * @dev Issue a voucher to an address.
     * @param _to The address to check.
     */
    function issueVoucher(address _to) external {
        uint256 reservedTokenID = tokenIds.current();
        tokenIds.increment();

        _issueVoucher(_to, reservedTokenID);
    }

    /**
     * @dev Issue many vouchers to an address.
     * @param _to The address to check.
     */
    function issueVouchers(address _to, uint256 _amount) external {
        for (uint256 i = 0; i < _amount; i++) {
            uint256 reservedTokenID = tokenIds.current();
            tokenIds.increment();

            _issueVoucher(_to, reservedTokenID);
        }
    }

    /**
     * @dev Redeem a voucher.
     * @param _id ID associated with the voucher to redeem.
     */
    function redeemVoucher(uint256 _id) external {
        _redeemVoucher(msg.sender, _id);
    }

    /**
     * @dev Redeem many vouchers.
     * @param _ids Array of IDs associated with the vouchers to redeem.
     */
    function redeemVouchers(uint256[] calldata _ids) external {
        for (uint256 i = 0; i < _ids.length; i++) {
            _redeemVoucher(msg.sender, _ids[i]);
        }
    }

    function mint(address to) public {
        uint256 id = tokenIds.current();
        tokenIds.increment();
        _mint(to, id);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;
import "../vouchers/VoucherRegistry.sol";

contract VoucherRegistryMock is VoucherRegistry {
    bool public didProtectedAction;

    constructor() {
        didProtectedAction = false;
    }

    function protectedAction() public onlyVoucherHolders {
        didProtectedAction = true;
    }

    function issueVoucher(address _to, uint256 _id) external {
        _issueVoucher(_to, _id);
    }

    function redeemVoucher(uint256 _id) external {
        _redeemVoucher(msg.sender, _id);
    }
}

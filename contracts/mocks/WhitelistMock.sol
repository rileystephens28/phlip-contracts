// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../lists/Whitelistable.sol";

contract WhitelistMock is Whitelistable {
    bool public didProtectedAction;

    constructor() {
        didProtectedAction = false;
    }

    function protectedAction() public onlyWhitelisters {
        didProtectedAction = true;
    }

    function addToWhitelist(address _address) public {
        _addToWhitelist(_address);
    }

    function removeFromWhitelist(address _address) public {
        _removeFromWhitelist(_address);
    }
}

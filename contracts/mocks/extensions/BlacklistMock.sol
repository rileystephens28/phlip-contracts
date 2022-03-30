// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../../extensions/Blacklistable.sol";

contract BlacklistMock is Blacklistable {
    bool didNonBlacklistAction;

    constructor() {
        didNonBlacklistAction = false;
    }

    function nonBlacklisted() public noBlacklisters {
        didNonBlacklistAction = true;
    }

    function addToBlacklist(address _address) public {
        _addToBlacklist(_address);
    }

    function removeFromBlacklist(address _address) public {
        _removeFromBlacklist(_address);
    }
}

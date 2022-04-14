// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../extensions/ERC721Lockable.sol";

contract ERC721LockableMock is ERC721Lockable {
    constructor() ERC721("ERC721LockableMock", "LOCK") {}
}

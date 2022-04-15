// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../extensions/ERC721Lockable.sol";

contract ERC721LockableMock is ERC721Lockable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter public tokenIds;

    constructor() ERC721("ERC721LockableMock", "LOCK") {}

    function mint(address to) public onlyOwner {
        uint256 id = tokenIds.current();
        tokenIds.increment();
        _mint(to, id);
    }
}

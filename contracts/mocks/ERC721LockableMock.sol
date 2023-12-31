// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../lockable/ERC721Lockable.sol";

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

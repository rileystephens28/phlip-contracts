// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";

contract PinkCard is PhlipCard {
    constructor(
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress
    )
        PhlipCard(
            "Phlip Pink Card",
            "PPC",
            _baseUri,
            _maxDownvotes,
            _maxUriChanges,
            _minDaoTokensRequired,
            _daoTokenAddress
        )
    {}
}

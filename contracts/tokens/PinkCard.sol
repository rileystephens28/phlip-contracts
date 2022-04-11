// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";

/**
 * @title PinkCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard with no additional functionality.
 */
contract PinkCard is PhlipCard {
    constructor(
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress,
        address _vestingCapsuleAddress
    )
        PhlipCard(
            "Phlip Pink Card",
            "PPC",
            _baseUri,
            _maxDownvotes,
            _maxUriChanges,
            _minDaoTokensRequired,
            _daoTokenAddress,
            _vestingCapsuleAddress
        )
    {}
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./PhlipCard.sol";

/**
 * @title WhiteCard
 * @author Riley Stephens
 * @dev Implementation of a PhlipCard with with no additional functionality.
 */
contract WhiteCard is PhlipCard {
    constructor(string memory _baseUri, uint256 _maxUriChanges)
        PhlipCard("Phlip White Card", "WPC", _baseUri, _maxUriChanges)
    {}
}

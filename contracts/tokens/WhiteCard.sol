// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./PhlipCard.sol";

contract WhiteCard is PhlipCard {
    constructor() PhlipCard("White Phlip Card", "WPC") {}
}

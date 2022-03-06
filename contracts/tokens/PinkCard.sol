// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "./PhlipCard.sol";

contract PinkCard is PhlipCard {
    constructor() PhlipCard("Pink Phlip Card", "PPC") {}
}

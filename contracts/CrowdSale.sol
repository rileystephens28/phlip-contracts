// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "./cards/PinkCard.sol";
import "./cards/WhiteCard.sol";

contract PhlipCardSale is Ownable {
    using Counters for Counters.Counter;

    // PC = Pink Card
    uint256 public PC_SALE_PRICE;
    uint256 public PC_TEXT_MAX_SUPPLY;
    uint256 public PC_IMAGE_MAX_SUPPLY;

    // WC = White Card
    uint256 public WC_SALE_PRICE;
    uint256 public WC_TEXT_MAX_SUPPLY;
    uint256 public WC_BLANK_MAX_SUPPLY;

    PinkCard private _pinkCard;
    WhiteCard private _whiteCard;

    Counters.Counter internal _pinkTextCounter;
    Counters.Counter internal _pinkImageCounter;
    Counters.Counter internal _whiteTextCounter;
    Counters.Counter internal _whiteBlankCounter;

    constructor(
        address _pinkAddress,
        uint256 _pinkSalePrice,
        uint256 _pinkTextSupply,
        uint256 _pinkImageSupply,
        address _whiteAddress,
        uint256 _whiteSalePrice,
        uint256 _whiteTextSupply,
        uint256 _whiteBlankSupply
    ) {
        require(_pinkAddress != address(0), "PC address cannot be 0x0");
        require(_pinkSalePrice > 0, "PC sale price must be > 0");
        require(_pinkTextSupply > 0, "PC text supply must be > 0");
        require(_pinkImageSupply > 0, "PC image supply must be > 0");
        require(_whiteAddress != address(0), "WC address cannot be 0x0");
        require(_whiteSalePrice > 0, "WC sale price must be > 0");
        require(_whiteTextSupply > 0, "WC text supply must be > 0");
        require(_whiteBlankSupply > 0, "WC blank supply must be > 0");

        _pinkCard = PinkCard(_pinkAddress);
        _whiteCard = WhiteCard(_whiteAddress);

        PC_SALE_PRICE = _pinkSalePrice;
        PC_TEXT_MAX_SUPPLY = _pinkTextSupply;
        PC_IMAGE_MAX_SUPPLY = _pinkImageSupply;

        WC_SALE_PRICE = _whiteSalePrice;
        WC_TEXT_MAX_SUPPLY = _whiteTextSupply;
        WC_BLANK_MAX_SUPPLY = _whiteBlankSupply;
    }

    function buyPinkCard(uint256[] calldata _types, string[] calldata _uris)
        external
        payable
    {
        require(_types.length > 0, "Must provide types");
        require(
            _types.length == _uris.length,
            "Length of types and uris not equal"
        );

        uint256 _totalPrice = PC_SALE_PRICE * _types.length;
        require(msg.value >= _totalPrice, "Not enough ETH sent to purchase");

        uint256 i;

        // Check that all types are valid
        for (i = 0; i < _types.length; i++) {
            require(_types[i] == 0 || _types[i] == 1, "Invalid type");
        }

        for (i = 0; i < _types.length; i++) {
            if (_types[i] == 0) {
                require(
                    _pinkTextCounter.current() <= PC_TEXT_MAX_SUPPLY,
                    "Pink text card supply reached"
                );
                _pinkTextCounter.increment();
                _pinkCard.mintTextCard(msg.sender, _uris[i]);
            } else {
                require(
                    _pinkImageCounter.current() <= PC_IMAGE_MAX_SUPPLY,
                    "Pink image card supply reached"
                );
                _pinkImageCounter.increment();
                _pinkCard.mintImageCard(msg.sender, _uris[i]);
            }
        }
    }

    function buyWhiteCard(uint256[] calldata _types, string[] calldata _uris)
        external
        payable
    {
        require(_types.length > 0, "Must provide types");
        require(
            _types.length == _uris.length,
            "Length of types and uris not equal"
        );

        uint256 _totalPrice = PC_SALE_PRICE * _types.length;
        require(msg.value >= _totalPrice, "Not enough ETH sent to purchase");

        uint256 i;

        // Check that all types are valid
        for (i = 0; i < _types.length; i++) {
            require(_types[i] == 0 || _types[i] == 1, "Invalid type");
        }

        for (i = 0; i < _types.length; i++) {
            if (_types[i] == 0) {
                require(
                    _whiteTextCounter.current() <= WC_TEXT_MAX_SUPPLY,
                    "White text card supply reached"
                );
                _whiteTextCounter.increment();
                _whiteCard.mintTextCard(msg.sender, _uris[i]);
            } else {
                require(
                    _whiteBlankCounter.current() <= WC_BLANK_MAX_SUPPLY,
                    "White image card supply reached"
                );
                _whiteBlankCounter.increment();
                _whiteCard.mintBlankCard(msg.sender);
            }
        }
    }
}

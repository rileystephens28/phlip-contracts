// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "./cards/PinkCard.sol";
import "./cards/WhiteCard.sol";
import "./interfaces/IVestingTreasury.sol";
import "./interfaces/IPhlipCard.sol";

/**

## Bundled White Text Package Indexes
    whiteText1 = 0;
    whiteText2 = 1;
    whiteText3 = 2;
    whiteText5 = 3;
    whiteText10 = 4;
    whiteText20 = 5;

## Bundled Pink Text Package Indexes
    pinkText1 = 6;
    pinkText2 = 7;
    pinkText3 = 8;

## Bundled Pink Image Package Indexes
    pinkImage1 = 9;
    pinkImage2 = 10;
    pinkImage3 = 11;

## Bundled Pink Combo Package Indexes
    pinkCombo1 = 12;
    pinkCombo2 = 13;
    pinkCombo3 = 14;

## Full House Package Indexes
    fullHouse = 6;
    doubleFullHouse = 7;
    tripleFullHouse = 8;

## Whale Package Indexes
    belugaWhale = 9;
    humpbackWhale = 10;
    blueWhale = 11;

 */
contract PhlipSale is Ownable {
    using SafeERC20 for IERC20;

    event CreatePackage(uint256 id, uint256 price, uint128 numForSale);
    event PurchasePackage(uint256 indexed id, address purchaser);

    enum Color {
        PINK,
        WHITE
    }

    enum Varient {
        TEXT,
        SPECIAL
    }

    struct CardInfo {
        Color color;
        Varient varient;
        IPhlipCard instance;
        uint128 totalSupply;
        uint128 mintedSupply;
    }

    struct CardBundle {
        uint128 cardID;
        uint128 numCards;
        uint256[2] scheduleIDs;
    }
    struct PresalePackage {
        uint256 price;
        uint128 numForSale;
        uint128 numSold;
        CardBundle[] cardBundles;
    }

    // Each pink card will have at least 1,000,000 dao tokens
    uint256 private pinkCardDaoTokens = 1000000;

    // Each white card will have at least 125,000 dao tokens
    uint256 private whiteCardDaoTokens = 125000;

    // Card IDs to use in _cards mapping
    uint128 private _pinkTextCard = 0;
    uint128 private _pinkImageCard = 1;
    uint128 private _whiteTextCard = 2;
    uint128 private _whiteBlankCard = 3;

    mapping(uint128 => CardInfo) private _cards;

    uint256 private whiteTextCard = 0;

    mapping(uint256 => PresalePackage) private _packages;
    mapping(uint256 => bool) private _registeredPackages;

    bool private _presaleActive;
    bool private _generalSaleActive;

    address _daoTokenAddress;
    address _p2eTokenAddress;

    address _daoWalletAddress;
    address _p2eWalletAddress;

    address payable _proceedsWalletAddress;

    uint256 _vestingCliff;
    uint256 _vestingDuration;

    constructor(
        address _pcAddress,
        address _wcAddress,
        address _daoToken,
        address _p2eToken,
        address _daoWallet,
        address _p2eWallet,
        address payable _proceedsWallet,
        uint256 _cliff,
        uint256 _duration
    ) {
        require(_pcAddress != address(0), "Pink card cannot be 0x0");
        require(_wcAddress != address(0), "White card cannot be 0x0");
        require(_daoToken != address(0), "DAO tokens cannot be 0x0");
        require(_p2eToken != address(0), "P2E tokens cannot be 0x0");
        require(_daoWallet != address(0), "DAO wallet cannot be 0x0");
        require(_p2eWallet != address(0), "P2E wallet cannot be 0x0");
        require(_proceedsWallet != address(0), "Proceeds wallet cannot be 0x0");

        _daoTokenAddress = _daoToken;
        _p2eTokenAddress = _p2eToken;

        _daoWalletAddress = _daoWallet;
        _p2eWalletAddress = _p2eWallet;

        _vestingCliff = _cliff;
        _vestingDuration = _duration;

        _proceedsWalletAddress = _proceedsWallet;

        CardInfo storage ptCard = _cards[_pinkTextCard];
        ptCard.color = Color.PINK;
        ptCard.varient = Varient.TEXT;
        ptCard.instance = IPhlipCard(_pcAddress);
        ptCard.totalSupply = 675;

        CardInfo storage piCard = _cards[_pinkImageCard];
        piCard.color = Color.PINK;
        piCard.varient = Varient.SPECIAL;
        piCard.instance = IPhlipCard(_pcAddress);
        piCard.totalSupply = 675;

        CardInfo storage wtCard = _cards[_whiteTextCard];
        wtCard.color = Color.WHITE;
        wtCard.varient = Varient.TEXT;
        wtCard.instance = IPhlipCard(_wcAddress);
        wtCard.totalSupply = 9375;

        CardInfo storage wbCard = _cards[_whiteBlankCard];
        wbCard.color = Color.WHITE;
        wbCard.varient = Varient.SPECIAL;
        wbCard.instance = IPhlipCard(_wcAddress);
        wbCard.totalSupply = 625;
    }

    /**
     * @dev Ensures the presale is active and reverts if not.
     */
    modifier onlyPresale() {
        require(_presaleActive, "Presale is not active");
        _;
    }

    /**
     * @dev Getter for presale active state.
     */
    function presaleActive() public view returns (bool) {
        return _presaleActive;
    }

    /**
     * @dev Getter for the price in WEI of a presale package.
     * @param _packageID ID of the package to query
     */
    function priceOf(uint256 _packageID) public view returns (uint256) {
        return _packages[_packageID].price;
    }

    /**
     * @dev Getter for number of remaining presale packages available for sale
     * @param _packageID ID of the package to query
     */
    function getPackagesRemaining(uint256 _packageID)
        public
        view
        returns (uint128)
    {
        PresalePackage storage package = _packages[_packageID];
        return package.numForSale - package.numSold;
    }

    /**
     * @dev Getter for number of remaining presale packages available for sale
     * @param _packageID ID of the package to query
     */
    function getCardBundles(uint256 _packageID)
        public
        view
        returns (CardBundle[] memory)
    {
        PresalePackage storage package = _packages[_packageID];
        return package.cardBundles;
    }

    /**
     * @dev Allows contract owner to set presale active state.
     * @param _active New presale active state.
     */
    function setPresaleActive(bool _active) public onlyOwner {
        _presaleActive = _active;
    }

    /**
     * @dev Allows contract owner to create a presale package that contains 1 card type
     * @param _packageID ID of the package to create (or overwrite)
     * @param _weiPrice The price of the package in wei
     * @param _numForSale Number of packages that can be bought
     * @param _numCards Number of cards in the package
     * @param _cardID ID of the card in the package (can be 0-3)
     * @param _daoAmount The amount of DAO tokens that will vest in card
     * @param _p2eAmount The amount of P2E tokens that will vest in card
     */
    function createSingleCardPackage(
        uint256 _packageID,
        uint256 _weiPrice,
        uint128 _numForSale,
        uint128 _numCards,
        uint128 _cardID,
        uint256 _daoAmount,
        uint256 _p2eAmount
    ) public onlyOwner {
        require(!_registeredPackages[_packageID], "Package already exists");
        require(_weiPrice > 0, "Price cannot be 0");
        require(_numForSale > 0, "Number of packages cannot be 0");

        _registeredPackages[_packageID] = true;
        PresalePackage storage package = _packages[_packageID];
        package.price = _weiPrice;
        package.numForSale = _numForSale;

        // Add vesting info with card info and number of card in package
        package.cardBundles.push(
            _initCardPackage(
                _cardID,
                _numCards,
                _numForSale,
                _daoAmount,
                _p2eAmount
            )
        );

        emit CreatePackage(_packageID, _weiPrice, _numForSale);
    }

    /**
     * @dev Allows contract owner to create a presale package that contains 1 card type
     * @param _packageID ID of the package to create (or overwrite)
     * @param _weiPrice The price of the package in wei
     * @param _numForSale Number of packages that can be bought
     * @param _cardIDs Array of IDs of the card in the package (can be 0-3)
     * @param _numCards Array containing number of each card in the package
     * @param _daoAmounts Array containing the amount of DAO tokens that will vest in each card
     * @param _p2eAmounts Array containing the amount of P2E tokens that will vest in each card
     */
    function createMultiCardPackage(
        uint256 _packageID,
        uint256 _weiPrice,
        uint128 _numForSale,
        uint128[] calldata _cardIDs,
        uint128[] calldata _numCards,
        uint256[] calldata _daoAmounts,
        uint256[] calldata _p2eAmounts
    ) public onlyOwner {
        _registeredPackages[_packageID] = true;

        PresalePackage storage package = _packages[_packageID];
        package.price = _weiPrice;
        package.numForSale = _numForSale;

        for (uint256 i = 0; i < _numCards.length; i++) {
            // Add vesting info with card info and number of card in package
            package.cardBundles.push(
                _initCardPackage(
                    _cardIDs[i],
                    _numCards[i],
                    _numForSale,
                    _daoAmounts[i],
                    _p2eAmounts[i]
                )
            );
        }

        emit CreatePackage(_packageID, _weiPrice, _numForSale);
    }

    /**
     * @dev Allows caller to purchase a presale package if they
     * have sent the correct amount of ETH to cover the package cost.
     * @param _packageID ID of the package to purchase.
     */
    function purchasePackage(uint256 _packageID) public payable onlyPresale {
        PresalePackage storage package = _packages[_packageID];
        require(
            package.numSold < package.numForSale,
            "Package is no longer available"
        );
        require(msg.value > package.price - 1, "Not enough ETH to cover cost");

        package.numSold += 1;

        uint256[] memory schedules = new uint256[](2);
        for (uint256 i = 0; i < package.cardBundles.length; i++) {
            CardBundle storage pkgDetails = package.cardBundles[i];
            CardInfo storage card = _cards[pkgDetails.cardID];
            card.mintedSupply += pkgDetails.numCards;

            for (uint256 j = 0; j < pkgDetails.numCards; j++) {
                // Overwrite vetsing schedule IDs
                schedules[0] = pkgDetails.scheduleIDs[0];
                schedules[1] = pkgDetails.scheduleIDs[1];

                // Mint card
                card.instance.mintCard(
                    msg.sender,
                    "",
                    uint256(card.varient),
                    schedules
                );
            }
        }

        uint256 refundAmount = msg.value - package.price;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }

        emit PurchasePackage(_packageID, msg.sender);
    }

    /**
     * @dev Creates vesting schedules and fills reserves for a card in package
     * @param _cardID ID of the card in the package (can be 0-3)
     * @param _numCards Number of cards in the package
     * @param _numForSale Number of packages that can be bought
     * @param _daoAmount The amount of DAO tokens that will vest in card
     * @param _p2eAmount The amount of P2E tokens that will vest in card
     */
    function _initCardPackage(
        uint128 _cardID,
        uint128 _numCards,
        uint256 _numForSale,
        uint256 _daoAmount,
        uint256 _p2eAmount
    ) private returns (CardBundle memory) {
        require(_numCards > 0, "Number of cards cannot be 0");
        require(_daoAmount > 0, "DAO token amount cannot be 0");
        require(_p2eAmount > 0, "P2E token amount cannot be 0");

        CardInfo storage card = _cards[_cardID];

        uint256 totalCards = _numForSale * _numCards;

        IVestingTreasury cardTreasury = IVestingTreasury(
            address(card.instance)
        );

        uint256 daoSchedule = cardTreasury.createVestingSchedule(
            _daoTokenAddress,
            _vestingCliff,
            _vestingDuration,
            _daoAmount
        );

        uint256 p2eSchedule = cardTreasury.createVestingSchedule(
            _p2eTokenAddress,
            _vestingCliff,
            _vestingDuration,
            _p2eAmount
        );

        // Fill reserves for new schedules
        // Note: requires _daoWalletAddress to approve card contract as spender
        cardTreasury.fillReserves(
            _daoWalletAddress,
            daoSchedule,
            _daoAmount * totalCards
        );

        // Note: requires _p2eWalletAddress to approve card contract as spender
        cardTreasury.fillReserves(
            _p2eWalletAddress,
            p2eSchedule,
            _p2eAmount * totalCards
        );

        return CardBundle(_cardID, _numCards, [daoSchedule, p2eSchedule]);
    }

    // function buyPinkCard(uint256[] calldata _types, string[] calldata _uris)
    //     external
    //     payable
    // {
    //     require(_types.length > 0, "Must provide types");
    //     require(
    //         _types.length == _uris.length,
    //         "Length of types and uris not equal"
    //     );

    //     uint256 _totalPrice = PC_SALE_PRICE * _types.length;
    //     require(msg.value >= _totalPrice, "Not enough ETH sent to purchase");

    //     uint256 i;

    //     // Check that all types are valid
    //     for (i = 0; i < _types.length; i++) {
    //         require(_types[i] == 0 || _types[i] == 1, "Invalid type");
    //     }

    //     for (i = 0; i < _types.length; i++) {
    //         if (_types[i] == 0) {
    //             require(
    //                 _pinkTextCounter.current() <= PC_TEXT_MAX_SUPPLY,
    //                 "Pink text card supply reached"
    //             );
    //             _pinkTextCounter.increment();
    //             // _pinkCard.mintCard(msg.sender, _uris[i], 0);
    //         } else {
    //             require(
    //                 _pinkImageCounter.current() <= PC_IMAGE_MAX_SUPPLY,
    //                 "Pink image card supply reached"
    //             );
    //             _pinkImageCounter.increment();
    //             // _pinkCard.mintCard(msg.sender, _uris[i], 1);
    //         }
    //     }
    // }

    // function buyWhiteCard(uint256[] calldata _types, string[] calldata _uris)
    //     external
    //     payable
    // {
    //     require(_types.length > 0, "Must provide types");
    //     require(
    //         _types.length == _uris.length,
    //         "Length of types and uris not equal"
    //     );

    //     uint256 _totalPrice = PC_SALE_PRICE * _types.length;
    //     require(msg.value >= _totalPrice, "Not enough ETH sent to purchase");

    //     uint256 i;

    //     // Check that all types are valid
    //     for (i = 0; i < _types.length; i++) {
    //         require(_types[i] == 0 || _types[i] == 1, "Invalid type");
    //     }

    //     for (i = 0; i < _types.length; i++) {
    //         if (_types[i] == 0) {
    //             require(
    //                 _whiteTextCounter.current() <= WC_TEXT_MAX_SUPPLY,
    //                 "White text card supply reached"
    //             );
    //             _whiteTextCounter.increment();
    //             // _whiteCard.mintCard(msg.sender, _uris[i], 0, [0, 1]);
    //         } else {
    //             require(
    //                 _whiteBlankCounter.current() <= WC_BLANK_MAX_SUPPLY,
    //                 "White image card supply reached"
    //             );
    //             _whiteBlankCounter.increment();
    //             // _whiteCard.mintCard(msg.sender, "", 1);
    //         }
    //     }
    // }
}

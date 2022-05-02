// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
contract PhlipSale is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    event CreatePackage(uint256 id, uint256 price, uint128 numForSale);
    event PurchasePackage(uint256 indexed id, address purchaser);
    event PurchaseCard(uint256 indexed cardID, address purchaser);

    enum SaleState {
        NO_SALE,
        PRESALE_ACTIVE,
        SALE_ACTIVE
    }

    SaleState private _saleStaus;

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
        address contractAddress;
        uint128 totalSupply;
        uint128 mintedSupply;
    }

    // Structures information required to sell and
    // mint single cards during the sale period.
    struct CardSaleInfo {
        uint256 price;
        uint128 numSold;
        uint256[] scheduleIDs;
    }

    // Card IDs to use in _cards mapping
    uint128 private _pinkTextCard = 0;
    uint128 private _pinkImageCard = 1;
    uint128 private _whiteTextCard = 2;
    uint128 private _whiteBlankCard = 3;

    // Mapping of IDs to card info
    mapping(uint128 => CardInfo) private _cards;

    // Maps card IDs to respective card sale info
    mapping(uint128 => CardSaleInfo) private _cardSaleInfo;
    mapping(uint128 => bool) private _registeredSaleInfo;

    struct CardBundle {
        uint128 cardID;
        uint128 numCards;
        uint256[] scheduleIDs;
    }

    // Structures information required to sell and
    // mint several cards at once during the presale period.
    struct PresalePackage {
        uint256 price;
        uint128 numForSale;
        uint128 numSold;
        CardBundle[] cardBundles;
    }

    // Mapping of IDs to presale packages
    mapping(uint256 => PresalePackage) private _packages;

    // Tracks package IDs that have been created
    mapping(uint256 => bool) private _registeredPackages;

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
        uint128 _pcTextSupply,
        uint128 _pcImageSupply,
        uint128 _wcTextSupply,
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
        require(_cliff > 0, "Vesting cliff must be greater than 0");
        require(_duration > 0, "Vesting duration must be greater than 0");
        require(_pcTextSupply > 0, "Pink text supply must be greater than 0");
        require(_pcImageSupply > 0, "Pink image supply must be greater than 0");
        require(_wcTextSupply > 0, "White text supply must be greater than 0");

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
        ptCard.contractAddress = _pcAddress;
        ptCard.totalSupply = _pcTextSupply;

        CardInfo storage piCard = _cards[_pinkImageCard];
        piCard.color = Color.PINK;
        piCard.varient = Varient.SPECIAL;
        piCard.contractAddress = _pcAddress;
        piCard.totalSupply = _pcImageSupply;

        CardInfo storage wtCard = _cards[_whiteTextCard];
        wtCard.color = Color.WHITE;
        wtCard.varient = Varient.TEXT;
        wtCard.contractAddress = _wcAddress;
        wtCard.totalSupply = _wcTextSupply;

        CardInfo storage wbCard = _cards[_whiteBlankCard];
        wbCard.color = Color.WHITE;
        wbCard.varient = Varient.SPECIAL;
        wbCard.contractAddress = _wcAddress;
        wbCard.totalSupply = 625;
    }

    /**
     * @dev Ensures the presale is active and reverts if not.
     */
    modifier onlyPresale() {
        require(
            _saleStaus == SaleState.PRESALE_ACTIVE,
            "Presale is not active"
        );
        _;
    }

    /**
     * @dev Ensures the presale is active and reverts if not.
     */
    modifier onlyGeneralSale() {
        require(
            _saleStaus == SaleState.SALE_ACTIVE,
            "General sale is not active"
        );
        _;
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Getter for current sale status.
     */
    function saleStatus() public view returns (uint8) {
        return uint8(_saleStaus);
    }

    /**
     * @dev Getter for the price in WEI of a presale package.
     * @param _cardID ID of the card to query
     */
    function getCardPrice(uint128 _cardID) public view returns (uint256) {
        return _cardSaleInfo[_cardID].price;
    }

    /**
     * @dev Getter for the price in WEI of a presale package.
     * @param _packageID ID of the package to query
     */
    function getPackagePrice(uint256 _packageID) public view returns (uint256) {
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
     * @dev Getter for a card's sale information.
     * @param _cardID ID of the card to query
     */
    function getSaleInfo(uint128 _cardID)
        public
        view
        returns (CardSaleInfo memory)
    {
        return _cardSaleInfo[_cardID];
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
     * @dev Getter for max supply of a specific card.
     * @param _cardID ID of the card to query
     */
    function maxSupplyOf(uint128 _cardID) public view returns (uint128) {
        CardInfo storage card = _cards[_cardID];
        return card.totalSupply;
    }

    /**
     * @dev Getter for number of minted cards of a specific color & type.
     * @param _cardID ID of the card to query
     */
    function mintedSupplyOf(uint128 _cardID) public view returns (uint128) {
        CardInfo storage card = _cards[_cardID];
        return card.mintedSupply;
    }

    /***********************************|
    |       Only Owner Functions        |
    |__________________________________*/

    /**
     * @dev Allows contract owner to set presale active state.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_state` must be 0, 1, or 2
     *
     * @param _state New sale state.
     */
    function setSaleStatus(uint8 _state) public onlyOwner {
        require(_state < 3, "Invalid sale status");
        _saleStaus = SaleState(_state);
    }

    /**
     * @dev Allows contract owner to set presale active state.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_cardID` must be 0, 1, 2, or 3
     * - `_price` must be greater than 0
     * - `_scheduleIDs` must contain IDs for existing schedules vesting with
     * reserves containing enough tokens to create vesting capsules from
     *
     * @param _scheduleIDs Array containing vesting schedule IDs.
     */
    function setCardSaleInfo(
        uint128 _cardID,
        uint256 _price,
        uint256[] calldata _scheduleIDs
    ) public onlyOwner {
        require(_cardID < 4, "Invalid card ID");
        require(_price > 0, "Price must be greater than 0");

        IVestingTreasury treasury = IVestingTreasury(
            _cards[_cardID].contractAddress
        );
        for (uint256 i = 0; i < _scheduleIDs.length; i++) {
            require(
                treasury.scheduleExists(_scheduleIDs[i]),
                "Vesting schedule ID is invalid"
            );
        }

        _registeredSaleInfo[_cardID] = true;
        CardSaleInfo storage saleInfo = _cardSaleInfo[_cardID];
        saleInfo.price = _price;
        saleInfo.scheduleIDs = _scheduleIDs;
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
            _createCardBundle(
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
        require(!_registeredPackages[_packageID], "Package already exists");
        require(_weiPrice > 0, "Price cannot be 0");
        require(_numForSale > 0, "Number of packages cannot be 0");

        _registeredPackages[_packageID] = true;

        PresalePackage storage package = _packages[_packageID];
        package.price = _weiPrice;
        package.numForSale = _numForSale;

        for (uint256 i = 0; i < _numCards.length; i++) {
            // Add vesting info with card info and number of card in package
            package.cardBundles.push(
                _createCardBundle(
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

    /***********************************|
    |    External Purchase Functions    |
    |__________________________________*/

    /**
     * @dev Allows caller to purchase a presale package if they
     * have sent the correct amount of ETH to cover the package cost.
     * @param _packageID ID of the package to purchase.
     */
    function purchasePackage(uint256 _packageID)
        public
        payable
        onlyPresale
        nonReentrant
    {
        require(_registeredPackages[_packageID], "Package does not exist");

        PresalePackage storage package = _packages[_packageID];
        require(package.numSold < package.numForSale, "Package not available");
        require(msg.value > package.price - 1, "Not enough ETH to cover cost");

        package.numSold += 1;

        for (uint256 i = 0; i < package.cardBundles.length; i++) {
            CardBundle storage pkgDetails = package.cardBundles[i];
            CardInfo storage card = _cards[pkgDetails.cardID];
            card.mintedSupply += pkgDetails.numCards;

            for (uint256 j = 0; j < pkgDetails.numCards; j++) {
                // Mint card
                IPhlipCard(card.contractAddress).mintCard(
                    msg.sender,
                    "",
                    uint256(card.varient),
                    pkgDetails.scheduleIDs
                );
            }
        }

        emit PurchasePackage(_packageID, msg.sender);

        uint256 refundAmount = msg.value - package.price;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    /**
     * @dev Allows caller to purchase a card if they have
     * sent the correct amount of ETH to cover the cost.
     * @param _cardID ID of the card to purchase.
     */
    function purchaseCard(uint128 _cardID, string memory _uri)
        public
        payable
        onlyGeneralSale
        nonReentrant
    {
        require(_registeredSaleInfo[_cardID], "Not available for sale");

        CardInfo storage card = _cards[_cardID];
        CardSaleInfo storage saleInfo = _cardSaleInfo[_cardID];
        require(card.mintedSupply < card.totalSupply, "Max supply reached");
        require(msg.value > saleInfo.price - 1, "Not enough ETH to cover cost");

        card.mintedSupply += 1;
        saleInfo.numSold += 1;

        // Mint card
        IPhlipCard(card.contractAddress).mintCard(
            msg.sender,
            _uri,
            uint256(card.varient),
            saleInfo.scheduleIDs
        );

        emit PurchaseCard(_cardID, msg.sender);

        uint256 refundAmount = msg.value - saleInfo.price;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    /***********************************|
    |        Internal Functions         |
    |__________________________________*/

    /**
     * @dev Creates vesting schedules and fills reserves for a card in package
     * @param _cardID ID of the card in the package (can be 0-3)
     * @param _numCards Number of cards in the package
     * @param _reserveMultiple Multplier used when filling vesting schedule reserves
     * @param _daoAmount The amount of DAO tokens that will vest in card
     * @param _p2eAmount The amount of P2E tokens that will vest in card
     */
    function _createCardBundle(
        uint128 _cardID,
        uint128 _numCards,
        uint256 _reserveMultiple,
        uint256 _daoAmount,
        uint256 _p2eAmount
    ) private returns (CardBundle memory) {
        require(_numCards > 0, "Number of cards cannot be 0");
        require(_daoAmount > 0, "DAO token amount cannot be 0");
        require(_p2eAmount > 0, "P2E token amount cannot be 0");

        IVestingTreasury cardTreasury = IVestingTreasury(
            _cards[_cardID].contractAddress
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

        uint256 fillMultiple = _reserveMultiple * _numCards;

        // Fill reserves for new schedules
        // Note: requires _daoWalletAddress to approve card contract as spender
        cardTreasury.fillReserves(
            _daoWalletAddress,
            daoSchedule,
            _daoAmount * fillMultiple
        );

        // Note: requires _p2eWalletAddress to approve card contract as spender
        cardTreasury.fillReserves(
            _p2eWalletAddress,
            p2eSchedule,
            _p2eAmount * fillMultiple
        );

        // Create schedule IDs array
        uint256[] memory schedules = new uint256[](2);
        schedules[0] = daoSchedule;
        schedules[1] = p2eSchedule;

        return CardBundle(_cardID, _numCards, schedules);
    }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@maticnetwork/fx-portal/contracts/tunnel/FxBaseRootTunnel.sol";

/**
 * @dev Root contract for the Phlip cross-chain crowdsale that will be deployed on Ethereum.
 * This contract is responsible for managing premint packages and accepting payment.
 * Once payment is received, this contract will make a call to the child contract to mint
 * individual cards or all cards in a package.
 *
 * ## StateSync Ethereum Addresses
 * ### Goerli
 * - _checkpointManager: 0x2890bA17EfE978480615e330ecB65333b880928e
 * - _fxRoot: 0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA
 *
 * ### Mainnet
 * - _checkpointManager: 0x86e4dc95c7fbdbf52e33d563bbdb00823894c287
 * - _fxRoot: 0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2
 */
contract FxSaleRootTunnel is Ownable, ReentrancyGuard, FxBaseRootTunnel {
    using SafeERC20 for IERC20;

    /// @dev Message types
    bytes32 public constant PURCHASE_CARD = keccak256("PURCHASE_CARD");
    bytes32 public constant PURCHASE_PACKAGE = keccak256("PURCHASE_PACKAGE");

    event PurchaseCard(uint256 indexed id, address purchaser);
    event PurchasePackage(uint256 indexed id, address purchaser);
    event RegisterPackage(
        uint256 indexed id,
        uint256 price,
        uint256 numForSale
    );

    enum SaleState {
        INACTIVE,
        PRESALE_ACTIVE,
        SALE_ACTIVE
    }

    SaleState private _saleStatus;

    // Card IDs to use in _cards mapping
    uint128 private immutable _pinkTextCard = 0;
    uint128 private immutable _pinkImageCard = 1;
    uint128 private immutable _whiteTextCard = 2;
    uint128 private immutable _whiteBlankCard = 3;

    // Structures information required to sell and
    // mint single cards during the sale period.
    struct CardInfo {
        uint256 price;
        uint128 totalSupply;
        uint128 mintedSupply;
    }

    // Structures information required to sell and
    // mint several cards at once during the presale period.
    // The childPackageId is the ID of the package in the child tunnel contract.
    struct PresalePackage {
        uint256 price;
        uint256 childPackageId;
        uint128 numForSale;
        uint128 numSold;
    }

    // Mapping of IDs to card info
    mapping(uint128 => CardInfo) private _cards;

    // Mapping of IDs to presale packages
    mapping(uint256 => PresalePackage) private _packages;

    // Tracks package IDs that have been created
    mapping(uint256 => bool) private _registeredPackages;

    address payable public _proceedsWalletAddress;

    constructor(
        address _checkpointManager,
        address _fxRoot,
        address payable _proceedsWallet
    ) FxBaseRootTunnel(_checkpointManager, _fxRoot) {
        require(_proceedsWallet != address(0), "Proceeds wallet cannot be 0x0");

        _proceedsWalletAddress = _proceedsWallet;

        CardInfo storage ptCard = _cards[_pinkTextCard];
        ptCard.totalSupply = 625;

        CardInfo storage piCard = _cards[_pinkImageCard];
        piCard.totalSupply = 625;

        CardInfo storage wtCard = _cards[_whiteTextCard];
        wtCard.totalSupply = 9375;

        CardInfo storage wbCard = _cards[_whiteBlankCard];
        wbCard.totalSupply = 625;
    }

    /**
     * @dev Ensures the presale is active and reverts if not.
     */
    modifier onlyPresale() {
        require(
            _saleStatus == SaleState.PRESALE_ACTIVE,
            "Presale is not active"
        );
        _;
    }

    /**
     * @dev Ensures the presale is active and reverts if not.
     */
    modifier onlyGeneralSale() {
        require(
            _saleStatus == SaleState.SALE_ACTIVE,
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
        return uint8(_saleStatus);
    }

    /**
     * @dev Getter for the price in WEI of a presale package.
     * @param _cardID ID of the card to query
     */
    function getCardPrice(uint128 _cardID) public view returns (uint256) {
        return _cards[_cardID].price;
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
        _saleStatus = SaleState(_state);
    }

    /**
     * @dev Allows contract owner to set total supply of card.
     *
     * Note - This function should be called after contract is deployed
     *      and before configuring card sale info and card packages.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_cardID` must be 0, 1, 2, or 3
     * - `_supply` must be greater than 0
     *
     * @param _cardID ID of the card to set.
     * @param _supply New total supply.
     */
    function setCardMaxSupply(uint128 _cardID, uint128 _supply)
        public
        onlyOwner
    {
        require(_saleStatus == SaleState.INACTIVE, "Cannot change during sale");
        require(_cardID < 4, "Invalid card ID");
        require(_supply > 0, "Supply must be greater than 0");

        CardInfo storage card = _cards[_cardID];
        card.totalSupply = _supply;
    }

    /**
     * @dev Allows contract owner to set presale active state.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_cardID` must be 0, 1, 2, or 3
     * - `_price` must be greater than 0
     *
     * @param _cardID ID of the card to set.
     * @param _price Price (in wei) of the card.
     */
    function setCardPrice(uint128 _cardID, uint256 _price) public onlyOwner {
        require(_cardID < 4, "Invalid card ID");
        require(_price > 0, "Price must be greater than 0");

        _cards[_cardID].price = _price;
    }

    /**
     * @dev Allows contract owner to create a presale package that contains 1 card type
     * @param _packageID ID of the package in child tunnel contract
     * @param _price The price of the package in wei
     * @param _numForSale Number of packages that can be bought
     */
    function registerChildPackage(
        uint256 _packageID,
        uint256 _price,
        uint128 _numForSale
    ) public onlyOwner {
        require(!_registeredPackages[_packageID], "Package already registered");
        require(_price > 0, "Price cannot be 0");
        require(_numForSale > 0, "Number of packages cannot be 0");

        _registeredPackages[_packageID] = true;
        PresalePackage storage package = _packages[_packageID];
        package.price = _price;
        package.numForSale = _numForSale;

        emit RegisterPackage(_packageID, _price, _numForSale);
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

        // Craft message with purchaser address and package ID
        bytes memory message = abi.encode(
            PURCHASE_PACKAGE,
            abi.encode(msg.sender, package.childPackageId)
        );

        // Send message to child tunnel contract
        _sendMessageToChild(message);

        emit PurchasePackage(_packageID, msg.sender);

        _refundIfNeccessary(package.price);
    }

    /**
     * @dev Allows caller to purchase a card if they have
     * sent the correct amount of ETH to cover the cost.
     * @param _cardID ID of the card to purchase.
     */
    function purchaseCard(uint128 _cardID)
        public
        payable
        onlyGeneralSale
        nonReentrant
    {
        CardInfo storage card = _cards[_cardID];
        require(_cardID < 4, "Invalid card ID");
        require(card.mintedSupply < card.totalSupply, "Max supply reached");
        require(msg.value > card.price - 1, "Not enough ETH to cover cost");

        card.mintedSupply += 1;

        // Craft message with purchaser address and package ID
        bytes memory message = abi.encode(
            PURCHASE_PACKAGE,
            abi.encode(msg.sender, _cardID)
        );

        // Send message to child tunnel contract
        _sendMessageToChild(message);

        emit PurchaseCard(_cardID, msg.sender);

        _refundIfNeccessary(card.price);
    }

    /***********************************|
    |        Internal Functions         |
    |__________________________________*/

    /**
     * @dev Refunds ETH if caller sent more than the required amount.
     * @param _price Price of sale
     */
    function _refundIfNeccessary(uint256 _price) internal {
        uint256 refundAmount = msg.value - _price;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    // exit processor
    function _processMessageFromChild(bytes memory data) internal override {}
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@maticnetwork/fx-portal/contracts/tunnel/FxBaseRootTunnel.sol";

import "../marketing/AffiliateMarketing.sol";

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
contract FxSaleRootTunnel is
    Ownable,
    ReentrancyGuard,
    FxBaseRootTunnel,
    AffiliateMarketing
{
    using Counters for Counters.Counter;

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
    struct PackageInfo {
        uint256 price;
        uint128 numForSale;
        uint128 numSold;
    }

    // Card IDs => card info
    mapping(uint128 => CardInfo) private _cards;

    // Child contract package IDs => presale package info
    mapping(uint256 => PackageInfo) private _packages;

    // Package IDs => if the package has been registered
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

        // ID 0 is reserved for "no affiliate"
        _affiliateIdCounter.increment();

        // ID 0 is reserved for "no campaign"
        _campaignIdCounter.increment();
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
        PackageInfo storage package = _packages[_packageID];
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
     * @dev Allows contract owner to create a
     * presale package that contains 1 card type
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_packageID` must not already be registered
     * - `_price` must be greater than 0
     * - `_numForSale` must be greater than 0
     *
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
        PackageInfo storage package = _packages[_packageID];
        package.price = _price;
        package.numForSale = _numForSale;

        emit RegisterPackage(_packageID, _price, _numForSale);
    }

    /**
     * @dev Create a new campaign from the given parameters.
     *
     * Requirements:
     * - `_startTime` must be in the future
     * - `_endTime` must be greater than `_startTime`
     * - `_standardCommission` must be between 0 and 10000
     *
     * @param _startTime The time when the campaign becomes active
     * @param _endTime The time the campaign becomes inactive
     * @param _standardCommission Percentage of sales generated by affiliates that will be paid to the affiliate
     * @param _uri (Optional) URI containing the new campaign's information
     */
    function createCampaign(
        uint128 _startTime,
        uint128 _endTime,
        uint32 _standardCommission,
        string memory _uri
    ) external onlyOwner {
        _createCampaign(
            owner(),
            _startTime,
            _endTime,
            _standardCommission,
            _uri
        );
    }

    /**
     * @dev Allows contract owner to add an
     * affiliate with a custom sales commission
     *
     * Requirements:
     * - `_campaignID` must exist.
     * - `_affiliate` cannot be the zero address.
     * - `_affiliate` cannot have been added to campaign.
     * - `_commission` must be between 0 and 10000
     *
     * @param _campaignID ID of the campaign to add affiliate to
     * @param _affiliate Address of new affiliate to add to campaign
     * @param _commission Percentage of sales that will be paid to the affiliate
     */
    function addCustomAffiliate(
        uint256 _campaignID,
        address _affiliate,
        uint32 _commission
    ) external onlyOwner {
        _addAffiliateToCampaign(_campaignID, _affiliate, _commission);
    }

    /***********************************|
    |        Purchase Functions         |
    |__________________________________*/

    /**
     * @dev Allows caller to purchase a presale package if they
     * have sent the correct amount of ETH to cover the package cost.
     *
     * Requirements:
     * - `_packageID` must exist.
     * - `_campaignID` must exist.
     * - `_campaignID` is active.
     * - `_affiliateID` must exist.
     * - `_affiliateID` is registered with campaign.
     * - `package.numSold` cannot exceed `package.numForSale`.
     * - `msg.value` must be greater than or equal to `package.price`.
     *
     * @param _packageID ID of the package to purchase.
     * @param _campaignID ID of the campaign the purchase occurred as a result of.
     * @param _affiliateID ID of the affiliate that referred the buyer
     */
    function purchasePackage(
        uint256 _packageID,
        uint256 _campaignID,
        uint256 _affiliateID
    ) public payable onlyPresale nonReentrant {
        require(_registeredPackages[_packageID], "Package does not exist");

        PackageInfo storage package = _packages[_packageID];
        require(package.numSold < package.numForSale, "Package not available");
        require(msg.value > package.price - 1, "Not enough ETH to cover cost");

        if (_campaignID != 0 && _affiliateID != 0) {
            _attributeSaleToAffiliate(_campaignID, _affiliateID, package.price);
        }

        unchecked {
            package.numSold += 1;
        }

        // Craft message with purchaser address and package ID
        bytes memory message = abi.encode(
            PURCHASE_PACKAGE,
            abi.encode(msg.sender, _packageID)
        );

        // Send message to child tunnel contract
        _sendMessageToChild(message);

        emit PurchasePackage(_packageID, msg.sender);

        _refundIfOverpaid(package.price);
    }

    /**
     * @dev Allows caller to purchase a card if they have
     * sent the correct amount of ETH to cover the cost.
     *
     * Requirements:
     * - `_cardID` must be 0, 1, 2, or 3.
     * - `_campaignID` must exist.
     * - `_campaignID` is active.
     * - `_affiliateID` must exist.
     * - `_affiliateID` is registered with campaign.
     * - `card.mintedSupply` cannot exceed `card.totalSupply`.
     * - `msg.value` must be greater than or equal to `card.price`.
     *
     * @param _cardID ID of the card to purchase.
     * @param _campaignID ID of the campaign the purchase occurred as a result of.
     * @param _affiliateID ID of the affiliate that referred the buyer
     */
    function purchaseCard(
        uint128 _cardID,
        uint256 _campaignID,
        uint256 _affiliateID
    ) public payable onlyGeneralSale nonReentrant {
        CardInfo storage card = _cards[_cardID];
        require(_cardID < 4, "Invalid card ID");
        require(card.mintedSupply < card.totalSupply, "Max supply reached");
        require(msg.value > card.price - 1, "Not enough ETH to cover cost");

        if (_campaignID != 0 && _affiliateID != 0) {
            _attributeSaleToAffiliate(_campaignID, _affiliateID, card.price);
        }

        unchecked {
            card.mintedSupply += 1;
        }

        // Craft message with purchaser address and package ID
        bytes memory message = abi.encode(
            PURCHASE_PACKAGE,
            abi.encode(msg.sender, _cardID)
        );

        // Send message to child tunnel contract
        _sendMessageToChild(message);

        emit PurchaseCard(_cardID, msg.sender);

        _refundIfOverpaid(card.price);
    }

    /***********************************|
    |       Affiliate Functions         |
    |__________________________________*/

    /**
     * @dev Allows an account to become an affiliate for
     * the sale. All accounts that join will receive the
     * standard commission of the campaign.
     *
     * Requirements:
     * - `_campaignID` must exist.
     * - `msg.sender` cannot already be an affiliate
     *
     * @param _campaignID ID of the campaign to join.
     */
    function affiliateSignUp(uint256 _campaignID) external {
        Campaign storage campaign = _campaigns[_campaignID];
        _addAffiliateToCampaign(
            _campaignID,
            msg.sender,
            campaign.standardCommission
        );
    }

    /**
     * @dev Allows a registered affiliate to withdraw the
     * rewards they have earned from selling cards/packages.
     *
     * Requirements:
     * - `_affiliateID` must exist.
     * - `msg.sender` must match `affiliate.account`.
     * - rewards owed must be greater than 0
     */
    function withdrawAffiliateRewards(uint256 _affiliateID) external {
        require(
            _affiliates[_affiliateID].account == msg.sender,
            "Caller is not affiliate"
        );
        _sendRewardsToAffiliate(_affiliateID);
    }

    /***********************************|
    |        Internal Functions         |
    |__________________________________*/

    /**
     * @dev Refunds ETH if caller sent more than the required amount.
     * @param _requiredPayment Payment amount required
     */
    function _refundIfOverpaid(uint256 _requiredPayment) internal {
        uint256 refundAmount = msg.value - _requiredPayment;
        if (refundAmount > 0) {
            payable(msg.sender).transfer(refundAmount);
        }
    }

    // exit processor
    function _processMessageFromChild(bytes memory data) internal override {}
}

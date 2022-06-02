// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
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

    address payable public _proceedsWalletAddress;

    event PurchaseCard(uint256 indexed id, address purchaser);
    event PurchasePackage(uint256 indexed id, address purchaser);
    event RegisterPackage(
        uint256 indexed id,
        uint256 price,
        uint256 numForSale
    );

    /***********************************|
    |          Sale Variables           |
    |__________________________________*/

    /**
     * @dev Stores information about a presale/sale period.
     * @param merkleRootWhitelist (Optional) Root of the merkle tree containing whitelisted addresses.
     * @param cardLimit Max number of cards that an address can purchase.
     * @param packageLimit Max number of packages that an address can purchase.
     */
    struct SaleInfo {
        bytes32 merkleRootWhitelist;
        uint128 cardLimit;
        uint128 packageLimit;
    }

    /**
     * @dev Stores number of cards and packages that have been purchased.
     * @param cardCount Number of cards that an address has purchased.
     * @param packageCount Number of packages that an address has purchased.
     */
    struct SalePurchases {
        uint128 cardCount;
        uint128 packageCount;
    }

    Counters.Counter private _saleIdCounter;

    uint256 private _currentSale;

    // Sale IDs => sale info
    mapping(uint256 => SaleInfo) private _sales;

    // Sale IDs => purchaser address => purchase counts
    mapping(uint256 => mapping(address => SalePurchases)) private _purchases;

    /***********************************|
    |          Card Variables           |
    |__________________________________*/

    // Card IDs to use in _cards mapping
    uint256 private constant _pinkTextCard = 0;
    uint256 private constant _pinkImageCard = 1;
    uint256 private constant _whiteTextCard = 2;
    uint256 private constant _whiteBlankCard = 3;

    /**
     * @dev Structures information required to sell and
     * mint single cards during the the presale/sale period.
     * @param price Price of the card
     * @param totalSupply Max number of cards that can be sold
     * @param mintedSupply Number of cards that have been sold
     */
    struct CardInfo {
        uint256 price;
        uint128 totalSupply;
        uint128 mintedSupply;
    }

    // Card IDs => card info
    mapping(uint256 => CardInfo) private _cards;

    /***********************************|
    |         Package Variables          |
    |__________________________________*/

    /**
     * @dev Structures information required to sell and
     * mint several cards at once during the presale period.
     * @param price Price of the package
     * @param numForSale Number of package for sale
     * @param numSold Number of packages sold
     * @param numCards The number of cards in each package.
     * The index of the array represents the card ID.
     */
    struct PackageInfo {
        uint256 price;
        uint128 numForSale;
        uint128 numSold;
        uint32[4] numCards;
    }

    // Child contract package IDs => presale package info
    mapping(uint256 => PackageInfo) private _packages;

    // Package IDs => if the package has been registered
    mapping(uint256 => bool) private _registeredPackages;

    // Package IDs => sale ID => whether package can be purchased
    mapping(uint256 => mapping(uint256 => bool)) private _saleAvailability;

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

        // ID 0 is reserved for "no sale"
        _saleIdCounter.increment();
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Getter for current sale ID.
     */
    function getActiveSale() public view returns (uint256) {
        return _currentSale;
    }

    /**
     * @dev Getter for sale info for given ID.
     * @param _saleID ID of the sale to query
     */
    function getSaleInfo(uint256 _saleID)
        public
        view
        returns (SaleInfo memory)
    {
        return _sales[_saleID];
    }

    /**
     * @dev Getter for the price in WEI of a presale package.
     * @param _cardID ID of the card to query
     */
    function getCardPrice(uint256 _cardID) public view returns (uint256) {
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
     * @dev Getter for the number of each card type in presale package.
     *
     * Example:
     * If the package has 3 pink text cards, 2 pink image cards,
     * 1 white text card, and 0 blank white cards this function
     * will return [3, 2, 1, 0].
     * @param _packageID ID of the package to query
     */
    function getCardsInPackage(uint256 _packageID)
        public
        view
        returns (uint32[4] memory)
    {
        return _packages[_packageID].numCards;
    }

    /**
     * @dev Getter for max supply of a specific card.
     * @param _cardID ID of the card to query
     */
    function maxSupplyOf(uint256 _cardID) public view returns (uint128) {
        CardInfo storage card = _cards[_cardID];
        return card.totalSupply;
    }

    /**
     * @dev Getter for number of minted cards of a specific color & type.
     * @param _cardID ID of the card to query
     */
    function mintedSupplyOf(uint256 _cardID) public view returns (uint128) {
        CardInfo storage card = _cards[_cardID];
        return card.mintedSupply;
    }

    /***********************************|
    |       Only Owner Functions        |
    |__________________________________*/

    /**
     * @dev Allows contract owner to set the ID of the current active sale.
     * Setting the ID to 0 will disable the sale.
     *
     * Requirements:
     * - Must be called by the contract owner
     *
     * @param _merkleRoot Merkle root of the sale whitelist
     * @param _cardLimit Max number of cards an address can purchase during sale.
     * @param _packageLimit Max number of packages an address can purchase during sale.
     */
    function createSale(
        bytes32 _merkleRoot,
        uint128 _cardLimit,
        uint128 _packageLimit
    ) public onlyOwner {
        uint256 saleID = _saleIdCounter.current();
        _saleIdCounter.increment();

        SaleInfo storage sale = _sales[saleID];
        sale.merkleRootWhitelist = _merkleRoot;
        sale.cardLimit = _cardLimit;
        sale.packageLimit = _packageLimit;
    }

    /**
     * @dev Allows contract owner to update the whitelist merkle root of a sale
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_saleID` < `_saleIdCounter`
     * - `_currentSale` != `_saleID`
     *
     * @param _saleID ID of the sale to set as active
     */
    function setWhitelist(uint256 _saleID, bytes32 _merkleRoot)
        public
        onlyOwner
    {
        require(_saleID < _saleIdCounter.current(), "Invalid sale ID");
        require(_currentSale != _saleID, "Cannot update when sale is active");

        SaleInfo storage sale = _sales[_saleID];
        sale.merkleRootWhitelist = _merkleRoot;
    }

    /**
     * @dev Allows contract owner to set the ID of the current active sale.
     * Setting the ID to 0 will disable the sale.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_saleID` < `_saleIdCounter`
     *
     * @param _saleID ID of the sale to set as active
     */
    function setActiveSale(uint256 _saleID) public onlyOwner {
        require(_saleID < _saleIdCounter.current(), "Invalid sale ID");
        _currentSale = _saleID;
    }

    /**
     * @dev Allows contract owner to set total supply of card.
     *
     * Note - This function should be called after contract is deployed
     *      and before configuring card sale info and card packages.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_currentSale` must be 0
     * - `_cardID` must be 0, 1, 2, or 3
     * - `_supply` must be greater than 0
     *
     * @param _cardID ID of the card to set.
     * @param _supply New total supply.
     */
    function setCardMaxSupply(uint256 _cardID, uint128 _supply)
        public
        onlyOwner
    {
        require(_currentSale == 0, "Cannot change during sale");
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
    function setCardPrice(uint256 _cardID, uint256 _price) public onlyOwner {
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
     * - `_numCards` must contain at least 1 item with value greater than 0
     * - `_saleIDs.length` > 0
     * - `_saleIDs` item values > 0
     * - `_saleIDs` item values < `_saleIdCounter`
     *
     * @param _packageID ID of the package in child tunnel contract
     * @param _price The price of the package in wei
     * @param _numForSale Number of packages that can be bought
     * @param _numCards Array of where each index is card id and value is number of cards
     * @param _saleIDs Array of sale IDs that the package is available during
     */
    function registerChildPackage(
        uint256 _packageID,
        uint256 _price,
        uint128 _numForSale,
        uint32[4] calldata _numCards,
        uint256[] calldata _saleIDs
    ) public onlyOwner {
        require(!_registeredPackages[_packageID], "Package already registered");
        require(_price > 0, "Price cannot be 0");
        require(_numForSale > 0, "Number of packages cannot be 0");
        require(
            _numCards[0] > 0 ||
                _numCards[1] > 0 ||
                _numCards[2] > 0 ||
                _numCards[3] > 0,
            "Must contain at least one card"
        );

        require(_saleIDs.length > 0, "No sale IDs provided");
        for (uint256 i = 0; i < _saleIDs.length; i++) {
            require(
                _saleIDs[i] > 0 && _saleIDs[i] < _saleIdCounter.current(),
                "Invalid sale ID"
            );
            _saleAvailability[_packageID][_saleIDs[i]] = true;
        }

        _registeredPackages[_packageID] = true;
        PackageInfo storage package = _packages[_packageID];
        package.price = _price;
        package.numForSale = _numForSale;
        package.numCards = _numCards;

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
     * @param _endTime The time the campaign becomes NOT_STARTED
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
     * - `_packageID` must be purchasable during `_currentSale`.
     * - `msg.value` >= `package.price`.
     * - `package.numSold` <= `package.numForSale`.
     * - For all cards in package, `card.mintedSupply` + `package.numCards' <= `card.totalSupply`.
     *
     * @param _packageID ID of the package to purchase.
     * @param _campaignID ID of the campaign the purchase occurred as a result of.
     * @param _affiliateID ID of the affiliate that referred the buyer
     * @param _merkleProof Proof used to verify address exists in merkle tree whitelist
     */
    function purchasePackage(
        uint256 _packageID,
        uint256 _campaignID,
        uint256 _affiliateID,
        bytes32[] calldata _merkleProof
    ) public payable nonReentrant {
        PackageInfo storage package = _packages[_packageID];
        SaleInfo storage sale = _sales[_currentSale];
        SalePurchases storage purchases = _purchases[_currentSale][msg.sender];

        require(_registeredPackages[_packageID], "Package does not exist");
        require(msg.value > package.price - 1, "Not enough ETH to cover cost");
        require(package.numSold < package.numForSale, "Package not available");
        require(
            _saleAvailability[_packageID][_currentSale],
            "Not available for current sale"
        );
        require(
            purchases.packageCount < sale.packageLimit,
            "Max package purchases reached"
        );

        // Check that enough cards are available to fulfill the package
        uint32[4] memory numCards = package.numCards;
        for (uint256 i = 0; i < 4; i++) {
            if (numCards[i] > 0) {
                CardInfo storage card = _cards[i];
                unchecked {
                    require(
                        card.mintedSupply + numCards[i] < card.totalSupply + 1,
                        "Not enough cards remaining"
                    );
                    card.mintedSupply += numCards[i];
                }
            }
        }

        // Validate merkle proof if sale has a whitelist and proof is provided
        if (sale.merkleRootWhitelist != bytes32(0)) {
            _validateWhitelistProof(sale.merkleRootWhitelist, _merkleProof);
        }

        // Attribute sale to affiliate if necessary
        if (_campaignID != 0 && _affiliateID != 0) {
            _attributeSaleToAffiliate(_campaignID, _affiliateID, package.price);
        }

        unchecked {
            package.numSold += 1;
            purchases.packageCount += 1;
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
     * - `_currentSale` != 0
     * - `_cardID` must be 0, 1, 2, or 3.
     * - `_campaignID` must exist.
     * - `_campaignID` is active.
     * - `_affiliateID` must exist.
     * - `_affiliateID` is registered with campaign.
     * - `msg.value` >= `card.price`.
     * - `card.mintedSupply` <= `card.totalSupply`.
     *
     * @param _cardID ID of the card to purchase.
     * @param _campaignID ID of the campaign the purchase occurred as a result of.
     * @param _affiliateID ID of the affiliate that referred the buyer
     * @param _merkleProof Proof used to verify address exists in merkle tree whitelist
     */
    function purchaseCard(
        uint256 _cardID,
        uint256 _campaignID,
        uint256 _affiliateID,
        bytes32[] calldata _merkleProof
    ) public payable nonReentrant {
        CardInfo storage card = _cards[_cardID];
        SaleInfo storage sale = _sales[_currentSale];
        SalePurchases storage purchases = _purchases[_currentSale][msg.sender];

        require(_currentSale != 0, "No active sale");
        require(_cardID < 4, "Invalid card ID");
        require(card.mintedSupply < card.totalSupply, "Max supply reached");
        require(msg.value > card.price - 1, "Not enough ETH to cover cost");
        require(
            purchases.cardCount < sale.cardLimit,
            "Max card purchases reached"
        );

        // Validate merkle proof if sale has a whitelist
        if (sale.merkleRootWhitelist != bytes32(0)) {
            _validateWhitelistProof(sale.merkleRootWhitelist, _merkleProof);
        }

        // Attribute sale to affiliate if necessary
        if (_campaignID != 0 && _affiliateID != 0) {
            _attributeSaleToAffiliate(_campaignID, _affiliateID, card.price);
        }

        unchecked {
            card.mintedSupply += 1;
            purchases.cardCount += 1;
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

    /**
     * @dev Check that the proof is valid and merkle tree whitelist contains
     * the msg.sender.
     * @param _root Root of the merkle tree containing whitelisted addresses.
     * @param _proof Proof used to verify address exists in merkle tree
     * @return True if address and proof are valid, false otherwise.
     */
    function _validateWhitelistProof(bytes32 _root, bytes32[] calldata _proof)
        internal
        view
        returns (bool)
    {
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(_proof, _root, leaf), "Invalid proof");
        return true;
    }

    // exit processor
    function _processMessageFromChild(bytes memory data) internal override {}
}

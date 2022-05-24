// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@maticnetwork/fx-portal/contracts/tunnel/FxBaseChildTunnel.sol";
import "../interfaces/IVestingTreasury.sol";
import "../interfaces/IPhlipCard.sol";

/**
 * @dev Child contract for the Phlip cross-chain crowdsale that will be deployed on Polygon.
 * This contract is responsible for minting individual cards or all cards in a package that
 * were purchases from root contract.
 *
 * ## StateSync Polygon Addresses
 * ### Mumbai
 * - _fxChild: 0xCf73231F28B7331BBe3124B907840A94851f9f11
 *
 * ### Mainnet
 * - _fxChild: 0x8397259c983751DAf40400790063935a11afa28a
 */
contract FxSaleChildTunnel is Ownable, ReentrancyGuard, FxBaseChildTunnel {
    using Counters for Counters.Counter;

    /// @dev FX-Portal message types
    bytes32 public constant PURCHASE_CARD = keccak256("PURCHASE_CARD");
    bytes32 public constant PURCHASE_PACKAGE = keccak256("PURCHASE_PACKAGE");

    /// @dev FX-Portal state vars
    uint256 public latestStateId;
    address public latestRootMessageSender;
    bytes public latestData;

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
    }

    struct CardBundle {
        uint128 cardID;
        uint128 numCards;
        uint256[] scheduleIDs;
    }

    // Token contract addresses
    address private immutable _daoTokenAddress;
    address private immutable _p2eTokenAddress;

    // Wallet addresses containing tokens
    address private immutable _daoWalletAddress;
    address private immutable _p2eWalletAddress;

    // Cliff and duration for all vesting schedules
    uint256 private immutable _vestingCliff;
    uint256 private immutable _vestingDuration;

    // Card IDs to use in _cards mapping
    uint128 private constant _pinkTextCard = 0;
    uint128 private constant _pinkImageCard = 1;
    uint128 private constant _whiteTextCard = 2;
    uint128 private constant _whiteBlankCard = 3;

    Counters.Counter internal _packageIds;

    // Mapping of IDs to card info
    mapping(uint128 => CardInfo) private _cards;

    // Card IDs => array of vesting schedule IDs
    mapping(uint128 => uint256[]) private _cardVestingSchedules;

    // package IDs => card bundle array for the package
    mapping(uint256 => CardBundle[]) private _packages;

    constructor(
        address _pcAddress,
        address _wcAddress,
        address _daoToken,
        address _p2eToken,
        address _daoWallet,
        address _p2eWallet,
        uint256 _cliff,
        uint256 _duration,
        address _fxChild
    ) FxBaseChildTunnel(_fxChild) {
        require(_pcAddress != address(0), "Pink card cannot be 0x0");
        require(_wcAddress != address(0), "White card cannot be 0x0");
        require(_daoToken != address(0), "DAO tokens cannot be 0x0");
        require(_p2eToken != address(0), "P2E tokens cannot be 0x0");
        require(_daoWallet != address(0), "DAO wallet cannot be 0x0");
        require(_p2eWallet != address(0), "P2E wallet cannot be 0x0");
        require(_cliff > 0, "Vesting cliff must be greater than 0");
        require(_duration > 0, "Vesting duration must be greater than 0");

        _daoTokenAddress = _daoToken;
        _p2eTokenAddress = _p2eToken;

        _daoWalletAddress = _daoWallet;
        _p2eWalletAddress = _p2eWallet;

        _vestingCliff = _cliff;
        _vestingDuration = _duration;

        CardInfo storage ptCard = _cards[_pinkTextCard];
        ptCard.color = Color.PINK;
        ptCard.varient = Varient.TEXT;
        ptCard.contractAddress = _pcAddress;

        CardInfo storage piCard = _cards[_pinkImageCard];
        piCard.color = Color.PINK;
        piCard.varient = Varient.SPECIAL;
        piCard.contractAddress = _pcAddress;

        CardInfo storage wtCard = _cards[_whiteTextCard];
        wtCard.color = Color.WHITE;
        wtCard.varient = Varient.TEXT;
        wtCard.contractAddress = _wcAddress;

        CardInfo storage wbCard = _cards[_whiteBlankCard];
        wbCard.color = Color.WHITE;
        wbCard.varient = Varient.SPECIAL;
        wbCard.contractAddress = _wcAddress;
    }

    /***********************************|
    |       Only Owner Functions        |
    |__________________________________*/

    /**
     * @dev Allows contract owner to set vesting schedule info for cards.
     *
     * Requirements:
     * - Must be called by the contract owner
     * - `_cardID` must be 0, 1, 2, or 3
     * - `_scheduleIDs` must contain IDs for existing schedules vesting with
     * reserves containing enough tokens to create vesting capsules from
     *
     * @param _scheduleIDs Array containing vesting schedule IDs.
     */
    function setCardVestingInfo(
        uint128 _cardID,
        uint256[] calldata _scheduleIDs
    ) public onlyOwner {
        require(_cardID < 4, "Invalid card ID");

        IVestingTreasury treasury = IVestingTreasury(
            _cards[_cardID].contractAddress
        );
        for (uint256 i = 0; i < _scheduleIDs.length; i++) {
            require(
                treasury.scheduleExists(_scheduleIDs[i]),
                "Vesting schedule ID is invalid"
            );
        }

        _cardVestingSchedules[_cardID] = _scheduleIDs;
    }

    /**
     * @dev Allows contract owner to create a presale package that contains 1 card type
     * @param _cardID ID of the card in the package (can be 0-3)
     * @param _numCards Number of cards in the package
     * @param _daoAmount The amount of DAO tokens that will vest in card
     * @param _p2eAmount The amount of P2E tokens that will vest in card
     * @param _reserveMultiple Multplier for filling vesting schedule reserves.
     * Should equal number of expected packages that will be created.
     */
    function createSingleCardPackage(
        uint128 _cardID,
        uint128 _numCards,
        uint256 _daoAmount,
        uint256 _p2eAmount,
        uint256 _reserveMultiple
    ) public onlyOwner {
        require(
            _reserveMultiple > 0,
            "FxSaleChildTunnel: Resever multiple is 0"
        );

        uint256 packageId = _packageIds.current();
        _packageIds.increment();

        CardBundle[] storage bundle = _packages[packageId];

        // Add vesting info with card info and number of card in package
        bundle.push(
            _createCardBundle(
                _cardID,
                _numCards,
                _daoAmount,
                _p2eAmount,
                _reserveMultiple
            )
        );
    }

    /**
     * @dev Allows contract owner to create a presale package that contains multiple card types
     * @param _cardIDs Array of IDs of the card in the package (can be 0-3)
     * @param _numCards Array containing number of each card in the package
     * @param _daoAmounts Array of DAO tokens amounts that will vest in each card
     * @param _p2eAmounts Array of P2E tokens amounts that will vest in each card
     * @param _reserveMultiples Array of multpliers for filling vesting schedule
     * reserves. Should equal number of expected packages that will be created.
     */
    function createMultiCardPackage(
        uint128[] calldata _cardIDs,
        uint128[] calldata _numCards,
        uint256[] calldata _daoAmounts,
        uint256[] calldata _p2eAmounts,
        uint256[] calldata _reserveMultiples
    ) public onlyOwner {
        uint256 packageId = _packageIds.current();
        _packageIds.increment();

        CardBundle[] storage bundle = _packages[packageId];

        for (uint256 i = 0; i < _numCards.length; i++) {
            // Add vesting info with card info and number of card in package
            bundle.push(
                _createCardBundle(
                    _cardIDs[i],
                    _numCards[i],
                    _daoAmounts[i],
                    _p2eAmounts[i],
                    _reserveMultiples[i]
                )
            );
        }
    }

    /***********************************|
    |         Tunnel Functions          |
    |__________________________________*/

    /**
     * @dev External entry point to receive and relay messages originating
     * from the fxChild.
     *
     * Non-reentrancy is crucial to avoid a cross-chain call being able
     * to impersonate anyone by just looping through this with user-defined
     * arguments.
     *
     * @param stateId Unique state id
     * @param rootMessageSender Address of root message sender
     * @param data Bytes message that was sent from Root Tunnel
     */
    function processMessageFromRoot(
        uint256 stateId,
        address rootMessageSender,
        bytes calldata data
    ) external override nonReentrant {
        require(msg.sender == fxChild, "FxSaleChildTunnel: Invalid sender");
        _processMessageFromRoot(stateId, rootMessageSender, data);
    }

    /**
     * @dev Invoked by polygon validators via a system call. Accepts purchase
     * info from CrowdSaleRootTunnel and mints card(s) from card/package purchase.
     *
     * Note - Since invokation is from a system call, no events will be emitted during execution.
     * @param stateId Unique state id
     * @param sender Root message sender
     * @param data Bytes message that was sent from Root Tunnel
     */
    function _processMessageFromRoot(
        uint256 stateId,
        address sender,
        bytes memory data
    ) internal override validateSender(sender) {
        latestStateId = stateId;
        latestRootMessageSender = sender;
        latestData = data;

        (bytes32 syncType, bytes memory syncData) = abi.decode(
            data,
            (bytes32, bytes)
        );

        if (syncType == PURCHASE_CARD) {
            _executeCardPurchase(syncData);
        } else if (syncType == PURCHASE_PACKAGE) {
            _executePackagePurchase(syncData);
        } else {
            revert("FxSaleChildTunnel: Invalid message type");
        }
    }

    /**
     * @dev Accepts card purchase data from CrowdSaleRootTunnel and mints card accordingly.
     * @param _purchaseData ABI encoded data about the purchase from root contract
     */
    function _executeCardPurchase(bytes memory _purchaseData) internal {
        (address purchaser, uint128 cardId) = abi.decode(
            _purchaseData,
            (address, uint128)
        );

        CardInfo storage card = _cards[cardId];

        // Mint card
        IPhlipCard(card.contractAddress).mintCard(
            purchaser,
            "",
            uint256(card.varient),
            _cardVestingSchedules[cardId]
        );
    }

    /**
     * @dev Accepts package purchase data from CrowdSaleRootTunnel and mints cards accordingly.
     * @param _purchaseData ABI encoded data about the purchase from root contract
     */
    function _executePackagePurchase(bytes memory _purchaseData) internal {
        (address purchaser, uint256 packageId) = abi.decode(
            _purchaseData,
            (address, uint256)
        );
        CardBundle[] storage cardBundles = _packages[packageId];

        for (uint256 i = 0; i < cardBundles.length; i++) {
            CardInfo storage card = _cards[cardBundles[i].cardID];

            for (uint256 j = 0; j < cardBundles[i].numCards; j++) {
                // Mint card
                IPhlipCard(card.contractAddress).mintCard(
                    purchaser,
                    "",
                    uint256(card.varient),
                    cardBundles[i].scheduleIDs
                );
            }
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
        uint256 _daoAmount,
        uint256 _p2eAmount,
        uint256 _reserveMultiple
    ) private returns (CardBundle memory) {
        require(_numCards > 0, "Number of cards cannot be 0");
        require(_daoAmount > 0, "DAO token amount cannot be 0");
        require(_p2eAmount > 0, "P2E token amount cannot be 0");
        require(_reserveMultiple > 0, "Resever multiple is 0");

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

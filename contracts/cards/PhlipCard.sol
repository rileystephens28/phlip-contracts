// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "../vesting/GuardedVestingCapsule.sol";
import "../lockable/ERC721Lockable.sol";
import "../vouchers/VoucherRegistry.sol";
import "../interfaces/IPhlipCard.sol";

/**
 * @title PhlipCard
 * @author Riley Stephens
 * @dev This is the parent contract for pink and white Phlip game cards. This
 * contract is responsible for implementing the common functionality of both cards.
 *
 * ## Features
 *
 * ### Updatable Metadata
 * Card minters (must also be owner) are allowed to change their cards URI once
 * if their card has been downvoted too many times. Once a cards URI has been updated, the cards stats
 * should be reset to reflect that the card is basically new.
 *
 * ### Redeemable Vouchers
 * Grants addresses the ability to mint a specified number of cards directly from the contract
 * rather than requiring a MINTER to do it for them. Vouchers can be granted to certain addresses (SOTM owners)
 * or sold to addresses by MINTER contracts (presale).
 *
 * ### Vesting Capsule
 * The Card owner will also be registered as a beneficiary and receive PhlipDAO and PhlipP2E
 * tokens on a vesting schedule. When a Card is transferred to another address, the new owner becomes the recipient
 * of the vesting tokens. Once the tokens in a vesting capsule for a Card have run out, all future owners of that
 * Card will stop receiving vested payouts.
 */
contract PhlipCard is
    AccessControl,
    ERC721Royalty,
    GuardedVestingCapsule,
    ERC721Lockable,
    VoucherRegistry,
    Pausable,
    IPhlipCard
{
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SETTINGS_ROLE = keccak256("SETTINGS_ROLE");

    string public BASE_URI;
    uint64 public FREE_URI_CHANGES;
    uint256 public URI_CHANGE_FEE;

    address public developmentWallet;

    Counters.Counter internal _tokenIds;

    struct MetadataChanges {
        uint64 free;
        uint64 paid;
        uint128 lastChangeTS;
    }

    // Token ID => URI string
    mapping(uint256 => string) internal _tokenURIs;

    // Token ID => Number of times URI has been updated
    mapping(uint256 => MetadataChanges) internal _metadataChanges;

    // Token ID => Address of token minter
    mapping(uint256 => address) internal _minters;

    // Token ID => Array of vesting schedule IDs used to mint card when voucher is redeemed
    mapping(uint256 => uint256[]) internal _voucherVestingSchemes;

    /**
     * @dev Create a new instance of the PhlipCard contract.
     *
     * Requirements:
     *
     * - `_baseUri` cannot be blank.
     * - `_freeUriChanges` must be >= 1.
     * - `_devWallet` cannot be zero address.
     *
     * @param _name Name of the card NFT
     * @param _symbol Symbol of the card NFT
     * @param _baseUri IPSF gateway URI for the card
     * @param _devWallet Address of the developer wallet to collect fees
     * @param _freeUriChanges Number of times minter can change card's URI before paying fee
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        address _devWallet,
        uint64 _freeUriChanges
    ) ERC721(_name, _symbol) {
        require(bytes(_baseUri).length > 0, "PhlipCard: Base URI is blank");
        require(_freeUriChanges > 0, "PhlipCard: Free URI changes is 0");
        require(
            _devWallet != address(0),
            "PhlipCard: Dev wallet is zero address"
        );

        // Grant roles for this contract
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(SETTINGS_ROLE, msg.sender);

        // Grant role for GuardedVestingCapsule
        _grantRole(TREASURER_ROLE, msg.sender);

        // Set globals
        BASE_URI = _baseUri;
        FREE_URI_CHANGES = _freeUriChanges;

        developmentWallet = payable(_devWallet);
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function to get address of card minter
     * @param _cardID The ID of the card to check
     * @return Address that minted the card
     */
    function minterOf(uint256 _cardID) public view returns (address) {
        return _minters[_cardID];
    }

    /**
     * @dev Accessor function to get type of card.
     * Note - This function will also return the type of a voucher
     * @param _cardID The ID of the card to check
     * @return Integer corresponding to card's type
     */
    function typeOf(uint256 _cardID) public view returns (uint256) {
        return _getCardType(_cardID);
    }

    /**
     * @dev Accessor function for getting card's URI from ID
     * Modified implementation of ERC721URIStorage.tokenURI
     *
     * Requirements:
     *
     * - `_tokenId` must exist.
     *
     * @param _tokenId ID of the card to get URI of
     * @return URI of the card
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override(ERC721, IPhlipCard)
        returns (string memory)
    {
        require(_exists(_tokenId), "PhlipCard: Card does not exist");

        string storage uri = _tokenURIs[_tokenId];

        // If there is no base URI, return the token URI.
        if (bytes(BASE_URI).length == 0) {
            return uri;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(uri).length > 0) {
            return string(abi.encodePacked(BASE_URI, uri));
        }

        return super.tokenURI(_tokenId);
    }

    /***********************************|
    |     Settings Admin Functions      |
    |__________________________________*/

    /**
     * @dev Allows Settings Admin to set the base URI for
     * all tokens created by this contract
     *
     * Requirements:
     *
     * - `msg.sender` must have Settings Admin role
     *
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI)
        external
        onlyRole(SETTINGS_ROLE)
    {
        BASE_URI = _newURI;
    }

    /**
     * @dev Allows Settings Admin to set number of times
     * minter can change the URI of a card for free.
     *
     * Requirements:
     *
     * - `msg.sender` must have Settings Admin role
     *
     * @param _newMax New free changes allowed
     */
    function setFreeUriChanges(uint64 _newMax)
        external
        onlyRole(SETTINGS_ROLE)
    {
        FREE_URI_CHANGES = _newMax;
    }

    /**
     * @dev Allows Settings Admin to set the cost
     * of changing a card's URI once.
     *
     * Requirements:
     *
     * - `msg.sender` must have Settings Admin role
     *
     * @param _fee The fee (in wei) to charge for changing card URI
     */
    function setUriChangeFee(uint256 _fee) external onlyRole(SETTINGS_ROLE) {
        URI_CHANGE_FEE = _fee;
    }

    /**
     * @dev Allow Settings Admin to set the royalty information
     * that all ids in this contract will default to.
     *
     * Requirements:
     *
     * - `receiver` cannot be the zero address.
     * - `feeNumerator` cannot be greater than the fee denominator.
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator)
        external
        onlyRole(SETTINGS_ROLE)
    {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Allows Settings Admin to set address of development wallet
     *
     * Requirements:
     *
     * - `_wallet` cannot be zero address.
     * - `msg.sender` must have Settings Admin role
     *
     * @param _wallet Address of new developer wallet
     */
    function setDevWalletAddress(address _wallet)
        external
        onlyRole(SETTINGS_ROLE)
    {
        require(
            _wallet != address(0),
            "PhlipCard: Dev wallet can be zero address"
        );
        developmentWallet = _wallet;
    }

    /***********************************|
    |      Pauser Admin Functions       |
    |__________________________________*/

    /**
     * @dev Pause card transfers
     *
     * Requirements:
     *
     * - `msg.sender` must have Pauser role.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause card transfers
     *
     * Requirements:
     *
     * - `msg.sender` must have Pauser role.
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /***********************************|
    |      Minter Admin Functions       |
    |__________________________________*/

    /**
     * @dev Allow minter to mint a text card to a given address.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `_scheduleIDs` must contain IDs for existing schedules vesting with
     * reserves containing enough tokens to create vesting capsules from
     * - `msg.sender` must have Minter role.
     *
     * @param _to The address to mint to.
     * @param _uri The IPFS CID referencing the new cards text metadata.
     * @param _type The type of card to mint (text, image, blank, etc)
     * @param _scheduleIDs Array of vesting schedule IDs to create card's vesting capsules from
     */
    function mintCard(
        address _to,
        string memory _uri,
        uint256 _type,
        uint256[] calldata _scheduleIDs
    ) external virtual onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 tokenId = _tokenIds.current();
        _tokenIds.increment();

        // Mint card for _to address
        _mintCard(tokenId, _to, _uri, _scheduleIDs);
        _setCardType(tokenId, _type);
    }

    /**
     * @dev Issue a text card voucher to a given address.
     *
     * Requirements:
     *
     * - `_to` cannot be zero address.
     * - `_scheduleIDs` must contain IDs for existing schedules vesting
     * - `msg.sender` must have Minter role.
     *
     * @param _to The address to issue voucher to.
     * @param _type The type of card to mint (text, image, blank, etc)
     * @param _scheduleIDs Array of vesting schedule IDs to create future card with
     */
    function issueCardVoucher(
        address _to,
        uint256 _type,
        uint256[] calldata _scheduleIDs
    ) external virtual onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 reservedTokenId = _tokenIds.current();
        _tokenIds.increment();

        // Set vesting scheme for reserved card
        _voucherVestingSchemes[reservedTokenId] = _scheduleIDs;

        _issueVoucher(_to, reservedTokenId);
        _setCardType(reservedTokenId, _type);
    }

    /**
     * @dev Issue many card vouchers (with same type)
     * to a given address.
     *
     * Requirements:
     *
     * - `_to` cannot be zero address.
     * - `msg.sender` must have MINTER role.
     *
     * @param _to The address to mint tokens to.
     * @param _type Integer card type that vouchers can be redeemed for.
     * @param _amount Number of vouchers to issue.
     * @param _scheduleIDs Array of vesting schedule IDs to create future cards with
     */
    function batchIssueCardVouchers(
        address _to,
        uint256 _type,
        uint256 _amount,
        uint256[] calldata _scheduleIDs
    ) external virtual onlyRole(MINTER_ROLE) {
        for (uint256 i = 0; i < _amount; i++) {
            // Get the next token ID then increment the counter
            uint256 reservedTokenId = _tokenIds.current();
            _tokenIds.increment();

            _voucherVestingSchemes[reservedTokenId] = _scheduleIDs;

            _issueVoucher(_to, reservedTokenId);
            _setCardType(reservedTokenId, _type);
        }
    }

    /***********************************|
    |     Public/External Functions     |
    |__________________________________*/

    /**
     * @dev Update the URI of a card.
     *
     * If the URI was not set during mint, this function allows the
     * owner to set it without it counting towards the number of URI changes.
     *
     * Requirements:
     *
     * - `_cardID` must exist.
     * - `_uri` cannot be blank.
     * - `msg.sender` must be owner of `_cardID`
     * - `msg.sender` must be minter of `_cardID`
     * - number of times metadata was updated for free must be < `FREE_URI_CHANGES`
     *
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateMetadata(uint256 _cardID, string memory _uri)
        public
        payable
        virtual
    {
        require(_exists(_cardID), "PhlipCard: Card does not exist");
        require(bytes(_uri).length > 0, "PhlipCard: URI cannot be empty");
        require(msg.sender == ownerOf(_cardID), "PhlipCard: Must be owner");
        require(msg.sender == _minters[_cardID], "PhlipCard: Must be minter");

        MetadataChanges storage metadataChanges = _metadataChanges[_cardID];

        if (bytes(_tokenURIs[_cardID]).length > 0) {
            // Card has set URI at least once, increment URI change count
            metadataChanges.lastChangeTS = uint128(block.timestamp);
            if (metadataChanges.free < FREE_URI_CHANGES) {
                metadataChanges.free += 1;
            } else {
                // Ran out of free URI changes, must pay fee
                require(URI_CHANGE_FEE > 0, "PhlipCard: Change fee not set");
                require(
                    msg.value >= URI_CHANGE_FEE,
                    "PhlipCard: Insufficient change fee payment"
                );
                metadataChanges.paid += 1;

                // If user overpaid, refund them the difference
                uint256 refundAmount = msg.value - URI_CHANGE_FEE;
                if (refundAmount > 0) {
                    payable(msg.sender).transfer(refundAmount);
                }
            }
        }
        _tokenURIs[_cardID] = _uri;
    }

    /**
     * @dev Mint card with ID that has been reserved by the callers voucher
     * Requires that caller has >=1 remaining card vouchers.
     *
     * Requirements:
     *
     * - `_reservedID` must correspond with valid voucher.
     * - `msg.sender` must be holder of `_reservedID` voucher
     * - `_paused` must be false.
     *
     * @param _reservedID ID reserved by the callers voucher
     * @param _uri The IPFS CID referencing the new tokens metadata
     */
    function redeemVoucher(uint256 _reservedID, string memory _uri)
        public
        virtual
        whenNotPaused
    {
        _redeemVoucher(msg.sender, _reservedID);

        // Mints card with reserved ID to caller
        _mintCard(
            _reservedID,
            msg.sender,
            _uri,
            _voucherVestingSchemes[_reservedID]
        );

        delete _voucherVestingSchemes[_reservedID];
    }

    /**
     * @dev Transfer creatorship of a card to a new address.
     *
     * Requirements:
     *
     * - `_to` cannot be zero address.
     * - `msg.sender` must be minter of `_cardID`
     *
     * @param _to The address to transfer creatorship to.
     * @param _cardID ID of the card whose creatorship to transfer
     */
    function transferCreatorship(address _to, uint256 _cardID) external {
        require(_to != address(0), "PhlipCard: Cannot transfer to 0x0");
        require(msg.sender == _minters[_cardID], "PhlipCard: Must be minter");
        _minters[_cardID] = _to;
    }

    /***********************************|
    |         Private Functions         |
    |__________________________________*/

    /**
     * @dev Mints card to the given address.
     *
     * Requirements:
     *
     * - `_cardID` must not exist.
     * - `to` cannot be the zero address.
     * - `_scheduleIDs` must contain IDs for existing schedules vesting with
     * reserves containing enough tokens to create vesting capsules from
     *
     * @param _cardID The ID of card being minted
     * @param _to The address to mint card to
     * @param _uri The IPFS CID referencing the new card's metadata
     * @param _scheduleIDs Array of vesting schedule IDs to create card's vesting capsules from
     */
    function _mintCard(
        uint256 _cardID,
        address _to,
        string memory _uri,
        uint256[] memory _scheduleIDs
    ) internal virtual {
        // Set card URI and minters address
        _tokenURIs[_cardID] = _uri;
        _minters[_cardID] = _to;

        _mint(_to, _cardID);
        _createCapsuleGroup(_cardID, _to, block.timestamp, _scheduleIDs);
    }

    /**
     * @dev This function is called when a card is created or a voucher is issued.
     *  It is intended to be overridden by child contracts to allow for custom type logic.
     * @param _cardID The ID of card whose type to set
     * @param _type Int type of card to mint (text, image, blank, etc)
     */
    function _setCardType(uint256 _cardID, uint256 _type) internal virtual {}

    /**
     * @dev This function is called by typeOf. It is intended to be
     * overridden by child contracts to allow for custom type logic.
     * @param _cardID The ID of card whose type to set
     * @return Integer type of card (0 - text, 1 - image, etc)
     */
    function _getCardType(uint256 _cardID)
        internal
        view
        virtual
        returns (uint256)
    {}

    /**
     * @dev Function called before tokens are transferred. Override to
     * make sure that token tranfers have not been paused.
     *
     * Requirements:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * @param _from The address tokens will be transferred from
     * @param _to The address tokens will be transferred  to
     * @param _tokenId The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override(ERC721, ERC721Lockable) whenNotPaused {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }

    /**
     * @dev Function called after tokens are transferred.
     * Override ERC721 and VestingCapsule
     *
     * Requirements:
     * - when `from` and `to` are both non-zero.
     * - `from` and `to` are never both zero.
     *
     * @param _from The address tokens were transferred from
     * @param _to The address tokens were transferred  to
     * @param _tokenId The ID of the token transferred
     */
    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override(ERC721, VestingCapsule) {
        super._afterTokenTransfer(_from, _to, _tokenId);
    }

    function _burn(uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721Royalty)
    {
        super._burn(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Royalty, GuardedVestingCapsule, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

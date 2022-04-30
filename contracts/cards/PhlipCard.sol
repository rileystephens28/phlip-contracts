// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
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
    GuardedVestingCapsule,
    ERC721Lockable,
    VoucherRegistry,
    Pausable,
    IPhlipCard
{
    using Counters for Counters.Counter;

    string public BASE_URI;
    uint256 public MAX_URI_CHANGES;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant SETTINGS_ROLE = keccak256("SETTINGS_ROLE");

    Counters.Counter internal _tokenIds;

    // Token ID => URI string
    mapping(uint256 => string) internal _tokenURIs;

    // Token ID => Number of times URI has been updated
    mapping(uint256 => uint256) internal _metadataChangeCounts;

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
     * - `_maxUriChanges` must be >= 1.
     *
     * @param _name Name of the card NFT
     * @param _symbol Symbol of the card NFT
     * @param _baseUri IPSF gateway URI for the card
     * @param _maxUriChanges Number of times minter can change card's URI
     */
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        uint256 _maxUriChanges
    ) ERC721(_name, _symbol) {
        require(bytes(_baseUri).length > 0, "PhlipCard: Base URI is blank");
        require(_maxUriChanges > 0, "PhlipCard: Max URI changes is 0");

        // Grant roles for this contract
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(SETTINGS_ROLE, msg.sender);

        // Grant role for GuardedVestingCapsule
        _grantRole(TREASURER_ROLE, msg.sender);

        // Set globals
        setBaseURI(_baseUri);
        setMaxUriChanges(_maxUriChanges);
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
     * @dev Allows MINTER to set the base URI for
     * all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI) public onlyRole(SETTINGS_ROLE) {
        BASE_URI = _newURI;
    }

    /**
     * @dev Allows Settings Admin to set max number
     * of times minter can change the URI of a card.
     * @param _newMax New max changes allowed
     */
    function setMaxUriChanges(uint256 _newMax) public onlyRole(SETTINGS_ROLE) {
        MAX_URI_CHANGES = _newMax;
    }

    /***********************************|
    |      Pauser Admin Functions       |
    |__________________________________*/

    /**
     * @dev Allow address with PAUSER role to pause card transfers
     *
     * Requirements:
     *
     * - `msg.sender` must have PAUSER role.
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Allow address with PAUSER role to unpause card transfers
     *
     * Requirements:
     *
     * - `msg.sender` must have PAUSER role.
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
     * - `msg.sender` must have MINTER role.
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
     * @dev Allow minter to issue a text card voucher to a given address.
     *
     * Requirements:
     *
     * - `_to` cannot be zero address.
     * - `_scheduleIDs` must contain IDs for existing schedules vesting
     * - `msg.sender` must have MINTER role.
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
     * @dev Allow minter to issue many card vouchers (with same type)
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
     * @dev Allows owner of a card to update the URI of their card.
     * If the URI was not set during mint, this function allows the
     * owner to set it without it counting towards the number of URI changes.
     *
     * Requirements:
     *
     * - `_cardID` must exist.
     * - `_uri` cannot be blank.
     * - `msg.sender` must be owner of `_cardID`
     * - `msg.sender` must be minter of `_cardID`
     * - card's `_metadataChangeCount` must be < `MAX_URI_CHANGES`
     *
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateMetadata(uint256 _cardID, string memory _uri)
        public
        virtual
    {
        require(_exists(_cardID), "PhlipCard: Card does not exist");
        require(bytes(_uri).length > 0, "PhlipCard: URI cannot be empty");
        require(msg.sender == ownerOf(_cardID), "PhlipCard: Must be owner");
        require(msg.sender == _minters[_cardID], "PhlipCard: Must be minter");
        require(
            _metadataChangeCounts[_cardID] < MAX_URI_CHANGES,
            "PhlipCard: Exceeded max URI changes"
        );

        if (bytes(_tokenURIs[_cardID]).length > 0) {
            // Card has set URI at least once, increment URI change count
            _metadataChangeCounts[_cardID] += 1;
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
        // Checks that caller holds voucher for reserved ID
        // Deletes voucher record from the registry
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

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, GuardedVestingCapsule, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

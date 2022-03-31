// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../extensions/Blacklistable.sol";
import "../extensions/Claimable.sol";
import "../extensions/UpDownVote.sol";

/**
 * @title PhlipCard
 * @author Riley Stephens
 * @dev This is the parent contract for pink and white Phlip game cards. This
 * contract is responsible for implementing the common functionality of both cards.
 *
 * ## Features ##
 *
 * Updatable Metadata - Card minters (must also be owner) are allowed to change their cards URI once
 * if their card has been downvoted too many times. Once a cards URI has been updated, the cards stats
 * should be reset to reflect that the card is basically new.
 *
 * Automated Ballots - Addresses that hold a predetermined number of PhlipDAO tokens can cast up or down votes
 * on cards. If a card has received the maximum number of downvotes allowed, the card is marked unplayable
 * and as a result no longer accumulating winnings.Address can only cast one vote per card and card owners
 * cannot vote on their own card.
 *
 * Redeemable Vouchers - Grants addresses the ability to mint a specified number of cards directly from the contract
 * rather than requiring a MINTER to do it for them. Vouchers can be granted to certain addresses (SOTM owners)
 * or sold to addresses by MINTER contracts (presale).
 *
 * Vesting Capsule - The Card owner will also be registered as a beneficiary and receive PhlipDAO and PhlipP2E
 * tokens on a vesting schedule. When a Card is transferred to another address, the new owner becomes the recipient
 * of the vesting tokens. Once the tokens in a vesting capsule for a Card have run out, all future owners of that
 * Card will stop receiving vested payouts.
 *
 */
contract PhlipCard is
    ERC721,
    Pausable,
    AccessControl,
    Blacklistable,
    Claimable,
    UpDownVote
{
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLOCKER_ROLE = keccak256("BLOCKER_ROLE");

    string public BASE_URI;
    uint256 public MAX_DOWNVOTES;
    uint256 public MAX_URI_CHANGES;
    uint256 public MIN_DAO_TOKENS_REQUIRED;

    IERC20 public DAO_TOKEN;

    struct Card {
        string uri;
        address minter;
        uint256 uriChangeCount;
        bool playable;
    }

    Counters.Counter private _tokenIdCounter;
    mapping(uint256 => Card) private _cards;

    /**
     * @dev Requires that token has been minted and reverts if not
     * @param _tokenID The ID of the token to check
     */
    modifier tokenExists(uint256 _tokenID) {
        require(_exists(_tokenID), "PhlipCard: Token does not exist.");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress
    ) ERC721(_name, _symbol) {
        // Grant roles to contract creator
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BLOCKER_ROLE, msg.sender);

        // Set constants
        setBaseURI(_baseUri);
        setMaxDownvotes(_maxDownvotes);
        setMaxUriChanges(_maxUriChanges);
        setMinDaoTokensRequired(_minDaoTokensRequired);
        setDaoTokenAddress(_daoTokenAddress);
    }

    /**
     * @dev Allow address with PAUSER role to pause token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Allow address with PAUSER role to unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Allow address with BLOCKER role to add an address to the blacklist
     * @param _address The address to add to the blacklist
     */
    function blacklistAddress(address _address)
        external
        onlyRole(BLOCKER_ROLE)
    {
        _addToBlacklist(_address);
    }

    /**
     * @dev Allow address with BLOCKER role to remove an address from the blacklist
     * @param _address The address to remove from the blacklist
     */
    function unblacklistAddress(address _address)
        external
        onlyRole(BLOCKER_ROLE)
    {
        _removeFromBlacklist(_address);
    }

    /**
     * @dev Create a claim for >=1 card(s) for given address.
     * @param _address The beneficiary of the claim.
     * @param _amount The number of cards that can be claimed.
     */
    function createClaim(address _address, uint256 _amount)
        external
        onlyRole(MINTER_ROLE)
    {
        uint256[] memory claimableTokenIds = new uint256[](_amount);
        for (uint256 i = 0; i < _amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            claimableTokenIds[i] = tokenId;
        }
        _createClaim(_address, claimableTokenIds);
    }

    /**
     * @dev Increase the number of claimable cards for an existing claim.
     * @param _address The beneficiary of the existing claim.
     * @param _amount The number of claimable tokens to add to the claim.
     */
    function increaseClaim(address _address, uint256 _amount)
        external
        onlyRole(MINTER_ROLE)
    {
        for (uint256 i = 0; i < _amount; i++) {
            uint256 tokenId = _tokenIdCounter.current();
            _tokenIdCounter.increment();
            _addToClaim(_address, tokenId);
        }
    }

    /**
     * @dev Allow address with MINTER role to mint tokens to a given address.
     * @param _to The address to mint tokens to.
     * @param _uri The IPFS CID referencing the new tokens metadata.
     */
    function mintCard(address _to, string memory _uri)
        external
        onlyRole(MINTER_ROLE)
    {
        // Get the next token ID then increment the counter
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _mintCard(tokenId, _to, _uri);
    }

    /**
     * @dev Mint card to msg.sender and reduce claimable cards by 1.
     * Requires that msg.sender has a claim for >=1 card(s).
     * @param _uri The IPFS CID referencing the new tokens metadata
     */
    function redeemCard(string memory _uri)
        external
        whenNotPaused
        onlyBeneficiary
    {
        // Get the first claimable token ID, then remove
        // it from the claimable tokens to prevent reentrance
        uint256 claimableTokenId = nextClaimableID(msg.sender);
        _removeFromClaim(msg.sender, 0);
        _mintCard(claimableTokenId, msg.sender, _uri);
    }

    /**
     * @dev Allows owner of a card to update the URI of their card. Requires
     * that the owner is also the minter of the card and has not already updated
     * the card's metadata before.
     * @param _tokenID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateCardURI(uint256 _tokenID, string memory _uri) external {
        require(
            ownerOf(_tokenID) == msg.sender,
            "PhlipCard: Address does not own this token."
        );
        Card storage card = _cards[_tokenID];
        require(
            card.minter == msg.sender,
            "PhlipCard: Only the minter can update the URI."
        );
        require(
            card.uriChangeCount < MAX_URI_CHANGES,
            "PhlipCard: Maximum number of URI changes reached."
        );
        card.uri = _uri;
        card.uriChangeCount += 1;
    }

    /**
     * @dev Records upvote for a card. Requires that the voter
     * is not the owner and has not voted on the card already
     * @param _tokenID The ID of the token upvoted
     */
    function upVote(uint256 _tokenID)
        external
        noBlacklisters
        tokenExists(_tokenID)
    {
        require(
            isDaoTokenHolder(msg.sender),
            "PhlipCard: Must own PhlipDAO tokens to vote."
        );
        // NOTE - Should we allow upvotes on unplayable cards?
        _castUpVote(_tokenID);
    }

    /**
     * @dev Records down vote for a card. Requires that the voter
     * is not the owner and has not voted on the card already. If the
     * card has been downvoted more than the allowed number of times,
     * it should be marked unplayable.
     * @param _tokenID The ID of the token upvoted
     */
    function downVote(uint256 _tokenID)
        external
        noBlacklisters
        tokenExists(_tokenID)
    {
        require(
            isDaoTokenHolder(msg.sender),
            "PhlipCard: Must own PhlipDAO tokens to vote."
        );
        // NOTE - Should we allow downvotes on unplayable cards?
        _castDownVote(_tokenID);

        // NOTE - Need to take into account the number of upvotes
        if (downVotesFor(_tokenID) >= MAX_DOWNVOTES) {
            Card storage card = _cards[_tokenID];
            card.playable = false;
        }
    }

    /**
     * @dev Checks if the given address has PhlipDAO token balance > 0
     * @param _account Address to check.
     * @return Wether the address has any PhlipDAO tokens.
     */
    function isDaoTokenHolder(address _account) public view returns (bool) {
        return DAO_TOKEN.balanceOf(_account) > 0;
    }

    /**
     * @dev Allows MINTER to set the base URI for all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI) public onlyRole(MINTER_ROLE) {
        BASE_URI = _newURI;
    }

    /**
     * @dev Allows MINTER to set the max number of downvotes a card can have
     * before it is marked unplayable.
     * @param _newMax The new max number of downvotes allowed
     */
    function setMaxDownvotes(uint256 _newMax) public onlyRole(MINTER_ROLE) {
        MAX_DOWNVOTES = _newMax;
    }

    /**
     * @dev Allows MINTER to set max number of times minter can change the URI of a card.
     * @param _newMax New max changes allowed
     */
    function setMaxUriChanges(uint256 _newMax) public onlyRole(MINTER_ROLE) {
        MAX_URI_CHANGES = _newMax;
    }

    /**
     * @dev Allows MINTER to set minimum number of PhlipDAO tokens required to vote and mint.
     * @param _newMin New min DAO tokens required
     */
    function setMinDaoTokensRequired(uint256 _newMin)
        public
        onlyRole(MINTER_ROLE)
    {
        MIN_DAO_TOKENS_REQUIRED = _newMin;
    }

    /**
     * @dev Allows MINTER to set the address of the PhlipDAO token contract
     * @param _daoTokenAddress New contract address
     */
    function setDaoTokenAddress(address _daoTokenAddress)
        public
        onlyRole(MINTER_ROLE)
    {
        DAO_TOKEN = IERC20(_daoTokenAddress);
    }

    /**
     * @dev Accessor function for getting card's URI from ID
     * Modified implementation of ERC721URIStorage.tokenURI
     * @param _tokenId ID of the card to get URI of
     * @return URI of the card
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(_tokenId),
            "PhlipCard.tokenURI: URI query for nonexistent token"
        );

        string memory _tokenURI = _cards[_tokenId].uri;
        string memory base = _baseURI();

        // If there is no base URI, return the token URI.
        if (bytes(base).length == 0) {
            return _tokenURI;
        }
        // If both are set, concatenate the baseURI and tokenURI (via abi.encodePacked).
        if (bytes(_tokenURI).length > 0) {
            return string(abi.encodePacked(base, _tokenURI));
        }

        return super.tokenURI(_tokenId);
    }

    /**
     * @dev Mints card to the given address and initilizes a ballot for it.
     * @param _tokenID The ID of card being minted
     * @param _to The address to mint card to
     * @param _uri The IPFS CID referencing the new card's metadata
     */
    function _mintCard(
        uint256 _tokenID,
        address _to,
        string memory _uri
    ) internal {
        // Store the new card data then mint the token
        _cards[_tokenID] = Card(_uri, _to, 0, true);
        _safeMint(_to, _tokenID);

        // Create a ballot for the new card
        _createBallot(_tokenID);
    }

    /**
     * @dev Override of ERC721._baseURI
     */
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
    }

    /**
     * @dev Function called before tokens are transferred. Override to
     * make sure that token tranfers have not been paused.
     * @param _from The address tokens will be transferred from
     * @param _to The address tokens will be transferred  to
     * @param _tokenId The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }

    /**
     * @dev Override of ERC721._baseURI
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return BASE_URI;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

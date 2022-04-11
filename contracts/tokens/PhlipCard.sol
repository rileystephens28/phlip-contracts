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
import "./VestingCapsule.sol";

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
    VestingCapsule,
    Pausable,
    AccessControl,
    Blacklistable,
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

    IERC20 public daoToken;

    struct Card {
        string uri;
        uint256 uriChangeCount;
        bool blank;
        bool playable;
    }

    Counters.Counter private _cardIdCounter;
    Counters.Counter private _totalInCirculation;
    Counters.Counter private _playableInCirculation;
    mapping(uint256 => Card) private _cards;
    mapping(uint256 => address) private _minters;

    /**
     * @dev Requires that token has been minted and reverts if not
     * @param _cardID The ID of the token to check
     */
    modifier tokenExists(uint256 _cardID) {
        require(_exists(_cardID), "PhlipCard: Token does not exist.");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        uint256 _maxDownvotes,
        uint256 _maxUriChanges,
        uint256 _minDaoTokensRequired,
        address _daoTokenAddress,
        address _vestingCapsuleAddress
    ) VestingCapsule(_name, _symbol, _vestingCapsuleAddress) {
        // Grant roles to contract creator
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(BLOCKER_ROLE, msg.sender);

        // Set constants
        BASE_URI = _baseUri;
        MAX_DOWNVOTES = _maxDownvotes;
        MAX_URI_CHANGES = _maxUriChanges;
        MIN_DAO_TOKENS_REQUIRED = _minDaoTokensRequired;
        daoToken = IERC20(_daoTokenAddress);
    }

    /**
     * @dev Accessor function to get address of card minter
     * @param _cardID The ID of the card to check
     * @return Address that minted the card
     */
    function minterOf(uint256 _cardID) public view returns (address) {
        return _minters[_cardID];
    }

    /**
     * @dev View function to see if card is playable
     * @param _cardID The ID of the card to check
     * @return True if card is playable, false otherwise
     */
    function isPlayable(uint256 _cardID) public view returns (bool) {
        return _cards[_cardID].playable;
    }

    /**
     * @dev View function to see if card is blank (no URI)
     * @param _cardID The ID of the card to check
     * @return True if card is blank, false otherwise
     */
    function isBlank(uint256 _cardID) public view returns (bool) {
        return _cards[_cardID].blank;
    }

    /**
     * @dev View function to see number of cards in circulation
     * @return Number of cards minted - number of cards burned
     */
    function getCirculatingCardCount() public view returns (uint256) {
        return _totalInCirculation.current();
    }

    /**
     * @dev View function to see number of cards in that are playable
     * @return Number of cards in circulation that are not blank and have been voted out
     */
    function getPlayableCardCount() public view returns (uint256) {
        return _playableInCirculation.current();
    }

    /**
     * @dev Allow address with PAUSER role to pause card transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Allow address with PAUSER role to unpause card transfers
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
     * @dev Allow address with MINTER role to mint tokens to a given address.
     * @param _to The address to mint tokens to.
     * @param _uri The IPFS CID referencing the new tokens metadata.
     */
    function mintCard(
        address _to,
        uint256 _scheduleId,
        string memory _uri
    ) external onlyRole(MINTER_ROLE) {
        // Get the next token ID then increment the counter
        uint256 tokenId = _cardIdCounter.current();
        _cardIdCounter.increment();
        _mintCard(tokenId, _to, _scheduleId, _uri);
    }

    /**
     * @dev Allows owner of a card to update the URI of their card. Requires
     * that the owner is also the minter of the card and has not already updated
     * the card's metadata before. If the URI was not set during mint, this function
     * allows the owner to set it without it counting towards the number of URI changes.
     * @param _cardID The ID of the card to update
     * @param _uri The IPFS CID referencing the updated metadata
     */
    function updateCardURI(uint256 _cardID, string memory _uri)
        external
        tokenExists(_cardID)
    {
        require(
            msg.sender == ownerOf(_cardID),
            "PhlipCard: Address does not own this card."
        );
        require(
            msg.sender == minterOf(_cardID),
            "PhlipCard: Only the minter can update the URI."
        );
        Card storage card = _cards[_cardID];
        require(
            card.uriChangeCount < MAX_URI_CHANGES,
            "PhlipCard: Maximum number of URI changes reached."
        );
        card.uri = _uri;

        if (card.blank) {
            // If card is blank, mark as playable and not blank
            card.blank = false;
            _playableInCirculation.increment();
        } else {
            // If card is not blank, increment URI change count
            card.uriChangeCount += 1;
        }
    }

    /**
     * @dev Records upvote for a card. Requires that the voter
     * is not the owner and has not voted on the card already
     * @param _cardID The ID of the token upvoted
     */
    function upVote(uint256 _cardID)
        external
        noBlacklisters
        tokenExists(_cardID)
    {
        require(
            ownerOf(_cardID) != msg.sender,
            "PhlipCard: Cannot vote on your own card."
        );
        require(
            holdsMinDaoTokens(msg.sender),
            "PhlipCard: Must own PhlipDAO tokens to vote."
        );
        // NOTE - Should we allow upvotes on unplayable cards?
        _castUpVote(_cardID);
    }

    /**
     * @dev Records down vote for a card. Requires that the voter
     * is not the owner and has not voted on the card already. If the
     * card has been downvoted more than the allowed number of times,
     * it should be marked unplayable.
     * @param _cardID The ID of the token upvoted
     */
    function downVote(uint256 _cardID)
        external
        noBlacklisters
        tokenExists(_cardID)
    {
        require(
            ownerOf(_cardID) != msg.sender,
            "PhlipCard: Cannot vote on your own card."
        );
        require(
            holdsMinDaoTokens(msg.sender),
            "PhlipCard: Must own PhlipDAO tokens to vote."
        );
        // NOTE - Should we allow downvotes on unplayable cards?
        _castDownVote(_cardID);

        // NOTE - Need to take into account the number of upvotes
        if (downVotesFor(_cardID) >= MAX_DOWNVOTES) {
            _cards[_cardID].playable = false;
            _playableInCirculation.decrement();
        }
    }

    /**
     * @dev Checks if the given address has PhlipDAO token balance > 0
     * @param _account Address to check.
     * @return Wether the address has any PhlipDAO tokens.
     */
    function holdsMinDaoTokens(address _account) public view returns (bool) {
        return daoToken.balanceOf(_account) > MIN_DAO_TOKENS_REQUIRED;
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
        daoToken = IERC20(_daoTokenAddress);
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
     * @param _cardID The ID of card being minted
     * @param _to The address to mint card to
     * @param _uri The IPFS CID referencing the new card's metadata
     */
    function _mintCard(
        uint256 _cardID,
        address _to,
        uint256 _scheduleID,
        string memory _uri
    ) internal virtual {
        _safeMint(_to, _cardID, _scheduleID, "");

        // Check if card is minted blank
        bool blank = bytes(_uri).length == 0;

        // Store the new card data then mint the token
        _cards[_cardID] = Card(_uri, 0, blank, !blank);
        _minters[_cardID] = _to;

        // Create a ballot for the new card
        _createBallot(_cardID);

        // Update card counters
        _totalInCirculation.increment();
        if (!blank) {
            _playableInCirculation.increment();
        }
    }

    /**
     * @dev Override of ERC721._baseURI
     */
    function _burn(uint256 tokenId) internal override {
        // Update card counters
        _totalInCirculation.decrement();

        // If card is  playable, decrement the playable count
        if (_cards[tokenId].playable) {
            _playableInCirculation.decrement();
        }

        super._burn(tokenId);
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
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

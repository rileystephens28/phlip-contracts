// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./utils/Blacklistable.sol";
import "./utils/Claimable.sol";
import "./utils/UpDownVote.sol";
import "./IPhlipCard.sol";

/**
 * @title An ERC721 contract for a base Phlip game card.
 * @author Riley Stephens
 * @notice This contract is intended to reference it's metadata on IPFS.
 */
abstract contract PhlipCard is
    ERC721,
    Pausable,
    AccessControl,
    Blacklistable,
    Claimable,
    UpDownVote,
    IPhlipCard
{
    using Counters for Counters.Counter;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLOCKER_ROLE = keccak256("BLOCKER_ROLE");

    string public BASE_URI;
    uint256 public MAX_DOWNVOTES;
    uint256 public MAX_URI_CHANGES;
    uint256 public MIN_DAO_TOKENS_TO_VOTE;

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
     * @notice Ensure token has been minted by contract
     * @dev Reverts if token does not exist
     */
    modifier tokenExists(uint256 _tokenID) {
        require(_exists(_tokenID), "PhlipCard: Token does not exist.");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri,
        address _daoTokenAddress
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        setBaseURI(_baseUri);
        DAO_TOKEN = IERC20(_daoTokenAddress);
    }

    /**
     * @notice Allow address with PAUSER role to pause token transfers
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Allow address with PAUSER role to unpause token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Allow address with BLOCKER role to add an address to the blacklist
     * @param _address The address to add to the blacklist
     */
    function blacklistAddress(address _address)
        external
        onlyRole(BLOCKER_ROLE)
    {
        _addToBlacklist(_address);
    }

    /**
     * @notice Allow address with BLOCKER role to remove an address from the blacklist
     * @param _address The address to remove from the blacklist
     */
    function unblacklistAddress(address _address)
        external
        onlyRole(BLOCKER_ROLE)
    {
        _removeFromBlacklist(_address);
    }

    /**
     * @notice Set the max number of downvotes a card can have before it is marked unplayable.
     * @param _newMax The new max number of downvotes allowed
     */
    function setDownVoteMax(uint256 _newMax) external onlyRole(MINTER_ROLE) {
        MAX_DOWNVOTES = _newMax;
    }

    /**
     * @notice Create new claim of card(s) for given address.
     * @param _address The beneficiary of the claim
     * @param _amount The number of tokens that can be claimed
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
     * @notice Increase the number of claimable cards for an existing claim.
     * @param _address The beneficiary of the existing claim
     * @param _amount The number of claimable tokens to add to the claim
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
     * @notice Allow address with MINTER role to mint tokens to a given address
     * @param _to The address to mint tokens to
     * @param _uri The IPFS CID referencing the new tokens metadata
     */
    function mintCard(address _to, string memory _uri)
        external
        onlyRole(MINTER_ROLE)
    {
        // Get the next token ID then increment the counter
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        // Store the new card data then mint the token
        _cards[tokenId] = Card(_uri, _to, 0, true);
        _safeMint(_to, tokenId);

        // Create a ballot for the new card
        _createBallot(tokenId);
    }

    /**
     * @notice Mint card to beneficiary and remove from claimable cards.
     * @param _uri The IPFS CID referencing the new tokens metadata
     */
    function redeemCard(string memory _uri)
        external
        whenNotPaused
        noBlacklisters
        onlyBeneficiary
    {
        // Get the first claimable token ID, then remove
        // it from the claimable tokens to prevent reentrance
        uint256 claimableTokenId = nextClaimableID(msg.sender);
        _removeFromClaim(msg.sender, 0);

        // Store the newly claimed card data then mint the token
        _cards[claimableTokenId] = Card(_uri, msg.sender, 0, true);
        _safeMint(msg.sender, claimableTokenId);

        // Create a ballot for the newly claimed card
        _createBallot(claimableTokenId);
    }

    /**
     * @notice Updates the URI of an existing token.
     * @param _tokenID The ID of the token to update
     * @param _uri The new URI
     */
    function updateCardURI(uint256 _tokenID, string memory _uri)
        external
        noBlacklisters
    {
        require(
            ownerOf(_tokenID) == msg.sender,
            "PhlipCard: Address does not own this token."
        );
        Card storage card = _cards[_tokenID];
        require(
            card.uriChangeCount < MAX_URI_CHANGES,
            "PhlipCard: Maximum number of URI changes reached."
        );
        require(
            card.minter == msg.sender,
            "PhlipCard: Only the minter can update the URI."
        );
        card.uri = _uri;
        card.uriChangeCount += 1;
    }

    /**
     * @notice Record token upvote.
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
     * @notice Record token downvote. If the token has been downvoted more than
     * the allowed number of times, it should be marked unplayable.
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
     * @notice Set the base URI of all tokens created by this contract
     * @param _newURI New base URI
     */
    function setBaseURI(string memory _newURI) public onlyRole(MINTER_ROLE) {
        BASE_URI = _newURI;
    }

    /**
     * @notice Getter method for getting token's URI from ID
     * @dev Modified implementation of ERC721URIStorage.tokenURI
     * @param _tokenId ID of token
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
     * @notice Set the address of the PhlipDAO contract
     * @param _daoTokenAddress New contract address
     */
    function setDaoTokenAddress(address _daoTokenAddress)
        public
        onlyRole(MINTER_ROLE)
    {
        DAO_TOKEN = IERC20(_daoTokenAddress);
    }

    /**
     * @notice Check if the given address is a PhlipDAO token holder
     * @param _account Address to check.
     */
    function isDaoTokenHolder(address _account) public view returns (bool) {
        return DAO_TOKEN.balanceOf(_account) > 0;
    }

    /**
     * @notice Function called before tokens are transferred
     * @dev Override to make sure that token tranfers have not been paused
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

    /**
     * @dev Override of ERC721._baseURI
     */
    function _burn(uint256 tokenId) internal override {
        super._burn(tokenId);
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

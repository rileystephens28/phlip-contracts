// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
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
contract PhlipCard is
    ERC721,
    ERC721URIStorage,
    Pausable,
    AccessControl,
    IPhlipCard,
    Blacklistable,
    Claimable,
    UpDownVote
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLOCKER_ROLE = keccak256("BLOCKER_ROLE");

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    string public BASE_URI;
    uint256 public MAX_ALLOWED_DOWNVOTES;

    /**
     * @notice Ensure token has been minted by contract
     * @dev Reverts if token does not exist
     */
    modifier tokenExists(uint256 _tokenID) {
        require(_tokenID > 0, "PhlipCard: Token ID is not valid.");
        require(
            _tokenID <= _tokenIdCounter.current(),
            "PhlipCard: Token ID does not exist."
        );
        _;
    }

    /**
     * @notice Ensure msg.sender holds PhlipDAO tokens
     * @dev Reverts if sender does not
     */
    modifier onlyDaoHolders() {
        // require(
        //     ownerOf(_tokenID) == msg.sender,
        //     "PhlipCard: Address does not own this token."
        // );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _baseUri
    ) ERC721(_name, _symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        setBaseURI(_baseUri);
    }

    /**
     * @notice Allow address with PAUSER role to pause token transfers
     */
    function pause() public onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @notice Allow address with PAUSER role to unpause token transfers
     */
    function unpause() public onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @notice Allow address with BLOCKER role to add an address to the blacklist
     * @param _address The address to add to the blacklist
     */
    function blacklistAddress(address _address) public onlyRole(BLOCKER_ROLE) {
        _addToBlacklist(_address);
    }

    /**
     * @notice Allow address with BLOCKER role to remove an address from the blacklist
     * @param _address The address to remove from the blacklist
     */
    function unblacklistAddress(address _address)
        public
        onlyRole(BLOCKER_ROLE)
    {
        _removeFromBlacklist(_address);
    }

    /**
     * @notice Create new claim of card(s) for given address.
     * @param _address The beneficiary of the claim
     * @param _amount The number of tokens that can be claimed
     */
    function createClaim(address _address, uint256 _amount)
        public
        onlyRole(MINTER_ROLE)
    {}

    /**
     * @notice Increase the number of claimable cards for an existing claim.
     * @param _address The beneficiary of the existing claim
     * @param _amount The number of claimable tokens to add to the claim
     */
    function increaseClaim(address _address, uint256 _amount)
        public
        onlyRole(MINTER_ROLE)
    {}

    /**
     * @notice Allow address with MINTER role to mint tokens to a given address
     * @param _to The address to mint tokens to
     * @param _uri The IPFS CID referencing the new tokens metadata
     */
    function mintcard(address _to, string memory _uri)
        public
        onlyRole(MINTER_ROLE)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(_to, tokenId);
        _setTokenURI(tokenId, _uri);
    }

    /**
     * @notice Mint card to beneficiary and decrease the number of claimable cards by 1.
     * @param _address The beneficiary redeeming the card
     */
    function redeemCard(address _address)
        public
        whenNotPaused
        noBlacklisters
        onlyBeneficiary
    {}

    /**
     * @notice Updates the URI of an existing token. If the current owner of the token is
     * not the minter, this function should revert.
     * @param _tokenID The ID of the token to update
     * @param _uri The new URI
     */
    function updateCardURI(uint256 _tokenID, string memory _uri)
        public
        noBlacklisters
    {
        require(
            ownerOf(_tokenID) == msg.sender,
            "PhlipCard: Address does not own this token."
        );
        _setTokenURI(_tokenID, _uri);
    }

    /**
     * @notice Set the base URI of all tokens created by this contract
     * @param _newBaseURI New base URI
     */
    function setBaseURI(string memory _newBaseURI)
        public
        onlyRole(MINTER_ROLE)
    {
        BASE_URI = _newBaseURI;
    }

    /**
     * @notice Record token upvote.
     * @param _tokenID The ID of the token upvoted
     */
    function upVote(uint256 _tokenID) public noBlacklisters onlyDaoHolders {}

    /**
     * @notice Record token downvote. If the token has been downvoted more than
     * the allowed number of times, it should be marked unplayable.
     * @param _tokenID The ID of the token upvoted
     */
    function downVote(uint256 _tokenID) public noBlacklisters onlyDaoHolders {}

    /**
     * @notice Set the max number of downvotes a card can have before it is marked unplayable.
     * @param _newMax The new max number of downvotes allowed
     */
    function setDownVoteMax(uint256 _newMax) public onlyRole(MINTER_ROLE) {
        MAX_ALLOWED_DOWNVOTES = _newMax;
    }

    /**
     * @notice Indicate card has been downvoted beyond the allowed number of time. The
     * token will NOT be burned and the mintable supply increases by 1.
     */
    function markCardUnplayable(uint256 _tokenID)
        public
        onlyRole(MINTER_ROLE)
    {}

    /**
     * @notice Getter method for getting token's URI from ID
     * @dev Calls ERC721URIStorage.tokenURI function
     * @param tokenId ID of token
     */
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /**
     * @notice Function called before tokens are transferred
     * @dev Override to make sure that token tranfers have not been paused
     * @param from The address tokens will be transferred from
     * @param to The address tokens will be transferred  to
     * @param tokenId The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    // The following functions are overrides required by Solidity.

    function _burn(uint256 tokenId)
        internal
        override(ERC721, ERC721URIStorage)
    {
        super._burn(tokenId);
    }

    /**
     * @dev Override of ERC721._baseURI to use ipfs base url
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

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./utils/Blacklistable.sol";
import "./utils/Whitelistable.sol";
import "./utils/UpDownVote.sol";

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
    Blacklistable,
    Whitelistable,
    UpDownVote
{
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BLOCKER_ROLE = keccak256("BLOCKER_ROLE");

    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    string public baseURI;
    // cost of minting a token
    uint256 public mintingFee = .001 ether;

    /**
     * @notice Ensure token has been minted by contract
     * @dev Reverts if token does not exist
     */
    modifier tokenExists(uint256 tokenID) {
        require(tokenID > 0, "PhlipCard: INVALID_TOKEN_ID");
        require(
            tokenID <= _tokenIdCounter.current(),
            "PhlipCard: TOKEN_ID_DOES_NOT_EXIST"
        );
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
    function addToBlacklist(address _address) public onlyRole(BLOCKER_ROLE) {
        _addToBlacklist(_address);
    }

    /**
     * @notice Allow address with BLOCKER role to remove an address from the blacklist
     * @param _address The address to remove from the blacklist
     */
    function removeFromBlacklist(address _address)
        public
        onlyRole(BLOCKER_ROLE)
    {
        _removeFromBlacklist(_address);
    }

    /**
     * @notice Allow address with MINTER role to mint tokens to a given address
     * @param to The address to mint tokens to
     * @param uri The IPFS CID referencing the new tokens metadata
     */
    function safeMint(address to, string memory uri)
        public
        onlyRole(MINTER_ROLE)
    {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

    /**
     * @notice Set the base URI of all tokens created by this contract
     * @param _newBaseURI New base URI
     */
    function setBaseURI(string memory _newBaseURI)
        public
        onlyRole(MINTER_ROLE)
    {
        baseURI = _newBaseURI;
    }

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
        return baseURI;
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

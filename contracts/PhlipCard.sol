// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
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
    Ownable,
    Blacklistable,
    Whitelistable,
    UpDownVote
{
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
        setBaseURI(_baseUri);
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function safeMint(address to, string memory uri) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
    }

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

    function setBaseURI(string memory _newBaseURI) public onlyOwner {
        baseURI = _newBaseURI;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    //only owner
    function setCost(uint256 _newMintingFee) public onlyOwner {
        mintingFee = _newMintingFee;
    }
}

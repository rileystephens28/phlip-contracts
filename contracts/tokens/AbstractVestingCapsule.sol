// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../CapsuleManager.sol";

/**
 * @title AbstractVestingCapsule
 * @author Riley Stephens
 * @dev The AbstractVestingCapsule is an implementation of an ERC721 token that supports
 * an abstract vesting scheme.
 */
abstract contract AbstractVestingCapsule is ERC721 {
    CapsuleManager internal _capsuleManager;
    bool internal _scheduleIsSet;

    /***********************************|
    |          Initialization           |
    |__________________________________*/

    constructor(
        string memory _name,
        string memory _symbol,
        address _capsuleManagerAddress
    ) ERC721(_name, _symbol) {
        _setCapsuleManager(_capsuleManagerAddress);
        _scheduleIsSet = false;
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor for the CapsuleManager contract address
     */
    function getCapsuleManager() public view returns (address) {
        return address(_capsuleManager);
    }

    /**
     * @dev Accessor to get the vested balance for a specified token.
     * Must be implemented by child contract.
     */
    function vestedBalanceOf(uint256 _capsuleID)
        public
        virtual
        returns (uint256)
    {}

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Setter for the address of the CapsuleManager contract.
     * @param _address Address of the CapsuleManager contract
     */
    function _setCapsuleManager(address _address) internal virtual {
        _capsuleManager = CapsuleManager(_address);
    }

    /**
     * @dev Hook that is called before tokens are transferred. This function
     * ensures that a vesting schedule has been set before executing transfers.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     *   transferred to `to`.
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
    ) internal override {
        require(
            _scheduleIsSet,
            "AbstractVestingCapsule: Vesting schedule not set"
        );
        super._beforeTokenTransfer(_from, _to, _tokenId);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./VestingVault.sol";

/**
 * @title VestingCapsule
 * @author Riley Stephens
 * @dev The VestingCapsule is an implementation of a VestingVault that supports
 * 2 vesting schemes per token. The vesting scheme group can be updated but each token only supports
 * the vesting scheme that was set when the token was minted.
 *
 * NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.
 */
abstract contract VestingCapsule is ERC721, VestingVault {
    struct CapsulePackage {
        uint256[] schedules;
        uint256[] capsules;
    }
    // Mapping from token IDs to boxes containing capsule IDs
    mapping(uint256 => CapsulePackage) private _capsulePackagees;

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor to get the vested balance for a specified token.
     * Must be implemented by child contract.
     */
    function totalVestedBalanceOf(uint256 _tokenID)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        CapsulePackage storage capsulePackage = _capsulePackagees[_tokenID];

        // Initialize fixed length arrays for token addresses and balances
        address[] memory t = new address[](capsulePackage.capsules.length);
        uint256[] memory b = new uint256[](capsulePackage.capsules.length);

        // Populate arrays with token addresses and balances
        for (uint256 i = 0; i < capsulePackage.schedules.length; i++) {
            t[i] = _vestingSchedules[capsulePackage.schedules[i]].token;
            b[i] = _getVestedBalance(capsulePackage.capsules[i]);
        }
        return (t, b);
    }

    /**
     * @dev Accessor function for specified CapsulePackage details.
     * @param _boxID The ID of the CapsulePackage to be queried.
     * @return The struct values of the capsule box
     */
    function getCapsulePackage(uint256 _boxID)
        public
        view
        returns (CapsulePackage memory)
    {
        return _capsulePackagees[_boxID];
    }

    /***********************************|
    |        External Functions         |
    |__________________________________*/

    /**
     * @dev Transfers vested ERC20 tokens from specified tokens
     * capsule box. If capsules are no longer active, this function
     * will complete without reversion.
     * @param _tokenID The ID of the token whose capsules will be withdrawn
     */
    function withdrawFromCapsules(uint256 _tokenID) external {
        require(_exists(_tokenID), "VestingCapsule: Token does not exist");
        require(
            ownerOf(_tokenID) == msg.sender,
            "VestingCapsule: Must be owner"
        );
        CapsulePackage storage capsulePackage = _capsulePackagees[_tokenID];
        for (uint256 i = 0; i < capsulePackage.capsules.length; i++) {
            if (_activeCapsules[capsulePackage.capsules[i]]) {
                _withdrawCapsuleBalance(capsulePackage.capsules[i], msg.sender);
            }
        }
    }

    /**
     * @dev Transfers ERC20 tokens leftover after vesting capsule transfer to previous owner
     * @param _tokenAddress The ID of the token whose capsules will be withdrawn
     */
    function withdrawTokenLeftovers(address _tokenAddress) external {
        _withdrawTokenLeftovers(_tokenAddress, msg.sender);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Creates multiple new Capsules, all with same owner and start time.
     * @param _owner Single beneficiary of new vesting capsules.
     * @param _startTime Time at which cliff periods begin.
     */
    function _createTokenCapsules(
        uint256 _tokenID,
        address _owner,
        uint256 _startTime,
        uint256[] memory _schedules
    ) internal virtual {
        require(
            _startTime > block.timestamp - 1,
            "VestingCapsule: Start time in the past"
        );
        // Create capsule box and assign schedules
        CapsulePackage storage newCapsulePackage = _capsulePackagees[_tokenID];
        newCapsulePackage.schedules = _schedules;

        // Create capsule for each schedule
        for (uint256 i = 0; i < _schedules.length; i++) {
            newCapsulePackage.capsules.push(
                _createCapsule(_owner, _schedules[i], _startTime)
            );
        }
    }

    /**
     * @dev Transfers a batch of Capsules owned by the caller to a single address.
     * Capsules must be marked as active and cannot have expired.
     * @param _from Address sending all capsules.
     * @param _to Address to receive all capsules.
     * @param _tokenID ID of token to transfer.
     */
    function _transferTokenCapsules(
        address _from,
        address _to,
        uint256 _tokenID
    ) internal virtual {
        CapsulePackage storage capsulePackage = _capsulePackagees[_tokenID];

        // Check that all capsules are active and not expired before transfer
        // If capsule is unactive or expired, skip transfer but do not revert
        for (uint256 i = 0; i < capsulePackage.capsules.length; i++) {
            if (
                _activeCapsules[capsulePackage.capsules[i]] &&
                !_expired(capsulePackage.capsules[i])
            ) {
                _transferCapsule(_from, _to, capsulePackage.capsules[i]);
            }
        }
    }

    /**
     * @dev Destroys capsules in capsule box that are still active.
     * @param _tokenID ID of token to destroy.
     */
    function _destroyTokenCapsules(uint256 _tokenID, address _owner)
        internal
        virtual
    {
        CapsulePackage storage capsulePackage = _capsulePackagees[_tokenID];

        // Check that all capsules are active before destroying
        // If capsule is unactive, skip destroying but do not revert
        for (uint256 i = 0; i < capsulePackage.capsules.length; i++) {
            if (_activeCapsules[capsulePackage.capsules[i]]) {
                _destroyCapsule(capsulePackage.capsules[i], _owner);
            }
        }

        // Once all active capsule have been destroyed, delete capsule box
        delete _capsulePackagees[_tokenID];
    }

    /**
     * @dev This function handles capsule box are transferring and
     * burning. Inheriting contracts must handle capsule creation
     * when tokens are minted. This allows for dynamic capsule box creation
     * while providing standardizes capsule box transfers and destruction.
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
     * @param _tokenID The ID of the token to transfer
     */
    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenID
    ) internal virtual override {
        super._afterTokenTransfer(_from, _to, _tokenID);
        if (_to == address(0)) {
            // BURN - Batch destroy capsule and delete reference
            _destroyTokenCapsules(_tokenID, _from);
        } else if (_from != _to) {
            // TRANSFER - Batch transfer capsules
            _transferTokenCapsules(_from, _to, _tokenID);
        }
    }
}

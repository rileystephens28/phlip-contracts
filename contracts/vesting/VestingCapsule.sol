// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
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
    using Counters for Counters.Counter;
    Counters.Counter internal _schemeIDCounter;
    struct VestingScheme {
        uint256 schedule1;
        uint256 schedule2;
    }
    struct CapsuleBox {
        uint256 scheme;
        uint256 capsule1;
        uint256 capsule2;
    }
    // Mapping from token IDs to boxes containing capsule IDs
    mapping(uint256 => CapsuleBox) private _capsuleBoxes;
    mapping(uint256 => VestingScheme) private _vestingSchemes;

    // Stores IDs of the schedules to be used during mint
    uint256 private _currentSchemeID;

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
        returns (address[2] memory, uint256[2] memory)
    {
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        VestingScheme storage _vestingScheme = _vestingSchemes[
            capsuleBox.scheme
        ];

        address[2] memory tokens = [
            _vestingSchedules[_vestingScheme.schedule1].token,
            _vestingSchedules[_vestingScheme.schedule2].token
        ];
        uint256[2] memory balances = [
            _getVestedBalance(capsuleBox.capsule1),
            _getVestedBalance(capsuleBox.capsule2)
        ];
        return (tokens, balances);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Create a new vesting scheme with 2 schedules.
     * @param _schedule1 ID of 1st schedule to use
     * @param _schedule2 ID of 2nd schedule to use
     */
    function _addVestingScheme(uint256 _schedule1, uint256 _schedule2)
        internal
        virtual
    {
        require(
            _scheduleExists(_schedule1) && _scheduleExists(_schedule2),
            "VestingCapsule: Invalid schedule ID"
        );

        uint256 currentSchemeID = _schemeIDCounter.current();
        _schemeIDCounter.increment();

        _vestingSchemes[currentSchemeID] = VestingScheme(
            _schedule1,
            _schedule2
        );
    }

    /**
     * @dev Setter for the ID of the scheme to be used during mint.
     * @param _schemeID ID of scheme to set
     */
    function _setVestingScheme(uint256 _schemeID) internal virtual {
        require(
            _schemeID < _schemeIDCounter.current(),
            "VestingCapsule: Invalid scheme ID"
        );
        _currentSchemeID = _schemeID;
    }

    /**
     * @dev Creates multiple new Capsules, all with same owner and start time.
     * @param _owner Single beneficiary of new vesting capsules.
     * @param _startTime Time at which cliff periods begin.
     */
    function _createTokenCapsules(
        uint256 _tokenID,
        address _owner,
        uint256 _startTime
    ) internal virtual {
        require(
            _startTime >= block.timestamp,
            "VestingVault: Start time cannot be in the past"
        );
        VestingScheme storage currentScheme = _vestingSchemes[_currentSchemeID];
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];

        // Set vesting scheme ID to the last created scheme ID
        capsuleBox.scheme = _currentSchemeID;

        // Create new capsules
        capsuleBox.capsule1 = _createCapsule(
            _owner,
            currentScheme.schedule1,
            _startTime
        );
        capsuleBox.capsule2 = _createCapsule(
            _owner,
            currentScheme.schedule2,
            _startTime
        );
    }

    /**
     * @dev Transfers a batch of Capsules owned by the caller to a single address.
     * @param _tokenID ID of token to transfer.
     * @param _to Address to receive all capsules.
     */
    function _transferTokenCapsules(uint256 _tokenID, address _to)
        internal
        virtual
    {
        require(
            _to != address(0),
            "VestingVault: Cannot transfer capsule to 0x0"
        );
        require(
            _to != msg.sender,
            "VestingVault: Cannot transfer capsule to self"
        );
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        if (!_expired(capsuleBox.capsule1)) {
            _transferCapsule(capsuleBox.capsule1, _to);
        }
        if (!_expired(capsuleBox.capsule2)) {
            _transferCapsule(capsuleBox.capsule2, _to);
        }
    }

    /**
     * @dev Destroys capsules in capsule box that are still active.
     * @param _tokenID ID of token to destroy.
     */
    function _destroyTokenCapsules(uint256 _tokenID) internal virtual {
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        if (!_activeCapsules[capsuleBox.capsule1]) {
            _destroyCapsule(capsuleBox.capsule1);
        }
        if (!_activeCapsules[capsuleBox.capsule2]) {
            _destroyCapsule(capsuleBox.capsule2);
        }
    }

    /**
     * @dev Hook that is called after tokens are transferred. This function
     * handles interaction with capsule manager.
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
        if (_from == address(0)) {
            // MINT - Batch create capsule and store reference
            _createTokenCapsules(_tokenID, _to, block.timestamp);
        } else if (_to == address(0)) {
            // BURN - Batch destroy capsule and delete reference
            _destroyTokenCapsules(_tokenID);
            delete _capsuleBoxes[_tokenID];
        } else if (_from != _to) {
            // TRANSFER - Batch transfer capsules
            _transferTokenCapsules(_tokenID, _to);
        }
    }
}

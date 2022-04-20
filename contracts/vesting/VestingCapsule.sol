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

    // Stores ID of the scheme to be used during mint
    uint256 private _currentSchemeID;

    // Determines if scheme has been set
    bool private _schemeSet;

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

    /**
     * @dev Accessor to get the ID of the current vesting scheme.
     */
    function getCurrentVestingScheme() public view returns (uint256) {
        return _currentSchemeID;
    }

    /**
     * @dev Accessor function for specified VestingScheme details.
     * @param _schemeID The ID of the VestingScheme to be queried.
     * @return The struct values of the vesting scheme
     */
    function getScheme(uint256 _schemeID)
        public
        view
        returns (VestingScheme memory)
    {
        return _vestingSchemes[_schemeID];
    }

    /**
     * @dev Accessor function for specified CapsuleBox details.
     * @param _boxID The ID of the CapsuleBox to be queried.
     * @return The struct values of the capsule box
     */
    function getCapsuleBox(uint256 _boxID)
        public
        view
        returns (CapsuleBox memory)
    {
        return _capsuleBoxes[_boxID];
    }

    /**
     * @dev Accessor function for is scheme has been set
     * @return True if a scheme has been set, false if not
     */
    function schemeIsSet() public view returns (bool) {
        return _schemeSet;
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
            "VestingCapsule: Caller not token owner"
        );
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        if (_activeCapsules[capsuleBox.capsule1]) {
            _withdrawCapsuleBalance(capsuleBox.capsule1, msg.sender);
        }
        if (_activeCapsules[capsuleBox.capsule2]) {
            _withdrawCapsuleBalance(capsuleBox.capsule2, msg.sender);
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
        _schemeSet = true;
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
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        if (
            _activeCapsules[capsuleBox.capsule1] &&
            !_expired(capsuleBox.capsule1)
        ) {
            _transferCapsule(_from, _to, capsuleBox.capsule1);
        }
        if (
            _activeCapsules[capsuleBox.capsule2] &&
            !_expired(capsuleBox.capsule2)
        ) {
            _transferCapsule(_from, _to, capsuleBox.capsule2);
        }
    }

    /**
     * @dev Destroys capsules in capsule box that are still active.
     * @param _tokenID ID of token to destroy.
     */
    function _destroyTokenCapsules(uint256 _tokenID) internal virtual {
        CapsuleBox storage capsuleBox = _capsuleBoxes[_tokenID];
        if (_activeCapsules[capsuleBox.capsule1]) {
            _destroyCapsule(capsuleBox.capsule1, msg.sender);
        }
        if (_activeCapsules[capsuleBox.capsule2]) {
            _destroyCapsule(capsuleBox.capsule2, msg.sender);
        }
        delete _capsuleBoxes[_tokenID];
    }

    /**
     * @dev Function called before tokens are transferred. Override to
     * make sure vesting scheme has been set
     * @param _from The address tokens will be transferred from
     * @param _to The address tokens will be transferred  to
     * @param _tokenID The ID of the token to transfer
     */
    function _beforeTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenID
    ) internal virtual override {
        require(_schemeSet, "VestingCapsule: Vesting scheme not set");
        super._beforeTokenTransfer(_from, _to, _tokenID);
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
        } else if (_from != _to) {
            // TRANSFER - Batch transfer capsules
            _transferTokenCapsules(_from, _to, _tokenID);
        }
    }
}

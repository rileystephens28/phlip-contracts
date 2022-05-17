// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./VestingVault.sol";

/**
 * @title VestingCapsule
 * @author Riley Stephens
 * @dev The VestingCapsule is an abstract implementation of a VestingVault that supports
 * dynamic capsule binding to ERC721 tokens. Atomic vesting capsules are bundled together
 * into `CapsuleGroup`s that are minted, transferred, and burned alongside their ERC721
 * token counterparts.
 *
 * NOTE - This contract is intended to hold ERC20 tokens on behalf of others.
 */
abstract contract VestingCapsule is ERC721, VestingVault {
    struct CapsuleGroup {
        uint256[] schedules;
        uint256[] capsules;
    }
    // Mapping from token IDs to groupes containing capsule IDs
    mapping(uint256 => CapsuleGroup) private _capsuleGroups;

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Getter function for performing multi-capsule balance querying
     * @param _tokenID ID of token whose capsules to query
     * @return (Array of token addresses, Array of vested balances)
     */
    function totalVestedBalanceOf(uint256 _tokenID)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        CapsuleGroup storage capsuleGroup = _capsuleGroups[_tokenID];

        // Initialize fixed length arrays for token addresses and balances
        address[] memory t = new address[](capsuleGroup.capsules.length);
        uint256[] memory b = new uint256[](capsuleGroup.capsules.length);

        // Populate arrays with token addresses and balances
        for (uint256 i = 0; i < capsuleGroup.schedules.length; i++) {
            t[i] = _vestingSchedules[capsuleGroup.schedules[i]].token;
            b[i] = _getVestedBalance(capsuleGroup.capsules[i]);
        }
        return (t, b);
    }

    /**
     * @dev Getter function for `_capsuleGroups` value of `_groupID`
     * @param _groupID ID of the capsule group to query.
     * @return The struct values of the CapsuleGroup
     */
    function getCapsuleGroup(uint256 _groupID)
        public
        view
        returns (CapsuleGroup memory)
    {
        return _capsuleGroups[_groupID];
    }

    /***********************************|
    |        External Functions         |
    |__________________________________*/

    /**
     * @dev Transfers vested ERC20 tokens from capsule group
     * attached to `_tokenID`. If capsules in the group are no
     * longer active, this function will skip rather than reverting.
     *
     * Requirements:
     *
     * - `_tokenID` must exist.
     * - `msg.sender` must be `_tokenID` owner
     *
     * @param _tokenID ID of the token whose capsules to withdraw
     */
    function withdrawFromCapsules(uint256 _tokenID) external {
        require(_exists(_tokenID), "VestingCapsule: Token does not exist");
        require(
            ownerOf(_tokenID) == msg.sender,
            "VestingCapsule: Must be owner"
        );
        CapsuleGroup storage capsuleGroup = _capsuleGroups[_tokenID];
        for (uint256 i = 0; i < capsuleGroup.capsules.length; i++) {
            if (_activeCapsules[capsuleGroup.capsules[i]]) {
                _withdrawCapsuleBalance(capsuleGroup.capsules[i], msg.sender);
            }
        }
    }

    /**
     * @dev Transfers the amount of vested tokens leftover
     * after capsule was transfered by previous owner
     *
     * Requirements:
     *
     * - `_leftoverBalance[msg.sender][_token]` must be > 0.
     *
     * @param _token Address of token to withdraw from leftovers
     */
    function withdrawTokenLeftovers(address _token) external {
        _withdrawTokenLeftovers(_token, msg.sender);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Creates a new `CapsuleGroup` and attach it to an ERC721 token.
     * This function skips validation checks for `_tokenID` and `owner` to
     * allow inherited contracts to perform their own validatiion checks during mint.
     *
     * Requirements:
     *
     * - `_startTime` must be >= `block.timestamp`.
     * - `_scheduleIDs` must contain IDs for existing schedules vesting with
     * reserves containing enough tokens to create vesting capsules from
     *
     * @param _tokenID ID of token to attach capsule group to.
     * @param _owner Address to create capsule group for
     * @param _startTime Time at which capsules' cliff periods begin.
     * @param _scheduleIDs Array of vesting schedule IDs to create capsules from
     */
    function _createCapsuleGroup(
        uint256 _tokenID,
        address _owner,
        uint256 _startTime,
        uint256[] memory _scheduleIDs
    ) internal virtual {
        require(
            _startTime > block.timestamp - 1,
            "VestingCapsule: Start time in the past"
        );
        // Create capsule group and assign schedules
        CapsuleGroup storage newCapsuleGroup = _capsuleGroups[_tokenID];
        newCapsuleGroup.schedules = _scheduleIDs;

        // Create capsule for each schedule
        for (uint256 i = 0; i < _scheduleIDs.length; i++) {
            newCapsuleGroup.capsules.push(
                _createCapsule(_owner, _scheduleIDs[i], _startTime)
            );
        }
    }

    /**
     * @dev Transfers all non-expired, active capsules in a group to a new address.
     * Validation checks for `_to` and `from` are done by ERC721 transfer function.
     * If a non-existant `_tokenID` is provided, this function will quietly complete.
     * @param _from Address sending all capsules.
     * @param _to Address to receive all capsules.
     * @param _tokenID ID of token to transfer.
     */
    function _transferCapsuleGroup(
        address _from,
        address _to,
        uint256 _tokenID
    ) internal virtual {
        CapsuleGroup storage capsuleGroup = _capsuleGroups[_tokenID];

        // Check that all capsules are active and not expired before transfer
        // If capsule is unactive or expired, skip transfer but do not revert
        for (uint256 i = 0; i < capsuleGroup.capsules.length; i++) {
            if (
                _activeCapsules[capsuleGroup.capsules[i]] &&
                !_expired(capsuleGroup.capsules[i])
            ) {
                _transferCapsule(_from, _to, capsuleGroup.capsules[i]);
            }
        }
    }

    /**
     * @dev Destroys all active capsules in a group. If a non-existant
     * `_tokenID` is provided, this function will quietly finish execution.
     *
     * Requirements:
     *
     * - `_owner` must match `_tokenID` owner.
     *
     * @param _tokenID ID of token to destroy.
     */
    function _destroyCapsuleGroup(uint256 _tokenID, address _owner)
        internal
        virtual
    {
        CapsuleGroup storage capsuleGroup = _capsuleGroups[_tokenID];

        // Check that all capsules are active before destroying
        // If capsule is unactive, skip destroying but do not revert
        for (uint256 i = 0; i < capsuleGroup.capsules.length; i++) {
            if (_activeCapsules[capsuleGroup.capsules[i]]) {
                _destroyCapsule(capsuleGroup.capsules[i], _owner);
            }
        }

        // Once all active capsule have been destroyed, delete capsule group
        delete _capsuleGroups[_tokenID];
    }

    /**
     * @dev This function handles capsule group transferring and
     * burning. Inheriting contracts must handle capsule creation
     * when tokens are minted. This allows for dynamic capsule group
     * creation, while providing standardizes transfers and destruction.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     *   transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` and `to` are never both zero.
     *
     * @param _from The address token was transferred from
     * @param _to The address token was transferred to
     * @param _tokenID ID of the token transferred
     */
    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenID
    ) internal virtual override {
        super._afterTokenTransfer(_from, _to, _tokenID);
        if (_to == address(0)) {
            // BURN - Destroy all active capsule in tokens capsule group
            _destroyCapsuleGroup(_tokenID, _from);
        } else if (_from != _to) {
            // TRANSFER - Transfer all active capsule in tokens capsule group
            _transferCapsuleGroup(_from, _to, _tokenID);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./AbstractVestingCapsule.sol";
import "../CapsuleManager.sol";

/**
 * @title MultiScheduleVestingCapsule
 * @author Riley Stephens
 * @dev The MultiScheduleVestingCapsule is an implementation of an AbstractVestingCapsule that supports
 * multiple vesting schemes per token. The vesting scheme group can be updated but each token only supports
 * the vesting scheme that was set when the token was minted.
 *
 * NOTE - This contract address will need to be granted CapsuleManager treasurer role
 * to allow for proper interaction.
 */
contract MultiScheduleVestingCapsule is AbstractVestingCapsule {
    // Mapping from token ID to array of capsule IDs
    mapping(uint256 => uint256[]) private _capsulesLookup;

    // The IDs of the schedules to be used during mint
    uint256[] private _vestingScheduleIds;

    /***********************************|
    |          Initialization           |
    |__________________________________*/

    constructor(
        string memory _name,
        string memory _symbol,
        address _capsuleManagerAddress,
        uint256[] memory _scheduleIds
    ) AbstractVestingCapsule(_name, _symbol, _capsuleManagerAddress) {
        _setVestingSchedule(_scheduleIds);
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor to get the vested balance for a specified token.
     * Must be implemented by child contract.
     */
    function vestedBalanceOf(uint256 _tokenID)
        public
        view
        returns (address[] memory, uint256[] memory)
    {
        require(
            _exists(_tokenID),
            "MultiScheduleVestingCapsule: Querying vested balance of nonexistant token."
        );
        return _capsuleManager.vestedBalancesOf(_capsulesLookup[_tokenID]);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Setter for the ID of the schedule to be used during mint.
     * @param _ids Array of vesting schedule IDs
     */
    function _setVestingSchedule(uint256[] memory _ids) internal virtual {
        for (uint256 i = 0; i < _ids.length; i++) {
            require(
                _capsuleManager.scheduleExists(_ids[i]),
                "MultiScheduleVestingCapsule: Invalid schedule ID provided."
            );
        }
        _vestingScheduleIds = _ids;
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
     * @param _tokenId The ID of the token to transfer
     */
    function _afterTokenTransfer(
        address _from,
        address _to,
        uint256 _tokenId
    ) internal override {
        super._afterTokenTransfer(_from, _to, _tokenId);
        if (_from == address(0)) {
            // MINT - Call manager to batch create capsule and store reference
            _capsulesLookup[_tokenId] = _capsuleManager.batchCreateCapsules(
                _to,
                _vestingScheduleIds,
                block.timestamp
            );
        } else if (_to == address(0)) {
            // BURN - Call manager to batch destroy capsule and delete reference
            _capsuleManager.batchDestroyCapsules(_capsulesLookup[_tokenId]);
            delete _capsulesLookup[_tokenId];
        } else if (_from != _to) {
            // TRANSFER - Call manager to batch transfer capsules
            _capsuleManager.batchTransfer(_capsulesLookup[_tokenId], _to);
        }
    }
}

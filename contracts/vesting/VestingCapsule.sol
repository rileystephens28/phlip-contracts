// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./VestingVault.sol";

/**
 * @title VestingCapsule
 * @author Riley Stephens
 * @dev The VestingCapsule is an implementation of a VestingVault that supports
 * multiple vesting schemes per token. The vesting scheme group can be updated but each token only supports
 * the vesting scheme that was set when the token was minted.
 *
 * NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.
 */
abstract contract VestingCapsule is ERC721, VestingVault {
    // Mapping from token ID to array of capsule IDs
    mapping(uint256 => uint256[]) private _capsulesLookup;

    // The IDs of the schedules to be used during mint
    uint256[] private _currentScheduleIds;

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
        require(
            _exists(_tokenID),
            "VestingCapsule: Querying vested balance of nonexistant token."
        );
        return _getVestedBalances(_capsulesLookup[_tokenID]);
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
                _scheduleExists(_ids[i]),
                "VestingCapsule: Invalid schedule ID provided."
            );
        }
        _currentScheduleIds = _ids;
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
    ) internal virtual override {
        super._afterTokenTransfer(_from, _to, _tokenId);
        if (_from == address(0)) {
            // MINT - Batch create capsule and store reference
            _capsulesLookup[_tokenId] = _createMultiCapsule(
                _to,
                _currentScheduleIds,
                block.timestamp
            );
        } else if (_to == address(0)) {
            // BURN - Batch destroy capsule and delete reference
            for (uint256 i = 0; i < _capsulesLookup[_tokenId].length; i++) {
                _destroyCapsule(_capsulesLookup[_tokenId][i]);
            }
            delete _capsulesLookup[_tokenId];
        } else if (_from != _to) {
            // TRANSFER - Batch transfer capsules
            _transferMultiCapsule(_capsulesLookup[_tokenId], _to);
        }
    }
}

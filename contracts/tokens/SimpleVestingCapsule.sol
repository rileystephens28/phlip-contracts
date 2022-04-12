// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../CapsuleManager.sol";
import "./AbstractVestingCapsule.sol";

/**
 * @title SimpleVestingCapsule
 * @author Riley Stephens
 * @dev The SimpleVestingCapsule is an implementation of an AbstractVestingCapsule that supports
 * a single global vesting scheme. The vesting scheme can be updated but will always be
 * limited to one vesting scheme at a time.
 *
 * NOTE - This contract address will need to be granted CapsuleManager treasurer role
 * to allow for proper interaction.
 */
contract SimpleVestingCapsule is AbstractVestingCapsule {
    // Mapping from token ID to corresponding capsule ID
    mapping(uint256 => uint256) private _capsuleLookup;

    // The ID of the schedule to be used during mint
    uint256 private _vestingScheduleId;

    /***********************************|
    |          Initialization           |
    |__________________________________*/

    constructor(
        string memory _name,
        string memory _symbol,
        address _capsuleManagerAddress,
        uint256 _scheduleId
    ) AbstractVestingCapsule(_name, _symbol, _capsuleManagerAddress) {
        _setVestingSchedule(_scheduleId);
    }

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor for the Vesting Schedule ID
     */
    function getVestingSchedule() public view returns (uint256) {
        return _vestingScheduleId;
    }

    /**
     * @dev Accessor to get the vested balance for a specified token.
     * Must be implemented by child contract.
     */
    function vestedBalanceOf(uint256 _capsuleID)
        public
        view
        override
        returns (uint256)
    {
        return _capsuleManager.vestedBalanceOf(_capsuleID);
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Setter for the ID of the schedule to be used during mint.
     * @param _id ID of the new schedule
     */
    function _setVestingSchedule(uint256 _id) internal virtual {
        require(
            _capsuleManager.scheduleExists(_id),
            "VestingCapsule: Schedule does not exist"
        );
        _vestingScheduleId = _id;
        _scheduleIsSet = true;
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
            // MINT - Call manager to create capsule and store reference
            uint256 capsuleId = _capsuleManager.createCapsule(
                _to,
                _vestingScheduleId,
                block.timestamp
            );
            _capsuleLookup[_tokenId] = capsuleId;
        } else if (_to == address(0)) {
            // BURN - Call manager to destroy capsule and delete reference
            delete _capsuleLookup[_tokenId];
            _capsuleManager.destroyCapsule(_tokenId);
        } else if (_from != _to) {
            // TRANSFER - Call manager to tranfer capsule
            _capsuleManager.transfer(_tokenId, _to);
        }
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "../CapsuleManager.sol";

/**
 * @title VestingCapsule
 * @author Riley Stephens
 * @dev This is an implementation of an ERC721 token that supports a vesting scheme.
 * This contract address will need to be granted CapsuleManager treasurer role
 * to allow for proper interaction.
 */
contract VestingCapsule is ERC721 {
    using Address for address;

    // Mapping from token ID to owner address
    mapping(uint256 => address) private _owners;

    // Mapping owner address to token count
    mapping(address => uint256) private _balances;

    mapping(uint256 => uint256) private _capsuleLookup;

    // The ID of the schedule to be used during mint
    uint256 private _vestingScheduleId;

    CapsuleManager private _capsuleManager;

    /***********************************|
    |          Initialization           |
    |__________________________________*/

    constructor(
        string memory _name,
        string memory _symbol,
        address _capsuleManagerAddress,
        uint256 _scheduleId
    ) ERC721(_name, _symbol) {
        _setCapsuleManager(_capsuleManagerAddress);
        _setVestingSchedule(_scheduleId);
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
     * @dev Accessor for the Vesting Schedule ID
     */
    function getVestingScheduleId() public view returns (uint256) {
        return _vestingScheduleId;
    }

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
     * @dev Setter for the ID of the schedule to be used during mint.
     * @param _id ID of the new schedule
     */
    function _setVestingSchedule(uint256 _id) internal virtual {
        require(
            _capsuleManager.scheduleExists(_id),
            "VestingCapsule: Schedule does not exist"
        );
        _vestingScheduleId = _id;
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

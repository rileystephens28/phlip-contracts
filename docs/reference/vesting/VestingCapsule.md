
The VestingCapsule is an implementation of a VestingVault that supports
multiple vesting schemes per token. The vesting scheme group can be updated but each token only supports
the vesting scheme that was set when the token was minted.

NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.

## Functions
### totalVestedBalanceOf
```solidity
  function totalVestedBalanceOf(
  ) public returns (address[], uint256[])
```

Accessor to get the vested balance for a specified token.
Must be implemented by child contract.


### _setVestingSchedule
```solidity
  function _setVestingSchedule(
    uint256[] _ids
  ) internal
```

Setter for the ID of the schedule to be used during mint.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ids` | uint256[] | Array of vesting schedule IDs

### _afterTokenTransfer
```solidity
  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal
```

Hook that is called after tokens are transferred. This function
handles interaction with capsule manager.

Calling conditions:

- When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
  transferred to `to`.
- When `from` is zero, `tokenId` will be minted for `to`.
- When `to` is zero, ``from``'s `tokenId` will be burned.
- `from` and `to` are never both zero.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens will be transferred from
|`_to` | address | The address tokens will be transferred  to
|`_tokenId` | uint256 | The ID of the token to transfer


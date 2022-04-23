
The VestingCapsule is an implementation of a VestingVault that supports
2 vesting schemes per token. The vesting scheme group can be updated but each token only supports
the vesting scheme that was set when the token was minted.

NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.

## Functions
### totalVestedBalanceOf
```solidity
  function totalVestedBalanceOf(
  ) public returns (address[2], uint256[2])
```

Accessor to get the vested balance for a specified token.
Must be implemented by child contract.


### getCurrentVestingScheme
```solidity
  function getCurrentVestingScheme(
  ) public returns (uint256)
```

Accessor to get the ID of the current vesting scheme.


### getScheme
```solidity
  function getScheme(
    uint256 _schemeID
  ) public returns (struct VestingCapsule.VestingScheme)
```

Accessor function for specified VestingScheme details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_schemeID` | uint256 | The ID of the VestingScheme to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | struct values of the vesting scheme
### getCapsuleBox
```solidity
  function getCapsuleBox(
    uint256 _boxID
  ) public returns (struct VestingCapsule.CapsuleBox)
```

Accessor function for specified CapsuleBox details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_boxID` | uint256 | The ID of the CapsuleBox to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | struct values of the capsule box
### schemeIsSet
```solidity
  function schemeIsSet(
  ) public returns (bool)
```

Accessor function for is scheme has been set


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`|  | if a scheme has been set, false if not
### withdrawFromCapsules
```solidity
  function withdrawFromCapsules(
    uint256 _tokenID
  ) external
```

Transfers vested ERC20 tokens from specified tokens
capsule box. If capsules are no longer active, this function
will complete without reversion.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token whose capsules will be withdrawn

### withdrawTokenLeftovers
```solidity
  function withdrawTokenLeftovers(
    address _tokenAddress
  ) external
```

Transfers ERC20 tokens leftover after vesting capsule transfer to previous owner

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenAddress` | address | The ID of the token whose capsules will be withdrawn

### _addVestingScheme
```solidity
  function _addVestingScheme(
    uint256 _schedule1,
    uint256 _schedule2
  ) internal
```

Create a new vesting scheme with 2 schedules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_schedule1` | uint256 | ID of 1st schedule to use
|`_schedule2` | uint256 | ID of 2nd schedule to use

### _setVestingScheme
```solidity
  function _setVestingScheme(
    uint256 _schemeID
  ) internal
```

Setter for the ID of the scheme to be used during mint.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_schemeID` | uint256 | ID of scheme to set

### _createTokenCapsules
```solidity
  function _createTokenCapsules(
    uint256 _owner,
    address _startTime
  ) internal
```

Creates multiple new Capsules, all with same owner and start time.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | uint256 | Single beneficiary of new vesting capsules.
|`_startTime` | address | Time at which cliff periods begin.

### _transferTokenCapsules
```solidity
  function _transferTokenCapsules(
    address _from,
    address _to,
    uint256 _tokenID
  ) internal
```

Transfers a batch of Capsules owned by the caller to a single address.
Capsules must be marked as active and cannot have expired.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address sending all capsules.
|`_to` | address | Address to receive all capsules.
|`_tokenID` | uint256 | ID of token to transfer.

### _destroyTokenCapsules
```solidity
  function _destroyTokenCapsules(
    uint256 _tokenID
  ) internal
```

Destroys capsules in capsule box that are still active.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | ID of token to destroy.

### _beforeTokenTransfer
```solidity
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenID
  ) internal
```

Function called before tokens are transferred. Override to
make sure vesting scheme has been set

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens will be transferred from
|`_to` | address | The address tokens will be transferred  to
|`_tokenID` | uint256 | The ID of the token to transfer

### _afterTokenTransfer
```solidity
  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenID
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
|`_tokenID` | uint256 | The ID of the token to transfer


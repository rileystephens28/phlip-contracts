
The VestingCapsule is an abstract implementation of a VestingVault that supports
dynamic capsule binding to ERC721 tokens. Atomic vesting capsules are bundled together
into `CapsuleGroup`s that are minted, transferred, and burned alongside their ERC721
token counterparts.

NOTE - This contract is intended to hold ERC20 tokens on behalf of others.

## Functions
### totalVestedBalanceOf
```solidity
  function totalVestedBalanceOf(
    uint256 _tokenID
  ) public returns (address[], uint256[])
```

Getter function for performing multi-capsule balance querying

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | ID of token whose capsules to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Array of token addresses, Array of vested balances)
### getCapsuleGroup
```solidity
  function getCapsuleGroup(
    uint256 _groupID
  ) public returns (struct VestingCapsule.CapsuleGroup)
```

Getter function for `_capsuleGroups` value of `_groupID`

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_groupID` | uint256 | ID of the capsule group to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The struct values of the CapsuleGroup
### withdrawFromCapsules
```solidity
  function withdrawFromCapsules(
    uint256 _tokenID
  ) external
```

Transfers vested ERC20 tokens from capsule group
attached to `_tokenID`. If capsules in the group are no
longer active, this function will skip rather than reverting.

Requirements:

- `_tokenID` must exist.
- `msg.sender` must be `_tokenID` owner


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | ID of the token whose capsules to withdraw

### withdrawTokenLeftovers
```solidity
  function withdrawTokenLeftovers(
    address _token
  ) external
```

Transfers the amount of vested tokens leftover
after capsule was transfered by previous owner

Requirements:

- `_leftoverBalance[msg.sender][_token]` must be > 0.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | Address of token to withdraw from leftovers

### _createCapsuleGroup
```solidity
  function _createCapsuleGroup(
    uint256 _tokenID,
    address _owner,
    uint256 _startTime,
    uint256[] _scheduleIDs
  ) internal
```

Creates a new `CapsuleGroup` and attach it to an ERC721 token.
This function skips validation checks for `_tokenID` and `owner` to
allow inherited contracts to perform their own validatiion checks during mint.

Requirements:

- `_startTime` must be >= `block.timestamp`.
- `_scheduleIDs` must contain IDs for existing schedules vesting with
reserves containing enough tokens to create vesting capsules from


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | ID of token to attach capsule group to.
|`_owner` | address | Address to create capsule group for
|`_startTime` | uint256 | Time at which capsules' cliff periods begin.
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create capsules from

### _transferCapsuleGroup
```solidity
  function _transferCapsuleGroup(
    address _from,
    address _to,
    uint256 _tokenID
  ) internal
```

Transfers all non-expired, active capsules in a group to a new address.
Validation checks for `_to` and `from` are done by ERC721 transfer function.
If a non-existant `_tokenID` is provided, this function will quietly complete.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address sending all capsules.
|`_to` | address | Address to receive all capsules.
|`_tokenID` | uint256 | ID of token to transfer.

### _destroyCapsuleGroup
```solidity
  function _destroyCapsuleGroup(
    uint256 _tokenID
  ) internal
```

Destroys all active capsules in a group. If a non-existant
`_tokenID` is provided, this function will quietly finish execution.

Requirements:

- `_owner` must match `_tokenID` owner.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | ID of token to destroy.

### _afterTokenTransfer
```solidity
  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenID
  ) internal
```

This function handles capsule group transferring and
burning. Inheriting contracts must handle capsule creation
when tokens are minted. This allows for dynamic capsule group
creation, while providing standardizes transfers and destruction.

Calling conditions:

- When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
  transferred to `to`.
- When `from` is zero, `tokenId` will be minted for `to`.
- When `to` is zero, ``from``'s `tokenId` will be burned.
- `from` and `to` are never both zero.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address token was transferred from
|`_to` | address | The address token was transferred to
|`_tokenID` | uint256 | ID of the token transferred


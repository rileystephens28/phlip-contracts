
IVestingVault describes the functions required to implement a vesting vault.
note - This interface may be split up into single capsule and multi capsule interfaces.

## Functions
### availableReservesOf
```solidity
  function availableReservesOf(
    uint256 _scheduleID
  ) external returns (uint256)
```

Accessor function for available reserves of specified schedule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | amount of schedule denominated tokens available to create capsules with
### lockedReservesOf
```solidity
  function lockedReservesOf(
    uint256 _scheduleID
  ) external returns (uint256)
```

Calculates amount of schedule reserves locked in capsules

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | amount of schedule denominated tokens locked in capsules
### leftoverReservesOf
```solidity
  function leftoverReservesOf(
    address _token
  ) external returns (uint256)
```

Accessor function for leftover reserves of specified token.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | The address of the token to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | amount of specified tokens waiting to be withdrawn (no longer in capsules)
### isCapsuleActive
```solidity
  function isCapsuleActive(
    uint256 _capsuleID
  ) external returns (bool)
```

Accessor function for checking if capsule has expired and been claimed.
Note - capsules that do not actually exist are also considered inactive.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if capsule exists and has not been fully claimed, False otherwise.
### capsuleOwnerOf
```solidity
  function capsuleOwnerOf(
    uint256 _capsuleID
  ) external returns (address)
```

Accessor function for specified Capsule owner.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | address of the capsule owner
### vestedBalanceOf
```solidity
  function vestedBalanceOf(
    uint256 _capsuleID
  ) external returns (uint256)
```

Accessor function for amount of tokens that have vested for a given capsule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the capsule to be queried

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | amount of claimable tokens in a capsule
### leftoverBalanceOf
```solidity
  function leftoverBalanceOf(
    address _prevOwner,
    address _token
  ) external returns (uint256)
```

Accessor function for previous capsule owners leftover balance of given token.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_prevOwner` | address | The address of previous owner whose balance to query
|`_token` | address | The address of a token to query

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | amount of specified tokens leftover after capsule transfer
### fillReserves
```solidity
  function fillReserves(
    uint256 _scheduleID,
    uint256 _fillAmount
  ) external
```

Deposits tokens to schedule reserves for future capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to fill.
|`_fillAmount` | uint256 | Amount of tokens that will be deposited from treasurer.

### createVestingSchedule
```solidity
  function createVestingSchedule(
    address _token,
    uint256 _cliffSeconds,
    uint256 _tokenRatePerSecond
  ) external
```

Creates a new VestingSchedule that can be used by Capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | The token to be vested.
|`_cliffSeconds` | uint256 | The number of seconds after schedule starts and vesting begins.
|`_tokenRatePerSecond` | uint256 | The number of tokens to be vested per second.

### createSingleCapsule
```solidity
  function createSingleCapsule(
    address _owner,
    uint256 _scheduleID,
    uint256 _startTime
  ) external returns (uint256)
```

Create a new Capsule with specified schedule ID for a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Beneficiary of vesting tokens.
|`_scheduleID` | uint256 | Schedule ID of the associated vesting schedule.
|`_startTime` | uint256 | Time at which cliff period begins.

### createMultiCapsule
```solidity
  function createMultiCapsule(
    address _owner,
    uint256[] _scheduleIDs,
    uint256 _startTime
  ) external returns (uint256[])
```

Create multiple new Capsule with specified schedule ID for a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Single beneficiary of new vesting capsules.
|`_scheduleIDs` | uint256[] | Array of schedule IDs of the associated vesting schedule.
|`_startTime` | uint256 | Time at which cliff periods begin.

### destroySingleCapsule
```solidity
  function destroySingleCapsule(
    uint256 _capsuleID
  ) external
```

Allows capsule owner to delete one of their capsules and release its funds back to reserves.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | Capsule ID to delete.

### destroyMultiCapsule
```solidity
  function destroyMultiCapsule(
    uint256[] _capsuleIDs
  ) external
```

Destroys a batch of Capsules owned by the caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to destoy.

### transferSingleCapsule
```solidity
  function transferSingleCapsule(
    uint256 _capsuleID,
    address _to
  ) external
```

Transfers capsule ownership to a new address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the Capsule to be transferred.
|`_to` | address | Address to transfer to.

### transferMultiCapsule
```solidity
  function transferMultiCapsule(
    uint256[] _capsuleIDs,
    address _to
  ) external
```

Transfers capsule ownership to a new address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to transfer.
|`_to` | address | Address to transfer to.

### withdrawSingleCapsule
```solidity
  function withdrawSingleCapsule(
    uint256 _capsuleID
  ) external
```

Transfers the amount of tokens in one Capsule that have
vested to the owner of the capsule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the capsule to withdraw from.

### withdrawMultiCapsule
```solidity
  function withdrawMultiCapsule(
    uint256[] _capsuleIDs
  ) external
```

Transfers the amount of tokens in several capsules that have
vested to the owners of the capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to withdraw from.

### withdrawSingleTokenLeftovers
```solidity
  function withdrawSingleTokenLeftovers(
    address _token
  ) external
```

Transfers the amount of tokens leftover owed caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | ID of the Capsule to be claimed.

### withdrawMultiTokenLeftovers
```solidity
  function withdrawMultiTokenLeftovers(
    address[] _tokens
  ) external
```

Withdraw leftovers of several tokens owed to caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokens` | address[] | Array of token address to withdraw from leftover reserves.


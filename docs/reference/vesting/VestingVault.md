
VestingVault provides contracts with the ability to create custom vesting schedules and transferable vesting
capsules. This contract is designed to hold ERC20 tokens on behalf of vesting beneficiaries and control the rate at which
beneficiaries can withdraw them. When a capsule is transferred, the tokens owed to the prior owner
are stored in leftover reserves waiting to be claimed.

## Functions
### scheduleExists
```solidity
  function scheduleExists(
    uint256 _scheduleID
  ) public returns (bool)
```

Accessor function for checking if specified schedule is registered.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the VestingSchedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if the schedule is registered, false otherwise.
### getSchedule
```solidity
  function getSchedule(
    uint256 _scheduleID
  ) public returns (struct VestingVault.VestingSchedule)
```

Accessor function for specified VestingSchedule details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the VestingSchedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | struct values of the vesting schedule
### totalReservesOf
```solidity
  function totalReservesOf(
    uint256 _scheduleID
  ) public returns (uint256)
```

Accessor function for total reserves of specified schedule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | total amount of schedule denominated tokens held by contract
### availableReservesOf
```solidity
  function availableReservesOf(
    uint256 _scheduleID
  ) public returns (uint256)
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
  ) public returns (uint256)
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
### getCapsule
```solidity
  function getCapsule(
    uint256 _capsuleID
  ) public returns (struct VestingVault.Capsule)
```

Accessor function for specified Capsule details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | struct values of the actve capsule
### isCapsuleActive
```solidity
  function isCapsuleActive(
    uint256 _capsuleID
  ) public returns (bool)
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
  ) public returns (address)
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
  ) public returns (uint256)
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
  ) public returns (uint256)
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
### _scheduleExists
```solidity
  function _scheduleExists(
    uint256 _scheduleID
  ) internal returns (bool)
```

Accessor function for checking if specified schedule is registered.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the VestingSchedule to be queried.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if the schedule is registered, false otherwise.
### _expired
```solidity
  function _expired(
    uint256 _capsuleID
  ) internal returns (bool)
```

Accessor function for checking if specified schedule is registered.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of of the capsule to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if the schedule is registered, false otherwise.
### _getVestedBalance
```solidity
  function _getVestedBalance(
    uint256 _capsuleID
  ) internal returns (uint256)
```

Calculates the amount of tokens that have vested for a given capsule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the capsule to be queried

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | amount of claimable tokens in a capsule
### _createSchedule
```solidity
  function _createSchedule(
    address _token,
    uint256 _cliffSeconds,
    uint256 _tokenRatePerSecond
  ) internal
```

Creates a new VestingSchedule that can be used by future Capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | The token to be vested.
|`_cliffSeconds` | uint256 | The number of seconds after schedule starts and vesting begins.
|`_tokenRatePerSecond` | uint256 | The number of tokens to be vested per second.

### _fillReserves
```solidity
  function _fillReserves(
    address _scheduleID,
    uint256 _fillAmount
  ) internal
```

Deposits tokens to fill a future capsules for a specified schedule.
Requires that TREASURER approves this contract to spend schedule tokens.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | address | The ID of the schedule to fill.
|`_fillAmount` | uint256 | Amount of tokens transfered from sender to contract.

### _safeCreateCapsule
```solidity
  function _safeCreateCapsule(
    address _owner,
    uint256 _scheduleID,
    uint256 _startTime
  ) internal returns (uint256)
```

Performs additional validation checks on capsule params before creation.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Address of new capsule owner.
|`_scheduleID` | uint256 | The ID of the associated vesting schedule.
|`_startTime` | uint256 | Time at which cliff periods begin.

### _createCapsule
```solidity
  function _createCapsule(
    address _scheduleID,
    uint256 _startTime,
    uint256 _owner
  ) internal returns (uint256)
```

Most basic function for capsule creation, skips some parameter validation.
Creates a new capsule for the given address if the contract holdsenough tokens
to cover the amount of tokens required for the vesting schedule. This function
skips validation checks on _owner and _startTime to give inherited contracts
the ability to create more efficient batch operations

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | address | The ID of the schedule to be used for the capsule.
|`_startTime` | uint256 | The amount of claimable tokens in the capsule.
|`_owner` | uint256 | Address able to claim the tokens in the capsule.

### _safeDestroyCapsule
```solidity
  function _safeDestroyCapsule(
    uint256 _capsuleID
  ) internal
```

Checks that capsule is active before destroying it.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | Capsule ID to delete.

### _destroyCapsule
```solidity
  function _destroyCapsule(
    uint256 _capsuleID
  ) internal
```

Allows capsule owner to delete their Capsule and release its funds back to reserves.
This function skips validation checks on _capsuleID to give inherited contracts to make
more efficient batch operations.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | Capsule ID to delete.

### _safeTransferCapsule
```solidity
  function _safeTransferCapsule(
    address _from,
    address _to,
    uint256 _capsuleID
  ) internal
```

Allow Capsule owner to transfer ownership of one capsule
to another address. Validates the recipients address and that
the capsule has not expired before transfer.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address sending capsule.
|`_to` | address | Address to receive capsule.
|`_capsuleID` | uint256 | ID of capsule to transfer.

### _transferCapsule
```solidity
  function _transferCapsule(
    address _from,
    address _to,
    uint256 _capsuleID
  ) internal
```

Most basic function for capsule transfer, skips some parameter
validation. Allows capsule owner to transfer ownership to another address.
Unclaimed vested tokens are stored in leftover reserves for prior owner.
This function skips validation checks on recipient address and capsule expiration
so inherited contracts have the ability to create more efficient batch operations

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address sending capsule.
|`_to` | address | Address to receive capsule.
|`_capsuleID` | uint256 | ID of capsule to transfer.

### _withdrawCapsuleBalance
```solidity
  function _withdrawCapsuleBalance(
    uint256 _capsuleID
  ) internal returns (bool)
```

Transfers the amount of tokens in one Capsule that have
vested to the owner of the capsule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the capsule to withdraw from.

### _withdrawTokenLeftovers
```solidity
  function _withdrawTokenLeftovers(
    address _token,
    address _prevOwner
  ) internal
```

Transfers the amount of tokens leftover owed to caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | Address of token to withdraw from.
|`_prevOwner` | address | Address of previous owner of token.



The VestingVault provides functionality to create custom vesting schedules and
transferable vesting capsules.

This contract is designed to hold ERC20 tokens on behalf of vesting beneficiaries and
control the rate at which vested funds can be withdrawn. When a capsule is transferred,
the tokens owed to the prior owner are stored in leftover reserves waiting to be claimed.

The VestingVault is intended for use as a base class that other contracts inherit from.
Many thing can be built on top on VestingVaults such as ERC721 vesting capsules or stand alone
vesting treasuries. Access control should be practiced when handling funds on behlaf of others!

## Functions
### scheduleExists
```solidity
  function scheduleExists(
    uint256 _scheduleID
  ) public returns (bool)
```

Getter function for checking if specified schedule is registered.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the VestingSchedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | True if the schedule is registered, false otherwise.
### getSchedule
```solidity
  function getSchedule(
    uint256 _scheduleID
  ) public returns (struct VestingVault.VestingSchedule)
```

Getter function for specified VestingSchedule details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the VestingSchedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The struct values of the vesting schedule
### totalReservesOf
```solidity
  function totalReservesOf(
    uint256 _scheduleID
  ) public returns (uint256)
```

Getter function for `_totalScheduleReserves` of `_scheduleID`.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The total amount of schedule denominated tokens held by contract
### availableReservesOf
```solidity
  function availableReservesOf(
    uint256 _scheduleID
  ) public returns (uint256)
```

Getter function for `_availableScheduleReserves` of `_scheduleID`.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The amount of schedule denominated tokens available to create capsules with
### lockedReservesOf
```solidity
  function lockedReservesOf(
    uint256 _scheduleID
  ) public returns (uint256)
```

Calculates the difference between `_totalScheduleReserves` and
`_availableScheduleReserves` for a give `_scheduleID`


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The amount of schedule denominated tokens locked in capsules
### getCapsule
```solidity
  function getCapsule(
    uint256 _capsuleID
  ) public returns (struct VestingVault.Capsule)
```

Getter function for specified Capsule details.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The struct values of the actve capsule
### isCapsuleActive
```solidity
  function isCapsuleActive(
    uint256 _capsuleID
  ) public returns (bool)
```

Getter function for checking `_activeCapsules` status of `_capsuleID`.

Capsules that have expired are not considered inactive until the total vested
amount of tokens has been wthdrawn from them. Non-existant capsules will be
treated as inactive.

Note - capsules that do not actually exist are also considered inactive.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | True if capsule exists and has not been fully claimed, False otherwise.
### capsuleOwnerOf
```solidity
  function capsuleOwnerOf(
    uint256 _capsuleID
  ) public returns (address)
```

Getter function for `_capsuleOwners` of `_capsuleID`. Non-existance
capsules will return zero address as owner.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the Capsule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The address of the capsule owner
### vestedBalanceOf
```solidity
  function vestedBalanceOf(
    uint256 _capsuleID
  ) public returns (uint256)
```

Getter function for amount of tokens that have vested for `_capsuleID`.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the capsule to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The amount of claimable tokens in a capsule
### leftoverBalanceOf
```solidity
  function leftoverBalanceOf(
    address _prevOwner,
    address _token
  ) public returns (uint256)
```

Getter function for checking `_leftoverBalance` of `_prevOwner`
for a specified `_token` address.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_prevOwner` | address | The address of previous owner whose balance to query
|`_token` | address | The address of a token to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | The amount of specified tokens leftover after capsule transfer
### _scheduleExists
```solidity
  function _scheduleExists(
    uint256 _scheduleID
  ) internal returns (bool)
```

Getter function to check if `_scheduleID` exists in `_registeredSchedules`

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | ID of the VestingSchedule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | True if the schedule is registered, false otherwise.
### _expired
```solidity
  function _expired(
    uint256 _capsuleID
  ) internal returns (bool)
```

Getter function for checking if capsule has expired.
A capsule is considered expired when its `endTime` < `block.timestamp`.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the capsule to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | true if `endTime` < `block.timestamp`, false otherwise.
### _getVestedBalance
```solidity
  function _getVestedBalance(
    uint256 _capsuleID
  ) internal returns (uint256)
```

Calculates the amount of tokens that have vested and
are ready to be withdrawn from `_capsuleID`.

Calculation Conditions:

- `_activeCapsules` value is false
     =>  return 0
- `capsule.endTime` < `block.timestamp`
     =>  return `schedule.amount` - `capsule.claimedAmount`
- `capsule.startTime` + `schedule.cliff` > `block.timestamp`,
     =>  return '((block.timestamp - capsule.startTime) * schedule.rate) - capsule.claimedAmount'


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | The ID of the capsule to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The amount of claimable tokens in a capsule
### _createSchedule
```solidity
  function _createSchedule(
    address _token,
    uint256 _cliff,
    uint256 _duration,
    uint256 _amount
  ) internal returns (uint256)
```

Creates a new VestingSchedule that can be used by future Capsules.

Requirements:

- `_token` address cannot be zero address.
- `_amount` must be > 0.
- `_duration` must be > 0.
- `_cliff` must be < `duration`.

When `_cliff` is 0, vested tokens can immediately be withdrawn by capsule owner.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | The token to be vested.
|`_cliff` | uint256 | The number of seconds after schedule starts and vesting begins.
|`_duration` | uint256 | The number of seconds until vesting ends.
|`_amount` | uint256 | Desired amount of tokens (10^18 denominated) to be vested.
Ex: If the schedule should vest 100 tokens, _amount should be 100000000000000000000

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | The ID of the newly created vesting schedule.
### _fillReserves
```solidity
  function _fillReserves(
    address _filler,
    uint256 _scheduleID,
    uint256 _fillAmount
  ) internal
```

Deposits tokens to fill a future capsules for a specified schedule.

Requirements:

- `_scheduleID` must exist.
- `_fillAmount` must be > 0.
- `_fillAmount` must be 10^18 ERC20 compliant number.
- `_filler` must approved this contract as token spender.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_filler` | address | Address that holds tokens to be deposited.
|`_scheduleID` | uint256 | ID of the schedule to fill.
|`_fillAmount` | uint256 | Amount of tokens to transfer from filler.

### _safeCreateCapsule
```solidity
  function _safeCreateCapsule(
    address _owner,
    uint256 _scheduleID,
    uint256 _startTime
  ) internal returns (uint256)
```

Performs additional validation checks on capsule params before creation.

Requirements:

- `_scheduleID` must exist.
- `_owner` cannot be zero address.
- `_startTime` must be >= `block.timestamp`.
- `_availableScheduleReserves` of `_scheduleID` must be >= `schedule.amount`


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Address of new capsule owner.
|`_scheduleID` | uint256 | ID of the schedule capsule will be created from.
|`_startTime` | uint256 | Time at which cliff periods begin.

### _createCapsule
```solidity
  function _createCapsule(
    address _owner,
    uint256 _scheduleID,
    uint256 _startTime
  ) internal returns (uint256)
```

Most basic function for capsule creation. This function
skips validation checks on `_owner` and `_startTime` to provide
inherited contracts with the ability to create more efficient batch operations.

Requirements:

- `_scheduleID` must exist.
- `_availableScheduleReserves` of `_scheduleID` must be >= `schedule.amount`


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Address able to claim the tokens in the capsule.
|`_scheduleID` | uint256 | ID of the schedule capsule will be created from.
|`_startTime` | uint256 | The amount of claimable tokens in the capsule.

### _safeDestroyCapsule
```solidity
  function _safeDestroyCapsule(
    uint256 _owner,
    address _capsuleID
  ) internal
```

Delete an active capsule and release funds back to reserves.

Requirements:

- `_owner` must equal `_capsuleOwners[_capsuleID]`.
- `_activeCapsules` value must be true


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | uint256 | Address of current capsule owner.
|`_capsuleID` | address | ID of capsule to delete.

### _destroyCapsule
```solidity
  function _destroyCapsule(
    uint256 _capsuleID
  ) internal
```

Allows capsule owner to delete their Capsule and release its funds back to
reserves. This function skips validation checks on `_capsuleID` to provide inherited
contracts with the ability to create more efficient batch operations

Requirements:

- `_owner` must match `_capsuleOwners` record


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

Allow Capsule owner to transfer ownership of an
active capsule to another address.

Requirements:

- `_to` cannot be zero address.
- `_from` cannot equal `_to`
- `_capsuleID` must exist.
- `capsule.endtime` must be > `block.timestamp`
- `msg.sender` must be capsule owner


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

Most basic function for capsule transfer. Allows capsule owner
to transfer ownership to another address. Unclaimed vested tokens
are stored in leftover reserves for prior owner. This function skips
validation checks on `_to` address and `capsule.endtime`to provide inherited
contracts with the ability to create more efficient batch operations

Requirements:

- `_capsuleID` must exist.
- `msg.sender` must be capsule owner


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address to tranfer capsule from.
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

Requirements:

- `_capsuleID` must exist.
- `_owner` must match `_capsuleOwners` record


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

Transfers the amount of vested tokens leftover
after capsule was transfered by `_prevOwner`

Requirements:

- `_leftoverBalance[_prevOwner][_token]` must be > 0.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | Address of token to withdraw from.
|`_prevOwner` | address | Address of previous owner of token.


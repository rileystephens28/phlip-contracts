
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
### leftoverReservesOf
```solidity
  function leftoverReservesOf(
    address _token
  ) public returns (uint256)
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
### vestedBalancesOf
```solidity
  function vestedBalancesOf(
    uint256[] _capsuleIDs
  ) public returns (address[], uint256[])
```

Accessor function for amount of tokens that have vested for several capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of IDs of capsules to be queried

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`array`| uint256[] | of token addresses, array of vested balances for respective tokens)
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
### leftoverBalancesOf
```solidity
  function leftoverBalancesOf(
    address _prevOwner,
    address[] _tokens
  ) public returns (uint256[])
```

Accessor function for previous capsule owners leftover balance of several tokens.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_prevOwner` | address | The address of account whose balance to query
|`_tokens` | address[] | Array of token addresses to query

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
### _getVestedBalances
```solidity
  function _getVestedBalances(
    uint256[] _capsuleIDs
  ) internal returns (address[], uint256[])
```

Calculates the amount of tokens that have vested for several capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of IDs of capsules to be queried

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`array`| uint256[] | of token addresses, array of vested balances for respective tokens)
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
    uint256 _scheduleID,
    uint256 _fillAmount
  ) internal
```

Deposits tokens to fill a future capsules for a specified schedule.
Requires that TREASURER approves this contract to spend schedule tokens.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | uint256 | The ID of the schedule to fill.
|`_fillAmount` | uint256 | Amount of tokens transfered from sender to contract.

### _createSingleCapsule
```solidity
  function _createSingleCapsule(
    address _scheduleID,
    uint256 _startTime,
    uint256 _owner
  ) internal returns (uint256)
```

Creates one new Capsule for the given address if the contract holds
enough tokens to cover the amount of tokens required for the vesting schedule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | address | The ID of the schedule to be used for the capsule.
|`_startTime` | uint256 | The amount of claimable tokens in the capsule.
|`_owner` | uint256 | Address able to claim the tokens in the capsule.

### _createMultiCapsule
```solidity
  function _createMultiCapsule(
    address _owner,
    uint256[] _scheduleIDs,
    uint256 _startTime
  ) internal returns (uint256[])
```

Creates multiple new Capsules, all with same owner and start time.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owner` | address | Single beneficiary of new vesting capsules.
|`_scheduleIDs` | uint256[] | Array of schedule IDs of the associated vesting schedule.
|`_startTime` | uint256 | Time at which cliff periods begin.

### _batchCreateCapsules
```solidity
  function _batchCreateCapsules(
    address[] _owners,
    uint256[] _scheduleIDs,
    uint256[] _startTimes
  ) internal returns (uint256[])
```

Creates a batch of new Capsules from array params.
Note - May end up not using this function.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_owners` | address[] | Array of beneficiaries of vesting capsules.
|`_scheduleIDs` | uint256[] | Array of schedule IDs of the associated vesting schedule.
|`_startTimes` | uint256[] | Array of times at which cliff periods begin.

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
to cover the amount of tokens required for the vesting schedule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheduleID` | address | The ID of the schedule to be used for the capsule.
|`_startTime` | uint256 | The amount of claimable tokens in the capsule.
|`_owner` | uint256 | Address able to claim the tokens in the capsule.

### _destroySingleCapsule
```solidity
  function _destroySingleCapsule(
    uint256 _capsuleID
  ) internal
```

Allows capsule owner to delete their Capsule and release its funds back to reserves.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | Capsule ID to delete.

### _destroyMultiCapsule
```solidity
  function _destroyMultiCapsule(
    uint256[] _capsuleIDs
  ) internal
```

Destroys a batch of Capsules owned by the caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to destoy.

### _transferSingleCapsule
```solidity
  function _transferSingleCapsule(
    uint256 _capsuleID,
    address _to
  ) internal
```

Allow Capsule owner to transfer ownership of one capsule to another address.
The amount of unclaimed vested tokens are stored in leftover reseverves for prior owner.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the Capsule to be transferred.
|`_to` | address | Address to receive one capsule

### _transferMultiCapsule
```solidity
  function _transferMultiCapsule(
    uint256[] _capsuleIDs,
    address _to
  ) internal
```

Transfers a batch of Capsules owned by the caller to a single address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to transfer.
|`_to` | address | Address to receive all capsules.

### _batchTransferCapsules
```solidity
  function _batchTransferCapsules(
    uint256[] _capsuleIDs,
    address[] _recipients
  ) internal
```

Transfers a batch of Capsules owned by the caller to new addresses.
Note - May not end up using this function.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to transfer.
|`_recipients` | address[] | Array of addresses to receive capsules.

### _transferCapsule
```solidity
  function _transferCapsule(
    uint256 _capsuleID,
    address _to
  ) internal
```

Most basic function for capsule transfer, skips some parameter
validation. Allows capsule owner to transfer ownership to another address.
Unclaimed vested tokens are stored in leftover reserves for prior owner.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the Capsule to be transferred.
|`_to` | address | Address to the list of token beneficiaries.

### _withdrawSingleCapsule
```solidity
  function _withdrawSingleCapsule(
    uint256 _capsuleID
  ) internal
```

Transfers the amount of tokens in one Capsule that have
vested to the owner of the capsule.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleID` | uint256 | ID of the capsule to withdraw from.

### _withdrawMultiCapsule
```solidity
  function _withdrawMultiCapsule(
    uint256[] _capsuleIDs
  ) internal
```

Transfers the amount of tokens in several capsules that have
vested to the owners of the capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_capsuleIDs` | uint256[] | Array of capsule IDs to withdraw from.

### _withdrawSingleTokenLeftovers
```solidity
  function _withdrawSingleTokenLeftovers(
    address _token
  ) internal
```

Transfers the amount of tokens leftover owed caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_token` | address | ID of the Capsule to be claimed.

### _withdrawMultiTokenLeftovers
```solidity
  function _withdrawMultiTokenLeftovers(
    address[] _tokens
  ) internal
```

Withdraw leftovers of several tokens owed to caller.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokens` | address[] | Array of token address to withdraw from leftover reserves.


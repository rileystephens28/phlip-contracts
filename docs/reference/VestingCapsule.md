VestingCapsule is a protocol for creating custom vesting schedules and transferable vesting

capsules. This contract will hold ERC20 tokens on behalf of vesting beneficiaries and control the rate at which

beneficiaries can withdraw them. When a capsule is tranferred, the tokens owed to the prior owner

are stored in a temporary capsule that is destoyed once the prior owner withdraws them.

## Functions

### valueLockedInCapsules

```solidity

  function valueLockedInCapsules(

    address _token

  ) public returns (uint256)

```

Sums the _activeCapsuleValueLocked and _dormantCapsuleValueLocked

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_token` | address | The address of the token to be queried

#### Return Values:

| Name                           | Type          | Description                                                                  |

| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |

|`The`| address | total amount qty locked in all capsules for a given token

### activeCapsuleBalance

```solidity

  function activeCapsuleBalance(

    address _owner,

    uint256 _capsuleID

  ) public returns (uint256)

```

Calculates the total amount of tokens that have vested up until a the current time

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_owner` | address | The address capsule's owner

|`_capsuleID` | uint256 | The ID of the active capsule to be queried

#### Return Values:

| Name                           | Type          | Description                                                                  |

| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |

|`The`| address | amount of claimable tokens in an active capsule

### createVestingSchedule

```solidity

  function createVestingSchedule(

    address _token,

    uint256 _amount,

    uint256 _cliffSeconds,

    uint256 _tokenRatePerSecond

  ) external

```

Creates a new VestingSchedule that can be used by future ActiveCapsules.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_token` | address | The token to be vested.

|`_amount` | uint256 | The amount of tokens to be vested.

|`_cliffSeconds` | uint256 | The number of seconds after schedule starts and vesting begins.

|`_tokenRatePerSecond` | uint256 | The number of tokens to be vested per second.

### createCapsule

```solidity

  function createCapsule(

    address _beneficiary,

    uint256 _scheduleId,

    uint256 _startTime

  ) external

```

Create a new ActiveCapsule with specified schedule ID for a given address.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_beneficiary` | address | Beneficiary of vesting tokens.

|`_scheduleId` | uint256 | Schedule ID of the associated vesting schedule.

|`_startTime` | uint256 | Time at which cliff period begins.

### transferCapsule

```solidity

  function transferCapsule(

    uint256 _capsuleID,

    address _to

  ) external

```

Allow ActiveCapsule owner to transfer ownership to another address. If the current

owner has not claimed all of the vested tokens, a DormantCapsule is created to store

remaining tokens owned to the current owner.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_capsuleID` | uint256 | ID of the ActiveCapsule to be transferred.

|`_to` | address | Address to the list of token beneficiaries.

### claimActiveCapsule

```solidity

  function claimActiveCapsule(

    uint256 _capsuleID

  ) external

```

Tranfers the amount of tokens in an ActiveCapsule that have vested to the owner of the capsule.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_capsuleID` | uint256 | ID of the ActiveCapsule to be claimed.

### claimDormantCapsule

```solidity

  function claimDormantCapsule(

    uint256 _capsuleID

  ) external

```

Tranfers the amount of tokens in a DormantCapsule to the owner of the capsule.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_capsuleID` | uint256 | ID of the DormantCapsule to be claimed.

### _createActiveCapsule

```solidity

  function _createActiveCapsule(

    uint256 _scheduleId,

    uint256 _startTime,

    address _beneficiary

  ) internal

```

Creates a new ActiveCapsule for the given address if the contract holds

enough tokens to cover the amount of tokens required for the vesting schedule.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_scheduleId` | uint256 | The ID of the schedule to be used for the capsule.

|`_startTime` | uint256 | The amount of claimable tokens in the capsule.

|`_beneficiary` | address | Address able to claim the tokens in the capsule.

### _createDormantCapsule

```solidity

  function _createDormantCapsule(

    address _token,

    uint256 _amount,

    address _beneficiary

  ) internal

```

Creates a new DormantCapsule for the given address.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_token` | address | The ERC20 token claimable from the capsule.

|`_amount` | uint256 | The amount of claimable tokens in the capsule.

|`_beneficiary` | address | Address able to claim the tokens in the capsule.

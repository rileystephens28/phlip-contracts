
GuardedVestingVault is a role based access-control implementation
of the VestingVault protocol. This contract is managed by one or more treasurers
and can act as external capsule manager or be extended by other contracts.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```

Create a new CapsuleManager instance and grant msg.sender TREASURER role.


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


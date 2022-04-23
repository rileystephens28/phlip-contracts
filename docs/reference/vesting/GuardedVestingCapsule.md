
The GuardedVestingCapsule is an implementation of a VestingCapsule that supports
treasury management of vesting shedules and their respective reserves.

NOTE - This contract is intended to hold ERC20 tokens on behalf of capsule owners.

## Functions
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

### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```





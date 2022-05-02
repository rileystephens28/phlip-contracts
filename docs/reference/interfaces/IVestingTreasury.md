
Describes the functions required to implement a vesting treasury.

## Functions
### fillReserves
```solidity
  function fillReserves(
    address _filler,
    uint256 _scheduleID,
    uint256 _fillAmount
  ) external
```

Deposits tokens to schedule reserves for future capsules.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_filler` | address | Address that holds tokens to be deposited.
|`_scheduleID` | uint256 | The ID of the schedule to fill.
|`_fillAmount` | uint256 | Amount of tokens (10^18 denominated) that will be deposited from treasurer.

### createVestingSchedule
```solidity
  function createVestingSchedule(
    address _token,
    uint256 _cliff,
    uint256 _duration,
    uint256 _amount
  ) external returns (uint256)
```

Creates a new VestingSchedule that can be used by future Capsules.

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

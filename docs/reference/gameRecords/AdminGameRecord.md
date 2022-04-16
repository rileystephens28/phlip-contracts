
Contract that provides default game recording functionality with role based access control.

## Functions
### recordWin
```solidity
  function recordWin(
    uint256 _id
  ) external
```

Records a game win (NO REWARDS)

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | The ID of the token to record.

### recordWin
```solidity
  function recordWin(
    uint256 _id,
    uint256 _amount
  ) external
```

Records a game win (ETH REWARDS)

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | The ID of the token to record.
|`_amount` | uint256 | The amount of ETH won.

### recordWin
```solidity
  function recordWin(
    uint256 _id,
    address _token,
    uint256 _amount
  ) external
```

Records a game win (TOKEN REWARDS)

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | The ID of the token to record.
|`_token` | address | The address of token rewarded for winning.
|`_amount` | uint256 | The amount of tokens won.

### recordLoss
```solidity
  function recordLoss(
    uint256 _id
  ) external
```

Records a game loss for a given token

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | The ID of the token to record.


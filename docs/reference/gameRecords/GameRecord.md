
Provides contract with an interface for storing game win/loss records and
the overall amount of winnings. Winnings can be token addresses or ether.

## Functions
### gameRecordExists
```solidity
  function gameRecordExists(
    uint256 _recordID
  ) public returns (bool)
```

Accessor function for checking if a game record has been registered.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of a game record to check.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | True if the game record has been registered, false if not.
### winsFor
```solidity
  function winsFor(
    uint256 _recordID
  ) public returns (uint256)
```

Accessor function for getting a game records win count.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of a game record

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The number of wins on a game record.
### lossesFor
```solidity
  function lossesFor(
    uint256 _recordID
  ) public returns (uint256)
```

Accessor function for getting a game records loss count.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of a game record

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The number of losses on a game record.
### getTokenWinnings
```solidity
  function getTokenWinnings(
    uint256 _recordID,
    address _token
  ) public returns (uint256)
```

Accessor function for getting amount of winnings for specified token.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of a game record to query
|`_token` | address | The address of reward token to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The total amount of specified tokens won.
### getEthWinnings
```solidity
  function getEthWinnings(
    uint256 _recordID
  ) public returns (uint256)
```

Accessor function for getting amount of ETH won.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of a game record to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The total amount of ETH won.
### _createGameRecord
```solidity
  function _createGameRecord(
    uint256 _newRecordID
  ) internal
```

Sets the new game record ID to true in the _registeredRecords
mapping. The new game record ID must be unique.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newRecordID` | uint256 | The ID of the game record to create

### _recordWin
```solidity
  function _recordWin(
    uint256 _recordID
  ) internal
```

Increment the number of wins by 1 for a given game record.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of the game record to being updated

### _recordTokenWin
```solidity
  function _recordTokenWin(
    uint256 _recordID,
    address _rewardToken,
    uint256 _rewardAmount
  ) internal
```

Increments wins by 1 and stores the amount of tokens won.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of the game record to being updated
|`_rewardToken` | address | The address of the token rewarded for winning
|`_rewardAmount` | uint256 | The amount of tokens rewarded for winning

### _recordEthWin
```solidity
  function _recordEthWin(
    uint256 _recordID,
    uint256 _rewardAmount
  ) internal
```

Increments wins by 1 and stores the amount of ETH won.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of the game record to being updated
|`_rewardAmount` | uint256 | The amount of ETH rewarded for winning

### _recordLoss
```solidity
  function _recordLoss(
    uint256 _recordID
  ) internal
```

Increment the number of losses by 1 for a given game record.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_recordID` | uint256 | The ID of the game record to being updated


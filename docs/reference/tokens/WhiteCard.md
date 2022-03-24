Implementation of a PhlipCard with with basic game recording functionality.

## Functions

### constructor

```solidity

  function constructor(

  ) public

```

### recordWin

```solidity

  function recordWin(

    uint256 _tokenID

  ) external

```

Increment the number of wins by 1 for a given card.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_tokenID` | uint256 | The ID of the token to record.

### recordLoss

```solidity

  function recordLoss(

    uint256 _tokenID

  ) external

```

Increment the number of losses by 1 for a given card.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_tokenID` | uint256 | The ID of the token to record.

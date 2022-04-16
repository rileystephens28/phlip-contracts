
Manages the settings of a PhlipCard with role based access-control.

## Functions
### setBaseURI
```solidity
  function setBaseURI(
    string _newURI
  ) public
```

Allows MINTER to set the base URI for all tokens created by this contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newURI` | string | New base URI

### setMaxDownvotes
```solidity
  function setMaxDownvotes(
    uint256 _newMax
  ) public
```

Allows MINTER to set the max number of downvotes a card can have
before it is marked unplayable.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMax` | uint256 | The new max number of downvotes allowed

### setMaxUriChanges
```solidity
  function setMaxUriChanges(
    uint256 _newMax
  ) public
```

Allows MINTER to set max number of times minter can change the URI of a card.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMax` | uint256 | New max changes allowed

### setMinDaoTokensRequired
```solidity
  function setMinDaoTokensRequired(
    uint256 _newMin
  ) public
```

Allows MINTER to set minimum number of PhlipDAO tokens required to vote and mint.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMin` | uint256 | New min DAO tokens required

### setDaoTokenAddress
```solidity
  function setDaoTokenAddress(
    address _daoTokenAddress
  ) public
```

Allows MINTER to set the address of the PhlipDAO token contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_daoTokenAddress` | address | New contract address


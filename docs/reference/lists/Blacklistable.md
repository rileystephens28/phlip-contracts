
Provides contract with the ability to manage a blacklist of addresses.

## Functions
### isBlacklisted
```solidity
  function isBlacklisted(
    address _address
  ) public returns (bool)
```


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to check.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | Whether or not the address is blacklisted.
### _addToBlacklist
```solidity
  function _addToBlacklist(
    address _address
  ) internal
```

Set address to true in the blacklist mapping

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to the blacklist

### _removeFromBlacklist
```solidity
  function _removeFromBlacklist(
    address _address
  ) internal
```

Set address to false the blacklist mapping

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from the blacklist

## Events
### AddToBlacklist
```solidity
  event AddToBlacklist(
  )
```



### RemoveFromBlacklist
```solidity
  event RemoveFromBlacklist(
  )
```





Provides the ability to manage a whitelist of addresses. If
your contract requires more granular controls over a whitelist,
it is recommended to use the 'Claimable' extension.

## Functions
### isWhitelisted
```solidity
  function isWhitelisted(
    address _address
  ) public returns (bool)
```


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Whether`| address | or not the address is whitelisted.
### _addToWhitelist
```solidity
  function _addToWhitelist(
    address _address
  ) internal
```

Set address to true in the whitelist mapping

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to the whitelist

### _removeFromWhitelist
```solidity
  function _removeFromWhitelist(
    address _address
  ) internal
```

Set address to false the whitelist mapping

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from the whitelist


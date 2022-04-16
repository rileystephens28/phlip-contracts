
Contract that provides default blacklist functionality with role based access control.

## Functions
### blacklistAddress
```solidity
  function blacklistAddress(
    address _address
  ) external
```

Allow address with BLOCKER role to add an address to the blacklist

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to the blacklist

### unblacklistAddress
```solidity
  function unblacklistAddress(
    address _address
  ) external
```

Allow address with BLOCKER role to remove an address from the blacklist

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from the blacklist



The ILockOperator interface is used to define the functions
required to allow an external address to lock and unlock a token.

## Functions
### isLocked
```solidity
  function isLocked(
    uint256 _tokenID
  ) external returns (bool)
```

Accessor to check if a token is locked

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Whether or not the token is locked
### hasLockOperator
```solidity
  function hasLockOperator(
    uint256 _tokenID
  ) external returns (bool)
```

Accessor to check if a token has an approved lock operator
Note - Lock operator is still considered approved if they have requested to resign.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Whether or not token has an approved lock operator
### lock
```solidity
  function lock(
    uint256 _tokenID
  ) external
```

Allows lock operator to lock token

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to lock

### unlock
```solidity
  function unlock(
    uint256 _tokenID
  ) external
```

Allows lock operator to unlock token

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to lock

### initiateOperatorAgreement
```solidity
  function initiateOperatorAgreement(
    uint256 _tokenID,
    address _prospect,
    uint256 _expiration
  ) external
```

Set a tokens prospetive lock operator

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to add prospect for
|`_prospect` | address | The address to set as tokens pending operator
|`_expiration` | uint256 | The time at which the operator agreement expires (0 = no expiration)

### finalizeOperatorAgreement
```solidity
  function finalizeOperatorAgreement(
    uint256 _tokenID
  ) external
```

Set tokens pending lock operator to approved

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to approve operator for

### initiateResignation
```solidity
  function initiateResignation(
    uint256 _tokenID
  ) external
```

Set process of resignation of approved lock operator in motion

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to operator is resigning for

### finalizeResignation
```solidity
  function finalizeResignation(
    uint256 _tokenID
  ) external
```

Allows owner of token to approve resgination of lock operator.
Token will no longer be lockable until a new lock operator is approved.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to approve operator for

## Events
### InitiateAgreement
```solidity
  event InitiateAgreement(
  )
```



### FinalizeAgreement
```solidity
  event FinalizeAgreement(
  )
```



### TerminateAgreement
```solidity
  event TerminateAgreement(
  )
```



### Lock
```solidity
  event Lock(
  )
```



### Unlock
```solidity
  event Unlock(
  )
```




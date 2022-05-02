
Provides and simple interface giving a trusted address the ability
to lock/unlock token for transfers. Intended to be in NFT contracts to
allow token holders to approve other addresses as lock operators as an added layer of security

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
### lockOperatorOf
```solidity
  function lockOperatorOf(
    uint256 _tokenID
  ) public returns (address)
```

Accessor to get agreement operator address

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Address of tokens lock operator
### agreementStatusOf
```solidity
  function agreementStatusOf(
    uint256 _tokenID
  ) public returns (uint256)
```

Accessor to get agreement status

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Uint representing the status of the agreement:
 0 -> UNSET
 1 -> APPROVAL_PENDING
 2 -> APPROVED
 3 -> RESIGNATION_PENDING
### lock
```solidity
  function lock(
    uint256 _tokenID
  ) external
```

Allows approved operator to lock transfers of specified token

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

Allows approved operator to unlock transfers of specified token

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

### _isLocked
```solidity
  function _isLocked(
    uint256 _tokenID
  ) internal returns (bool)
```

Check if token was locked by operator or not. If token was locked by
operator and the operator agreement has expired, then the token is unlocked.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

### _hasValidOperator
```solidity
  function _hasValidOperator(
    uint256 _tokenID
  ) internal returns (bool)
```

Accessor to check if a token has an approved lock operator
Valid lock operator conditions:
- Operator agreement status = APPROVED or RESIGNATION_PENDING
  AND
- Operator agreement has no expiration or it has not expired yet

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Whether or not token has an approved lock operator
### _agreementHasExpired
```solidity
  function _agreementHasExpired(
    uint256 _tokenID
  ) internal returns (bool)
```

Accessor to check if lock operator agreement has expired

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Whether or not lock operator agreement has expired
### _setLock
```solidity
  function _setLock(
    uint256 _tokenID
  ) internal
```

Check if token was locked by operator or not. If token was locked by
operator and the operator agreement has expired, then the token is unlocked.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to check

### _initiateOperatorAgreement
```solidity
  function _initiateOperatorAgreement(
    uint256 _tokenID,
    address _prospect,
    address _expiration
  ) internal
```

Set a tokens prospetive lock operator

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to add prospect for
|`_prospect` | address | The address to set as tokens pending operator
|`_expiration` | address | The time at which the operator agreement expires (0 = no expiration)

### _finalizeOperatorAgreement
```solidity
  function _finalizeOperatorAgreement(
    uint256 _tokenID,
    address _operator
  ) internal
```

Set tokens pending lock operator to approved

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to approve operator for
|`_operator` | address | The address of pending operator to approve

### _initiateResignation
```solidity
  function _initiateResignation(
    uint256 _tokenID,
    address _operator
  ) internal
```

Set process of resignation of approved lock operator in motion

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to operator is approved for
|`_operator` | address | The address of approved operator trying to resign

### _finalizeResignation
```solidity
  function _finalizeResignation(
    uint256 _tokenID,
    address _owner
  ) internal
```

Allows owner of token to approve resgination of lock operator.
Token will no longer be lockable until a new lock operator is approved.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token to approve operator for
|`_owner` | address | The address of token owner

### _beforeTokenTransfer
```solidity
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal
```

Function called before tokens are transferred. Override to
make sure that token tranfer have not been locked.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens will be transferred from
|`_to` | address | The address tokens will be transferred  to
|`_tokenId` | uint256 | The ID of the token to transfer


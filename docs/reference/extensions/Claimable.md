
A Claim represents an asset(s) IOU that can be redeemed
by an address. Claims allow contracts to track the ownership of
NF assets that are intended to be minted at a later date.

## Functions
### hasClaim
```solidity
  function hasClaim(
    address _address
  ) public returns (bool)
```

Helper function to check if an address has a claim

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Whether`| address | or not the address has a claim.
### remainingClaims
```solidity
  function remainingClaims(
    address _address
  ) public returns (uint256)
```

Helper to get number of claims for an address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Beneficiary address of the claim.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Number`| address | of claims for an address.
### nextClaimableID
```solidity
  function nextClaimableID(
    address _address
  ) public returns (uint256)
```

Accessor method to get the first available ID in the list of address's claims.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address that has >= 1 claim(s).

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | first asset ID in the array of claims.
### getClaimableID
```solidity
  function getClaimableID(
    address _address
  ) public returns (uint256)
```

Accessor method to get the asset ID at a specific index in the list of address's claims.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address that has >= 1 claim(s).

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | asset ID at specified position in the array of claims.
### _createClaim
```solidity
  function _createClaim(
    address _beneficiary,
    uint256[] _assetIds
  ) internal
```

Creates a claim for an address that does not already have one.
The asset IDs being registered in the claim cannot appear in any other claims.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_beneficiary` | address | Address to create claim for.
|`_assetIds` | uint256[] | Array of IDs representing outside assets that can be claimed.

### _addToClaim
```solidity
  function _addToClaim(
    address _address,
    uint256 _assetId
  ) internal
```

Appends an ID to an existing claim's assetIds.
The ID cannot appear in any other claims.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address with an existing claim.
|`_assetId` | uint256 | ID to add to assetIds.

### _removeFromClaim
```solidity
  function _removeFromClaim(
    address _address,
    uint256 _index
  ) internal
```

Removes an asset at a specified index from
an existing claim. If the claim is fully redeemed after
the asset is removed, the claim is deleted.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address with an existing claim.
|`_index` | uint256 | Index of the asset ID to remove from the claim.


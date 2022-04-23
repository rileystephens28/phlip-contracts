
The IVoucherIssuer interface is used to define the functions that a
voucher issuing contract must implement. Inheriting contracts should practice
access-control for managing the issuance and redemption of vouchers.


## Functions
### hasVoucher
```solidity
  function hasVoucher(
    address _address
  ) external returns (bool)
```

Accessor function to see if an address has any vouchers.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Whether`| address | or not the address has >= 1 vouchers
### voucherHolderOf
```solidity
  function voucherHolderOf(
    uint256 _id
  ) external returns (address)
```

Accessor function for address of voucher holder

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | ID associated with voucher.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Address`| uint256 | of voucher holder.
### remainingVouchers
```solidity
  function remainingVouchers(
    address _for
  ) external returns (uint256)
```

Helper to get vouchers of claims for an address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_for` | address | Address of check for remaing vouchers.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Number`| address | of vouchers for an address.
### issueVoucher
```solidity
  function issueVoucher(
    address _to
  ) external
```

Issue a voucher to an address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to check.

### issueVouchers
```solidity
  function issueVouchers(
    address _to
  ) external
```

Issue many vouchers to an address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to check.

### redeemVoucher
```solidity
  function redeemVoucher(
    uint256 _id
  ) external
```

Redeem a voucher.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | ID associated with the voucher to redeem.

### redeemVouchers
```solidity
  function redeemVouchers(
    uint256[] _ids
  ) external
```

Redeem many vouchers.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ids` | uint256[] | Array of IDs associated with the vouchers to redeem.


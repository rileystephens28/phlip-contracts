
Vouchers represent the ability for an address to "cash in" on something at a future date.
This contract can be used to manage the issuance and redemption of vouchers.

## Functions
### hasVoucher
```solidity
  function hasVoucher(
    address _address
  ) public returns (bool)
```

Accessor function to see if an address has any vouchers.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to check.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | Whether or not the address has >= 1 vouchers
### voucherHolderOf
```solidity
  function voucherHolderOf(
    uint256 _reservedTokenID
  ) public returns (address)
```

Accessor function for address of voucher holder

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_reservedTokenID` | uint256 | ID of reserved token.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Address of voucher holder.
### remainingVouchers
```solidity
  function remainingVouchers(
    address _address
  ) public returns (uint256)
```

Helper to get vouchers of claims for an address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address of check.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | Number of vouchers for an address.
### _issueVoucher
```solidity
  function _issueVoucher(
    address _to,
    uint256 _reservedTokenID
  ) internal
```

Issue voucher to address for a token that will be minted at a future time.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | Address to issue voucher to.
|`_reservedTokenID` | uint256 | ID of token to reserve.

### _redeemVoucher
```solidity
  function _redeemVoucher(
    address _from,
    uint256 _reservedTokenID
  ) internal
```

Issue voucher to address for a token that will be minted at a future time.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | Address to redeem voucher from.
|`_reservedTokenID` | uint256 | ID of token to reserve.


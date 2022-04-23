
Functionality required to for implmenting Phlip blank card.

## Functions
### mintBlankCard
```solidity
  function mintBlankCard(
    address _to
  ) external
```

Mint a blank card to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint to.

### issueBlankCardVoucher
```solidity
  function issueBlankCardVoucher(
    address _to
  ) external
```

Issue a blank card voucher to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to issue voucher to.

### batchIssueBlankCardVouchers
```solidity
  function batchIssueBlankCardVouchers(
    address _to,
    uint256 _amount
  ) external
```

Issue many blank card vouchers to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_amount` | uint256 | The number of card vouchers to issue.


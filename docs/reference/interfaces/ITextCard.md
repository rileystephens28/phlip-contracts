
Functionality required to for implmenting Phlip text card.

## Functions
### mintTextCard
```solidity
  function mintTextCard(
    address _to,
    string _uri
  ) external
```

Mint a text card to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint to.
|`_uri` | string | The IPFS CID referencing the new cards text metadata.

### issueTextCardVoucher
```solidity
  function issueTextCardVoucher(
    address _to
  ) external
```

Issue a text card voucher to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to issue voucher to.

### batchIssueTextCardVouchers
```solidity
  function batchIssueTextCardVouchers(
    address _to,
    uint256 _amount
  ) external
```

Issue many text card vouchers to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_amount` | uint256 | The number of card vouchers to issue.


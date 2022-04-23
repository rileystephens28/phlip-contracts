
Functionality required to for implmenting Phlip image card.

## Functions
### mintImageCard
```solidity
  function mintImageCard(
    address _to,
    string _uri
  ) external
```

Mint a image card to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint to.
|`_uri` | string | The IPFS CID referencing the new cards image metadata.

### issueImageCardVoucher
```solidity
  function issueImageCardVoucher(
    address _to
  ) external
```

Issue a image card voucher to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to issue voucher to.

### batchIssueImageCardVouchers
```solidity
  function batchIssueImageCardVouchers(
    address _to,
    uint256 _amount
  ) external
```

Issue many image card vouchers to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_amount` | uint256 | The number of card vouchers to issue.


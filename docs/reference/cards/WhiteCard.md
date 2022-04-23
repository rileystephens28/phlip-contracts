
Implementation of a PhlipCard that supports text and blank cards.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### typeOf
```solidity
  function typeOf(
    uint256 _cardID
  ) public returns (uint256)
```

Accessor function to get type of card

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`0`| uint256 | if blank, 1 if blank
### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) public returns (string)
```

Accessor function for getting card's URI from ID
Override to return empty string if card is blank

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenId` | uint256 | ID of the card to get URI of

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`URI`| uint256 | of the card
### mintBlankCard
```solidity
  function mintBlankCard(
    address _to
  ) external
```

Allow minter to mint a blank card to a given address.

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

Allow minter to issue a blank card voucher to a given address.

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

Allow minter to issue many blank card vouchers to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_amount` | uint256 | The number of card vouchers to issue.

### updateMetadata
```solidity
  function updateMetadata(
    uint256 _cardID,
    string _uri
  ) public
```

Override PhlipCard.updateMetadata to prevent blank
cards from setting their URI.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to update
|`_uri` | string | The IPFS CID referencing the updated metadata

### redeemVoucher
```solidity
  function redeemVoucher(
    uint256 _reservedID,
    string _uri
  ) public
```

Mint card with ID that has been reserved by the callers voucher
Requires that caller has >=1 remaining card vouchers.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_reservedID` | uint256 | ID reserved by the callers voucher
|`_uri` | string | Should be left blank. Only used to match super function signature.


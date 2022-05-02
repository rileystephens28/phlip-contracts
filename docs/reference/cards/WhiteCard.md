
Implementation of a PhlipCard that supports text and blank cards.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```

Create a new instance of the WhiteCard contract.

Requirements:

- `_baseUri` cannot be blank.
- `_maxUriChanges` must be >= 1.


### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) public returns (string)
```

Accessor function for getting card's URI from ID
Override to return empty string if card is blank

Requirements:

- `_tokenId` must exist.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenId` | uint256 | ID of the card to get URI of

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | URI of the card
### updateMetadata
```solidity
  function updateMetadata(
    uint256 _cardID,
    string _uri
  ) public
```

Override PhlipCard.updateMetadata to prevent blank
cards from setting their URI.

Requirements:

- `_cardID` must exist.
- `_cardID` cannot be a blank card.
- `_uri` cannot be blank.
- `msg.sender` must be owner of `_cardID`
- `msg.sender` must be minter of `_cardID`
- card's `_metadataChangeCount` must be < `MAX_URI_CHANGES`


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

Requirements:

- `_uri` cannot be blank when redeeming text cards.
- `msg.sender` has >= 1 `_remainingVouchers`.
- `_paused` must be false.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_reservedID` | uint256 | ID reserved by the callers voucher
|`_uri` | string | URI of text card (pass empty string for blank cards)

### _setCardType
```solidity
  function _setCardType(
    uint256 _cardID,
    uint256 _type
  ) internal
```

Override of PhlipCard._setCardType to handle setting
card to type TEXT or BLANK.

Requirements:

- `_type` must be one of 0 (text) or 1 (blank).


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card whose type to set
|`_type` | uint256 | Integer corresponding to card type of card (0 or 1)

### _getCardType
```solidity
  function _getCardType(
    uint256 _cardID
  ) internal returns (uint256)
```

Override of PhlipCard._setCardType to handle
TEXT or BLANK card logic.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Integer corresponding to card type of card (0 or 1)


Implementation of a PhlipCard that supports text and image cards.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```

Create a new instance of the PinkCard contract.

Requirements:

- `_baseUri` cannot be blank.
- `_maxUriChanges` must be >= 1.


### redeemVoucher
```solidity
  function redeemVoucher(
    uint256 _reservedID,
    string _uri
  ) public
```

Mint card with ID that has been reserved by the callers voucher

Requirements:

- `_uri` cannot be blank.
- `msg.sender` has >= 1 `_remainingVouchers`.
- `_paused` must be false.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_reservedID` | uint256 | ID reserved by the callers voucher
|`_uri` | string | Should be left blank. Only used to match interface function signature.

### _setCardType
```solidity
  function _setCardType(
    uint256 _cardID,
    uint256 _type
  ) internal
```

Override of PhlipCard._setCardType to handle setting
card to type TEXT or IMAGE.

Requirements:

- `_type` must be one of 0 (text) or 1 (image).


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
TEXT or IMAGE card logic.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card to query

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Integer corresponding to card type of card (0 or 1)

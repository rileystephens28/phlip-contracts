
Functionality required to be considered a basic Phlip card.

## Functions
### minterOf
```solidity
  function minterOf(
    uint256 _cardID
  ) external returns (address)
```

Accessor function to get address of card minter

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Address`| uint256 | that minted the card
### transferCreatorship
```solidity
  function transferCreatorship(
    address _to,
    uint256 _cardID
  ) external
```

Transfer creatorship of a card to a new address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to transfer creatorship to.
|`_cardID` | uint256 | ID of the card whose creatorship to transfer

### updateMetadata
```solidity
  function updateMetadata(
    uint256 _cardID,
    string _uri
  ) external
```

Allows owner of a card to update the URI of their card.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to update
|`_uri` | string | The IPFS CID referencing the updated metadata


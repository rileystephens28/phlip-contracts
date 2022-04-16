
Implementation of a PhlipCard with with basic game recording functionality.

## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### _mintCard
```solidity
  function _mintCard(
    uint256 _cardID,
    address _to,
    string _uri
  ) internal
```

Overrides PhlipCard._mintCard() to include game recording functionality.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card being minted
|`_to` | address | The address to mint card to
|`_uri` | string | The IPFS CID referencing the new card's metadata

### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```

Override of PhlipCard and AccessControl supportsInterface



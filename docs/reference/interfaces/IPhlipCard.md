
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
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Address that minted the card
### typeOf
```solidity
  function typeOf(
    uint256 _cardID
  ) external returns (uint256)
```

Accessor function to get type of card

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Int corresponding to the type of card
Example: 0 if text, 1 if image
### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) external returns (string)
```

Accessor function for getting card's URI from ID
Modified implementation of ERC721URIStorage.tokenURI

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenId` | uint256 | ID of the card to get URI of

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | URI of the card
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

### issueCardVoucher
```solidity
  function issueCardVoucher(
    address _to,
    uint256 _type,
    uint256[] _scheduleIDs
  ) external
```

Issue a card voucher to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to issue voucher to.
|`_type` | uint256 | The type of card voucher can be redeemed for (text, image, blank, etc)
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create future card with

### mintCard
```solidity
  function mintCard(
    address _to,
    string _uri,
    uint256 _type,
    uint256[] _scheduleIDs
  ) external
```

Mint a card to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint to.
|`_uri` | string | The IPFS CID referencing the new cards text metadata.
|`_type` | uint256 | Int type of card to mint (text, image, blank, etc)
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create card's vesting capsules from


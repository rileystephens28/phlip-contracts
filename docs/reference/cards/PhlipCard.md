
This is the parent contract for pink and white Phlip game cards. This
contract is responsible for implementing the common functionality of both cards.

## Features

### Updatable Metadata
Card minters (must also be owner) are allowed to change their cards URI once
if their card has been downvoted too many times. Once a cards URI has been updated, the cards stats
should be reset to reflect that the card is basically new.

### Redeemable Vouchers
Grants addresses the ability to mint a specified number of cards directly from the contract
rather than requiring a MINTER to do it for them. Vouchers can be granted to certain addresses (SOTM owners)
or sold to addresses by MINTER contracts (presale).

### Vesting Capsule
The Card owner will also be registered as a beneficiary and receive PhlipDAO and PhlipP2E
tokens on a vesting schedule. When a Card is transferred to another address, the new owner becomes the recipient
of the vesting tokens. Once the tokens in a vesting capsule for a Card have run out, all future owners of that
Card will stop receiving vested payouts.

## Functions
### constructor
```solidity
  function constructor(
    string _name,
    string _symbol,
    string _baseUri,
    uint256 _maxUriChanges
  ) public
```

Create a new instance of the PhlipCard contract.

Requirements:

- `_baseUri` cannot be blank.
- `_maxUriChanges` must be >= 1.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_name` | string | Name of the card NFT
|`_symbol` | string | Symbol of the card NFT
|`_baseUri` | string | IPSF gateway URI for the card
|`_maxUriChanges` | uint256 | Number of times minter can change card's URI

### minterOf
```solidity
  function minterOf(
    uint256 _cardID
  ) public returns (address)
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
  ) public returns (uint256)
```

Accessor function to get type of card.
Note - This function will also return the type of a voucher

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Integer corresponding to card's type
### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) public returns (string)
```

Accessor function for getting card's URI from ID
Modified implementation of ERC721URIStorage.tokenURI

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
### setBaseURI
```solidity
  function setBaseURI(
    string _newURI
  ) public
```

Allows MINTER to set the base URI for
all tokens created by this contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newURI` | string | New base URI

### setMaxUriChanges
```solidity
  function setMaxUriChanges(
    uint256 _newMax
  ) public
```

Allows Settings Admin to set max number
of times minter can change the URI of a card.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMax` | uint256 | New max changes allowed

### pause
```solidity
  function pause(
  ) external
```

Allow address with PAUSER role to pause card transfers

Requirements:

- `msg.sender` must have PAUSER role.


### unpause
```solidity
  function unpause(
  ) external
```

Allow address with PAUSER role to unpause card transfers

Requirements:

- `msg.sender` must have PAUSER role.


### mintCard
```solidity
  function mintCard(
    address _to,
    string _uri,
    uint256 _type,
    uint256[] _scheduleIDs
  ) external
```

Allow minter to mint a text card to a given address.

Requirements:

- `to` cannot be the zero address.
- `_scheduleIDs` must contain IDs for existing schedules vesting with
reserves containing enough tokens to create vesting capsules from
- `msg.sender` must have MINTER role.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint to.
|`_uri` | string | The IPFS CID referencing the new cards text metadata.
|`_type` | uint256 | The type of card to mint (text, image, blank, etc)
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create card's vesting capsules from

### issueCardVoucher
```solidity
  function issueCardVoucher(
    address _to,
    uint256 _type,
    uint256[] _scheduleIDs
  ) external
```

Allow minter to issue a text card voucher to a given address.

Requirements:

- `_to` cannot be zero address.
- `_scheduleIDs` must contain IDs for existing schedules vesting
- `msg.sender` must have MINTER role.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to issue voucher to.
|`_type` | uint256 | The type of card to mint (text, image, blank, etc)
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create future card with

### batchIssueCardVouchers
```solidity
  function batchIssueCardVouchers(
    address _to,
    uint256 _type,
    uint256 _amount,
    uint256[] _scheduleIDs
  ) external
```

Allow minter to issue many card vouchers (with same type)
to a given address.

Requirements:

- `_to` cannot be zero address.
- `msg.sender` must have MINTER role.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_type` | uint256 | Integer card type that vouchers can be redeemed for.
|`_amount` | uint256 | Number of vouchers to issue.
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create future cards with

### updateMetadata
```solidity
  function updateMetadata(
    uint256 _cardID,
    string _uri
  ) public
```

Allows owner of a card to update the URI of their card.
If the URI was not set during mint, this function allows the
owner to set it without it counting towards the number of URI changes.

Requirements:

- `_cardID` must exist.
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
Requires that caller has >=1 remaining card vouchers.

Requirements:

- `_reservedID` must correspond with valid voucher.
- `msg.sender` must be holder of `_reservedID` voucher
- `_paused` must be false.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_reservedID` | uint256 | ID reserved by the callers voucher
|`_uri` | string | The IPFS CID referencing the new tokens metadata

### transferCreatorship
```solidity
  function transferCreatorship(
    address _to,
    uint256 _cardID
  ) external
```

Transfer creatorship of a card to a new address.

Requirements:

- `_to` cannot be zero address.
- `msg.sender` must be minter of `_cardID`


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to transfer creatorship to.
|`_cardID` | uint256 | ID of the card whose creatorship to transfer

### _mintCard
```solidity
  function _mintCard(
    uint256 _cardID,
    address _to,
    string _uri,
    uint256[] _scheduleIDs
  ) internal
```

Mints card to the given address.

Requirements:

- `_cardID` must not exist.
- `to` cannot be the zero address.
- `_scheduleIDs` must contain IDs for existing schedules vesting with
reserves containing enough tokens to create vesting capsules from


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card being minted
|`_to` | address | The address to mint card to
|`_uri` | string | The IPFS CID referencing the new card's metadata
|`_scheduleIDs` | uint256[] | Array of vesting schedule IDs to create card's vesting capsules from

### _setCardType
```solidity
  function _setCardType(
    uint256 _cardID,
    uint256 _type
  ) internal
```

This function is called when a card is created or a voucher is issued.
 It is intended to be overridden by child contracts to allow for custom type logic.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card whose type to set
|`_type` | uint256 | Int type of card to mint (text, image, blank, etc)

### _getCardType
```solidity
  function _getCardType(
    uint256 _cardID
  ) internal returns (uint256)
```

This function is called by typeOf. It is intended to be
overridden by child contracts to allow for custom type logic.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card whose type to set

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Integer type of card (0 - text, 1 - image, etc)
### _beforeTokenTransfer
```solidity
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal
```

Function called before tokens are transferred. Override to
make sure that token tranfers have not been paused.

Requirements:

- When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
transferred to `to`.
- When `from` is zero, `tokenId` will be minted for `to`.
- When `to` is zero, ``from``'s `tokenId` will be burned.
- `from` and `to` are never both zero.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens will be transferred from
|`_to` | address | The address tokens will be transferred  to
|`_tokenId` | uint256 | The ID of the token to transfer

### _afterTokenTransfer
```solidity
  function _afterTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal
```

Function called after tokens are transferred.
Override ERC721 and VestingCapsule

Requirements:
- when `from` and `to` are both non-zero.
- `from` and `to` are never both zero.


#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens were transferred from
|`_to` | address | The address tokens were transferred  to
|`_tokenId` | uint256 | The ID of the token transferred

### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```





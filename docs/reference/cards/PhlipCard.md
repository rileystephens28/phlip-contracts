
This is the parent contract for pink and white Phlip game cards. This
contract is responsible for implementing the common functionality of both cards.

## Features ##

Updatable Metadata - Card minters (must also be owner) are allowed to change their cards URI once
if their card has been downvoted too many times. Once a cards URI has been updated, the cards stats
should be reset to reflect that the card is basically new.

Redeemable Vouchers - Grants addresses the ability to mint a specified number of cards directly from the contract
rather than requiring a MINTER to do it for them. Vouchers can be granted to certain addresses (SOTM owners)
or sold to addresses by MINTER contracts (presale).

Vesting Capsule - The Card owner will also be registered as a beneficiary and receive PhlipDAO and PhlipP2E
tokens on a vesting schedule. When a Card is transferred to another address, the new owner becomes the recipient
of the vesting tokens. Once the tokens in a vesting capsule for a Card have run out, all future owners of that
Card will stop receiving vested payouts.


## Functions
### constructor
```solidity
  function constructor(
  ) public
```




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
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Address`| uint256 | that minted the card
### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) public returns (string)
```

Accessor function for getting card's URI from ID
Modified implementation of ERC721URIStorage.tokenURI

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenId` | uint256 | ID of the card to get URI of

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`URI`| uint256 | of the card
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

### setVestingScheme
```solidity
  function setVestingScheme(
    uint256 _id
  ) external
```

Allows Settings Admin to set the vesting
scheme ID for future card capsules to use

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_id` | uint256 | ID of vesting scheme to set

### addVestingScheme
```solidity
  function addVestingScheme(
    uint256 _scheme1,
    uint256 _scheme2
  ) external
```

Allows Settings Admin to create a new vesting
scheme with 2 vesting schedule IDs

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_scheme1` | uint256 | ID of first schedule in vesting scheme
|`_scheme2` | uint256 | ID of second schedule in vesting scheme

### pause
```solidity
  function pause(
  ) external
```

Allow address with PAUSER role to pause card transfers


### unpause
```solidity
  function unpause(
  ) external
```

Allow address with PAUSER role to unpause card transfers


### mintTextCard
```solidity
  function mintTextCard(
    address _to,
    string _uri
  ) external
```

Allow minter to mint a text card to a given address.

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

Allow minter to issue a text card voucher to a given address.

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

Allow minter to issue many text card vouchers to a given address.

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

Allows owner of a card to update the URI of their card. Requires
that the owner is also the minter of the card and has not already updated
the card's metadata before. If the URI was not set during mint, this function
allows the owner to set it without it counting towards the number of URI changes.

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
|`_uri` | string | The IPFS CID referencing the new tokens metadata

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

### _mintCard
```solidity
  function _mintCard(
    uint256 _cardID,
    address _to,
    string _uri
  ) internal
```

Mints card to the given address and initilizes a ballot for it.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of card being minted
|`_to` | address | The address to mint card to
|`_uri` | string | The IPFS CID referencing the new card's metadata

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






This is the parent contract for pink and white Phlip game cards. This
contract is responsible for implementing the common functionality of both cards.

## Features ##

Updatable Metadata - Card minters (must also be owner) are allowed to change their cards URI once
if their card has been downvoted too many times. Once a cards URI has been updated, the cards stats
should be reset to reflect that the card is basically new.

Automated Ballots - Addresses that hold a predetermined number of PhlipDAO tokens can cast up or down votes
on cards. If a card has received the maximum number of downvotes allowed, the card is marked unplayable
and as a result no longer accumulating winnings.Address can only cast one vote per card and card owners
cannot vote on their own card.

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
### isPlayable
```solidity
  function isPlayable(
    uint256 _cardID
  ) public returns (bool)
```

View function to see if card is playable

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if card is playable, false otherwise
### isBlank
```solidity
  function isBlank(
    uint256 _cardID
  ) public returns (bool)
```

View function to see if card is blank (no URI)

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the card to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if card is blank, false otherwise
### getPlayableCardCount
```solidity
  function getPlayableCardCount(
  ) public returns (uint256)
```

View function to see number of cards in that are playable


#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Number`|  | of cards in circulation that are not blank and have been voted out
### mintCard
```solidity
  function mintCard(
    address _to,
    string _uri
  ) external
```

Allow address with MINTER role to mint tokens to a given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_to` | address | The address to mint tokens to.
|`_uri` | string | The IPFS CID referencing the new tokens metadata.

### updateCardURI
```solidity
  function updateCardURI(
    uint256 _cardID,
    string _uri
  ) external
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

### upVote
```solidity
  function upVote(
    uint256 _cardID
  ) external
```

Records upvote for a card. Requires that the voter
is not the owner and has not voted on the card already

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the token upvoted

### downVote
```solidity
  function downVote(
    uint256 _cardID
  ) external
```

Records down vote for a card. Requires that the voter
is not the owner and has not voted on the card already. If the
card has been downvoted more than the allowed number of times,
it should be marked unplayable.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_cardID` | uint256 | The ID of the token upvoted

### setVestingSchedule
```solidity
  function setVestingSchedule(
    uint256[] _ids
  ) public
```

Allows MINTER to set the address of the PhlipDAO token contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ids` | uint256[] | New contract address

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

### _baseURI
```solidity
  function _baseURI(
  ) internal returns (string)
```

Override of ERC721._baseURI


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

### _holdsMinDaoTokens
```solidity
  function _holdsMinDaoTokens(
    address _account
  ) internal returns (bool)
```

Checks if the given address has PhlipDAO token balance > 0

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_account` | address | Address to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Wether`| address | the address has any PhlipDAO tokens.
### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```





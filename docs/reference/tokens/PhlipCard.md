
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




### pause
```solidity
  function pause(
  ) external
```

Allow address with PAUSER role to pause token transfers


### unpause
```solidity
  function unpause(
  ) external
```

Allow address with PAUSER role to unpause token transfers


### blacklistAddress
```solidity
  function blacklistAddress(
    address _address
  ) external
```

Allow address with BLOCKER role to add an address to the blacklist

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to add to the blacklist

### unblacklistAddress
```solidity
  function unblacklistAddress(
    address _address
  ) external
```

Allow address with BLOCKER role to remove an address from the blacklist

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The address to remove from the blacklist

### createClaim
```solidity
  function createClaim(
    address _address,
    uint256 _amount
  ) external
```

Create a claim for >=1 card(s) for given address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The beneficiary of the claim.
|`_amount` | uint256 | The number of cards that can be claimed.

### increaseClaim
```solidity
  function increaseClaim(
    address _address,
    uint256 _amount
  ) external
```

Increase the number of claimable cards for an existing claim.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | The beneficiary of the existing claim.
|`_amount` | uint256 | The number of claimable tokens to add to the claim.

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

### redeemCard
```solidity
  function redeemCard(
    string _uri
  ) external
```

Mint card to msg.sender and reduce claimable cards by 1.
Requires that msg.sender has a claim for >=1 card(s).

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_uri` | string | The IPFS CID referencing the new tokens metadata

### updateCardURI
```solidity
  function updateCardURI(
    uint256 _tokenID,
    string _uri
  ) external
```

Allows owner of a card to update the URI of their card. Requires
that the owner is also the minter of the card and has not already updated
the card's metadata before.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the card to update
|`_uri` | string | The IPFS CID referencing the updated metadata

### upVote
```solidity
  function upVote(
    uint256 _tokenID
  ) external
```

Records upvote for a card. Requires that the voter
is not the owner and has not voted on the card already

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token upvoted

### downVote
```solidity
  function downVote(
    uint256 _tokenID
  ) external
```

Records down vote for a card. Requires that the voter
is not the owner and has not voted on the card already. If the
card has been downvoted more than the allowed number of times,
it should be marked unplayable.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of the token upvoted

### isDaoTokenHolder
```solidity
  function isDaoTokenHolder(
    address _account
  ) public returns (bool)
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
### setBaseURI
```solidity
  function setBaseURI(
    string _newURI
  ) public
```

Allows MINTER to set the base URI for all tokens created by this contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newURI` | string | New base URI

### setDownVoteMax
```solidity
  function setDownVoteMax(
    uint256 _newMax
  ) public
```

Allows MINTER to set the max number of downvotes a card can have
before it is marked unplayable.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMax` | uint256 | The new max number of downvotes allowed

### setUriChangeMax
```solidity
  function setUriChangeMax(
    uint256 _newMax
  ) public
```

Allows MINTER to set max number of times minter can change the URI of a card.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMax` | uint256 | New max changes allowed

### setMinDaoTokensRequired
```solidity
  function setMinDaoTokensRequired(
    uint256 _newMin
  ) public
```

Allows MINTER to set minimum number of PhlipDAO tokens required to vote and mint.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newMin` | uint256 | New min DAO tokens required

### setDaoTokenAddress
```solidity
  function setDaoTokenAddress(
    address _daoTokenAddress
  ) public
```

Allows MINTER to set the address of the PhlipDAO token contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_daoTokenAddress` | address | New contract address

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
    uint256 _tokenID,
    address _to,
    string _uri
  ) internal
```

Mints card to the given address and initilizes a ballot for it.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenID` | uint256 | The ID of card being minted
|`_to` | address | The address to mint card to
|`_uri` | string | The IPFS CID referencing the new card's metadata

### _burn
```solidity
  function _burn(
  ) internal
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

### _baseURI
```solidity
  function _baseURI(
  ) internal returns (string)
```

Override of ERC721._baseURI


### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```





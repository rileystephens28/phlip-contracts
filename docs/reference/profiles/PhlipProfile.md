
ERC721 contract representing a Phlip user and their interactions with the game.

## Features ##

Connect With Friends - Adding other Players as friends allows you to play with them in private matches.

Create & Join Teams - Any player can create a new team. Once a team is created, any other players can
join too. Joining a team does not provide any direct game benefits to Players. However, teams that
frequently win can rise through the leaderboards and gain a lot of publicity (play-to-advertise model).

## Functions
### constructor
```solidity
  function constructor(
  ) public
```




### teamOf
```solidity
  function teamOf(
    uint256 _profileID
  ) public returns (uint256)
```

Accessor function for getting a profiles current team.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`ID`| uint256 | of the profiles current team ID (0 if no team).
### friendCountOf
```solidity
  function friendCountOf(
    uint256 _profileID
  ) public returns (uint256)
```

Accessor function for getting a profiles number of friends.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Number`| uint256 | of approved friends the profile has.
### getTeamInfo
```solidity
  function getTeamInfo(
    uint256 _teamID
  ) public returns (struct PhlipProfile.Team)
```

Accessor method to get the details of a team.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_teamID` | uint256 | ID of the team to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | profile struct data for the given profile ID.
### tokenURI
```solidity
  function tokenURI(
    uint256 _tokenId
  ) public returns (string)
```

Accessor function for getting profiles URI from ID
Modified implementation of ERC721URIStorage.tokenURI

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_tokenId` | uint256 | ID of the card to get URI of

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`URI`| uint256 | of the card
### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```

Override of ERC721 and AccessControl supportsInterface


### setBaseURI
```solidity
  function setBaseURI(
    string _newURI
  ) public
```

Allows settings admin to set the base
URI for all tokens created by this contract

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_newURI` | string | New base URI

### createProfile
```solidity
  function createProfile(
    string _uri
  ) external
```

Mint a new profile to address

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_uri` | string | The IPFS CID referencing the new profile's metadata

### createTeam
```solidity
  function createTeam(
    string _name
  ) external
```

Creates a new team and adds msg.sender as the founder.
note: Should the founder be added to the team by default?

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_name` | string | Name of the team.

### joinTeam
```solidity
  function joinTeam(
    uint256 _teamID
  ) external
```

Sets the team of an existing profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_teamID` | uint256 | ID of the team to join

### leaveTeam
```solidity
  function leaveTeam(
  ) external
```

Sets the team of an existing profile to 0.


### requestFriend
```solidity
  function requestFriend(
    uint256 _friendID
  ) external
```

Request a friendship with another profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_friendID` | uint256 | The ID of the profile being requested.

### approveFriend
```solidity
  function approveFriend(
    uint256 _requesterID
  ) external
```

Approve a friendship request from another profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_requesterID` | uint256 | The ID of the profile that requested a friendship.

### removeFriend
```solidity
  function removeFriend(
    uint256 _friendID
  ) external
```

Remove friendship between profiles.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_friendID` | uint256 | The ID of the profile to remove as friend.

### _beforeTokenTransfer
```solidity
  function _beforeTokenTransfer(
    address _from,
    address _to,
    uint256 _tokenId
  ) internal
```

Function called before tokens are transferred. Override to
make sure that receiving address does not already have a profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_from` | address | The address tokens will be transferred from
|`_to` | address | The address tokens will be transferred  to
|`_tokenId` | uint256 | The ID of the token to transfer


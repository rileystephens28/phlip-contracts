
ERC721 contract representing a Phlip user and their interactions with the game.

## Features ##

Connect With Friends - Adding other Players as friends allows you to play with them in private matches.

Create & Join Teams - Any player can create a new team. Once a team is created, any other players can
join too. Joining a team does not provide any direct game benefits to Players. However, teams that
frequently win can rise through the leaderboards and gain a lot of publicity (play-to-advertise model).

## Functions
### hasProfile
```solidity
  function hasProfile(
    address _address
  ) public returns (bool)
```

Check if an address has a profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_address` | address | Address to check.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`Whether`| address | or not an address has a profile
### getProfile
```solidity
  function getProfile(
    uint256 _profileID
  ) public returns (struct PhlipProfile.Profile)
```

Accessor method to get the details of a profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | profile struct data for the given profile ID.
### getFriends
```solidity
  function getFriends(
    uint256 _profileID
  ) public returns (uint256[])
```

Accessor method to get the friends of a profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`An`| uint256 | array of profile IDs (friends) of the given profile.
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
### getTeamMembers
```solidity
  function getTeamMembers(
    uint256 _teamID
  ) public returns (uint256[])
```

Accessor method to get the array of addresses that belong to team.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_teamID` | uint256 | ID of the team to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | address array of all team members
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
    uint256 _profileID,
    uint256 _teamID
  ) external
```

Sets the currentTeam of an existing profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | The ID of the profile joining a team.
|`_teamID` | uint256 | ID of the team to join

### addFriend
```solidity
  function addFriend(
    uint256 _profileID,
    uint256 _friendID
  ) external
```

Appends an address to the friends array of an existing profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | The ID of the profile to add friend to.
|`_friendID` | uint256 | The ID of the profile being adding as a friend.

### removeFriend
```solidity
  function removeFriend(
    uint256 _profileID,
    uint256 _friendIndex
  ) external
```

Remove an address from the friends array of an existing profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | The ID of the profile to remove a friend from.
|`_friendIndex` | uint256 | The index of the friend in the friends array.

### supportsInterface
```solidity
  function supportsInterface(
  ) public returns (bool)
```

Override of ERC721 and AccessControl supportsInterface



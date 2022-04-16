
Functions required to manage a Phlip user and their interactions with the game.

## Functions
### hasProfile
```solidity
  function hasProfile(
    address _address
  ) external returns (bool)
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
### getFriends
```solidity
  function getFriends(
    uint256 _profileID
  ) external returns (uint256[])
```

Accessor method for array of friend addresses of a profile.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`An`| uint256 | array of profile IDs (friends) of the given profile.
### getTeamMembers
```solidity
  function getTeamMembers(
    uint256 _teamID
  ) external returns (uint256[])
```

Accessor method for array of addresses that are members of team.

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

Creates a new team and sets caller as the founder.

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


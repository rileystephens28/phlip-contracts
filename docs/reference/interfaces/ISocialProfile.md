
Functions required to manage a Phlip user and their interactions with the game.

## Functions
### teamOf
```solidity
  function teamOf(
    uint256 _profileID
  ) external returns (uint256)
```

Accessor function for getting a profiles current team.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | ID of the profiles current team ID (0 if no team).
### friendCountOf
```solidity
  function friendCountOf(
    uint256 _profileID
  ) external returns (uint256)
```

Accessor function for getting a profiles number of friends.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_profileID` | uint256 | ID of the profile to query.

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | Number of approved friends the profile has.
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
    uint256 _teamID
  ) external
```

Sets the currentTeam of an existing profile.

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

## Events
### CreateTeam
```solidity
  event CreateTeam(
  )
```



### JoinTeam
```solidity
  event JoinTeam(
  )
```



### LeaveTeam
```solidity
  event LeaveTeam(
  )
```



### SendFriendRequest
```solidity
  event SendFriendRequest(
  )
```



### ApproveFriendRequest
```solidity
  event ApproveFriendRequest(
  )
```



### RemoveFriend
```solidity
  event RemoveFriend(
  )
```




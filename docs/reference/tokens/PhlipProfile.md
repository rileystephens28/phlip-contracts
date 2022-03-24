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

|`_profileID` | uint256 | ID of the profile joining the team.

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

|`_profileID` | uint256 | The ID of the profile adding a friend.

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

|`_profileID` | uint256 | The ID of the profile removing a friend.

|`_friendIndex` | uint256 | The index of the friend in the friends array.

### recordWin

```solidity

  function recordWin(

    uint256 _profileID,

    uint256 _winnings

  ) external

```

Incrememnts the gamesWon counter by 1 and adds the value (in ETH or DAO tokens?)

to an existing profile's totalGameWinnings.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_profileID` | uint256 | The ID of the token to record.

|`_winnings` | uint256 | The amount the owner of the token won from the game.

### recordLoss

```solidity

  function recordLoss(

    uint256 _profileID

  ) external

```

Incrememnts the gamesLost counter by 1 for an existing profile.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_profileID` | uint256 | The ID of the token to record.

### supportsInterface

```solidity

  function supportsInterface(

  ) public returns (bool)

```

Override of ERC721 and AccessControl supportsInterface

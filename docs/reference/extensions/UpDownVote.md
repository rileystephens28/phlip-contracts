Provides contract with the ability to create and manage a voting simple

voting system. The system allows for a single up or down vote to be cast per

address. In order to prevent spam voting, it is expected that this will be

converted to a weighted system that reduces the impact of an address's votes

if they up they cast a lot of votes in ether direction.

## Functions

### ballotIsRegistered

```solidity

  function ballotIsRegistered(

    uint256 _ballotID

  ) public returns (bool)

```

Accessor function for checking if a ballot has been registered.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_ballotID` | uint256 | The ID of a ballot to check.

#### Return Values:

| Name                           | Type          | Description                                                                  |

| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |

|`True`| uint256 | if the ballot has been registered, false if not.

### upVotesFor

```solidity

  function upVotesFor(

    uint256 _ballotID

  ) public returns (uint256)

```

Accessor function for getting a ballot's upVoteCount.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:

| Name                           | Type          | Description                                                                  |

| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |

|`The`| uint256 | number of up votes cast on a given ballot.

### downVotesFor

```solidity

  function downVotesFor(

    uint256 _ballotID

  ) public returns (uint256)

```

Accessor function for getting a ballot's downVoteCount.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:

| Name                           | Type          | Description                                                                  |

| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |

|`The`| uint256 | number of down votes cast on a given ballot.

### _createBallot

```solidity

  function _createBallot(

    uint256 _newBallotID

  ) internal

```

Sets the new ballot ID to true in the _registeredBallots

mapping. The new ballot ID must be unique.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_newBallotID` | uint256 | The ID of the ballot to create

### _castUpVote

```solidity

  function _castUpVote(

    uint256 _ballotID

  ) internal

```

Increments the upVoteCount for a given ballot. Requires

that msg.sender has not already casted a vote on the ballot.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_ballotID` | uint256 | The ID of the ballot to up vote.

### _castDownVote

```solidity

  function _castDownVote(

    uint256 _ballotID

  ) internal

```

Increments the downVoteCount for a given ballot. Requires

that msg.sender has not already casted a vote on the ballot.

#### Parameters:

| Name | Type | Description                                                          |

| :--- | :--- | :------------------------------------------------------------------- |

|`_ballotID` | uint256 | The ID of the ballot to down vote.

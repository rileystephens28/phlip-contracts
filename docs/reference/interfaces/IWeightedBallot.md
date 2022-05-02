
The IWeightedBallot interface is used to define the functions
needed to conduct a weighted vote.

## Functions
### upVoteValueOf
```solidity
  function upVoteValueOf(
    uint256 _ballotID
  ) external returns (uint256)
```

Accessor function for getting a ballots upVoteVal.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The number of up votes cast on a given ballot.
### downVoteValueOf
```solidity
  function downVoteValueOf(
    uint256 _ballotID
  ) external returns (uint256)
```

Accessor function for getting a ballots downVoteVal.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|uint256 | The number of down votes cast on a given ballot.
### upVoteWeightOf
```solidity
  function upVoteWeightOf(
    address _voter
  ) external returns (uint256)
```

Accessor function for up vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | The up vote weight of a voter.
### downVoteWeightOf
```solidity
  function downVoteWeightOf(
    address _voter
  ) external returns (uint256)
```

Accessor function for down vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Type          | Description                                                                  |
| :------------ | :--------------------------------------------------------------------------- |
|address | The down vote weight of a voter.
### upVote
```solidity
  function upVote(
    uint256 _ballotId
  ) external
```

Record an up vote for a ballot.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotId` | uint256 | ID of the ballot to vote on.

### downVote
```solidity
  function downVote(
    uint256 _ballotId
  ) external
```

Record a down vote for a ballot.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotId` | uint256 | ID of the ballot to vote on.


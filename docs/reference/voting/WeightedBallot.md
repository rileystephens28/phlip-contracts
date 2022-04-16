
Provides contract with the ability to create and manage a weighted
voting system. The system allows for a single up or down vote to be cast per
address per ballot. In order to prevent spam voting, directinal voting
frequency reduces the impact of each subsequent vote in that respective direction.
This means that if an address up votes more than they down vote, then the down
votes of that address will carry more weight than the up votes.

PRECISION = 10000 (to represent 2 decimal places)
Up vote weight is calculated as:
 PRECISION - (Num up votes cast * PRECISION / total votes cast)

Down vote weight is calculated as:
 PRECISION - (Num down votes cast * PRECISION / total votes cast)


Example Scenario: Address up votes 10 times and down votes 5 times.
- Up vote weight: 10000 - (10 * 10000 / 15) = 3334 => .3334 or 33.34%
- Down vote weight: 10000 - (5 * 10000 / 15) = 6666 => .6666 or 66.66%


## Functions
### upVoteValueOf
```solidity
  function upVoteValueOf(
    uint256 _ballotID
  ) public returns (uint256)
```

Accessor function for getting a ballots upVoteVal.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | number of up votes cast on a given ballot.
### downVoteValueOf
```solidity
  function downVoteValueOf(
    uint256 _ballotID
  ) public returns (uint256)
```

Accessor function for getting a ballots downVoteVal.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of a ballot

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | number of down votes cast on a given ballot.
### upVoteWeightOf
```solidity
  function upVoteWeightOf(
    address _voter
  ) public returns (uint256)
```

Accessor function for up vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | up vote weight of a voter.
### downVoteWeightOf
```solidity
  function downVoteWeightOf(
    address _voter
  ) public returns (uint256)
```

Accessor function for down vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | down vote weight of a voter.
### hasUpVoted
```solidity
  function hasUpVoted(
    uint256 _ballotID,
    address _voter
  ) public returns (bool)
```

Accessor function for seeing if voter has up voted

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | ID of ballot to check
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if voter has up voted on ballot, false otherwise.
### hasDownVoted
```solidity
  function hasDownVoted(
    uint256 _ballotID,
    address _voter
  ) public returns (bool)
```

Accessor function for seeing if voter has down voted

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | ID of ballot to check
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`True`| uint256 | if voter has down voted on ballot, false otherwise.
### _voterUpWeight
```solidity
  function _voterUpWeight(
    address _voter
  ) public returns (uint256)
```

Accessor function for up vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | up vote weight of a voter.
### _voterDownWeight
```solidity
  function _voterDownWeight(
    address _voter
  ) public returns (uint256)
```

Accessor function for down vote weight of address.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_voter` | address | Address of voter to check

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| address | down vote weight of a voter.
### _castUpVote
```solidity
  function _castUpVote(
    uint256 _ballotID,
    address _voter
  ) internal
```

Records up vote by increasing ballots up vote value by
the voters up vote weight. Undo previous down vote if one exists

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of the ballot to up vote.
|`_voter` | address | Address of the voter casting the vote.

### _castDownVote
```solidity
  function _castDownVote(
    uint256 _ballotID,
    address _voter
  ) internal
```

Records down vote by increasing ballots down vote value by
the voters down vote weight. Undo previous up vote if one exists

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_ballotID` | uint256 | The ID of the ballot to up vote.
|`_voter` | address | Address of the voter casting the vote.

### _calcVoterWeight
```solidity
  function _calcVoterWeight(
    uint256 _part,
    uint256 _whole,
    uint256 _precision
  ) internal returns (uint256)
```

Calculate the value of a voter for either direction.
If the voter has not voted, the value is equal to the precision.

#### Parameters:
| Name | Type | Description                                                          |
| :--- | :--- | :------------------------------------------------------------------- |
|`_part` | uint256 | The number of up or down votes cast.
|`_whole` | uint256 | The total number of votes cast.
|`_precision` | uint256 | The precision of the vote (default is 10000).

#### Return Values:
| Name                           | Type          | Description                                                                  |
| :----------------------------- | :------------ | :--------------------------------------------------------------------------- |
|`The`| uint256 | weighted value of the vote.

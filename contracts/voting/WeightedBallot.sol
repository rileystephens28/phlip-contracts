// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.13;

/**
 * @title WeightedBallot
 * @author Riley Stephens
 * @dev Provides contract with the ability to create and manage a weighted
 * voting system. The system allows for a single up or down vote to be cast per
 * address per ballot. In order to prevent spam voting, directinal voting
 * frequency reduces the impact of each subsequent vote in that respective direction.
 * This means that if an address up votes more than they down vote, then the down
 * votes of that address will carry more weight than the up votes.
 *
 * PRECISION = 10000 (to represent 2 decimal places)
 * Up vote weight is calculated as:
 *  PRECISION - (Num up votes cast * PRECISION / total votes cast)
 *
 * Down vote weight is calculated as:
 *  PRECISION - (Num down votes cast * PRECISION / total votes cast)
 *
 *
 * Example Scenario: Address up votes 10 times and down votes 5 times.
 * - Up vote weight: 10000 - (10 * 10000 / 15) = 3334 => .3334 or 33.34%
 * - Down vote weight: 10000 - (5 * 10000 / 15) = 6666 => .6666 or 66.66%
 *
 */
contract WeightedBallot {
    /**
     * @dev A Voter describes and address by storing
     * the number of upand down votes they have cast
     * @param upCount The number of up votes cast.
     * @param downCount The number of up votes cast.
     * @param voteCount The total number of votes cast.
     */
    struct Voter {
        uint256 upCount;
        uint256 downCount;
        uint256 voteCount;
        uint256 upWeight;
        uint256 downWeight;
    }

    /**
     * @dev A Ballot tracks up/down vote values
     * and voting addresses to prevent double voting.
     * @param upVoteVal Sum of up vote weights
     * @param downvoteCount Sum of down vote weights
     * @param upVoters Mapping of addresses that up voted.
     * @param downVoters Mapping of addresses that down voted.
     * @param voteWeights Mapping weight of addresses casted vote.
     */
    struct Ballot {
        uint256 upVoteVal;
        uint256 downVoteVal;
        mapping(address => bool) upVoters;
        mapping(address => bool) downVoters;
        mapping(address => uint256) voteWeights;
    }

    mapping(address => Voter) internal _voters;

    mapping(uint256 => Ballot) internal _ballots;

    // Vote weight precision contant
    uint256 internal PRECISION = 10000;

    /***********************************|
    |          View Functions           |
    |__________________________________*/

    /**
     * @dev Accessor function for getting a ballots upVoteVal.
     * @param _ballotID The ID of a ballot
     * @return The number of up votes cast on a given ballot.
     */
    function upVoteValueOf(uint256 _ballotID)
        public
        view
        virtual
        returns (uint256)
    {
        return _ballots[_ballotID].upVoteVal;
    }

    /**
     * @dev Accessor function for getting a ballots downVoteVal.
     * @param _ballotID The ID of a ballot
     * @return The number of down votes cast on a given ballot.
     */
    function downVoteValueOf(uint256 _ballotID)
        public
        view
        virtual
        returns (uint256)
    {
        return _ballots[_ballotID].downVoteVal;
    }

    /**
     * @dev Accessor function for up vote weight of address.
     * @param _voter Address of voter to check
     * @return The up vote weight of a voter.
     */
    function upVoteWeightOf(address _voter)
        public
        view
        virtual
        returns (uint256)
    {
        return _voterUpWeight(_voter);
    }

    /**
     * @dev Accessor function for down vote weight of address.
     * @param _voter Address of voter to check
     * @return The down vote weight of a voter.
     */
    function downVoteWeightOf(address _voter)
        public
        view
        virtual
        returns (uint256)
    {
        return _voterDownWeight(_voter);
    }

    /**
     * @dev Accessor function for seeing if voter has up voted
     * @param _ballotID ID of ballot to check
     * @param _voter Address of voter to check
     * @return True if voter has up voted on ballot, false otherwise.
     */
    function hasUpVoted(uint256 _ballotID, address _voter)
        public
        view
        virtual
        returns (bool)
    {
        return _ballots[_ballotID].upVoters[_voter];
    }

    /**
     * @dev Accessor function for seeing if voter has down voted
     * @param _ballotID ID of ballot to check
     * @param _voter Address of voter to check
     * @return True if voter has down voted on ballot, false otherwise.
     */
    function hasDownVoted(uint256 _ballotID, address _voter)
        public
        view
        virtual
        returns (bool)
    {
        return _ballots[_ballotID].downVoters[_voter];
    }

    /***********************************|
    |        Private Functions          |
    |__________________________________*/

    /**
     * @dev Accessor function for up vote weight of address.
     * @param _voter Address of voter to check
     * @return The up vote weight of a voter.
     */
    function _voterUpWeight(address _voter)
        public
        view
        virtual
        returns (uint256)
    {
        Voter storage voter = _voters[_voter];
        return _calcVoterWeight(voter.upCount, voter.voteCount, PRECISION);
    }

    /**
     * @dev Accessor function for down vote weight of address.
     * @param _voter Address of voter to check
     * @return The down vote weight of a voter.
     */
    function _voterDownWeight(address _voter)
        public
        view
        virtual
        returns (uint256)
    {
        Voter storage voter = _voters[_voter];
        return _calcVoterWeight(voter.downCount, voter.voteCount, PRECISION);
    }

    /**
     * @dev Records up vote by increasing ballots up vote value by
     * the voters up vote weight. Undo previous down vote if one exists
     * @param _ballotID The ID of the ballot to up vote.
     * @param _voter Address of the voter casting the vote.
     */
    function _castUpVote(uint256 _ballotID, address _voter) internal virtual {
        Ballot storage ballot = _ballots[_ballotID];
        require(!ballot.upVoters[_voter], "WeightedBallot: Already up voted");
        Voter storage voter = _voters[_voter];

        // If voter has already cast a down vote for this
        // ballot, delete previous down vote record
        if (ballot.downVoters[_voter]) {
            ballot.downVoters[_voter] = false;
            ballot.downVoteVal -= ballot.voteWeights[_voter];
            voter.downCount -= 1;
        } else {
            // Record new vote
            voter.voteCount += 1;
        }

        // Reduce vote count by 1 to exclude current vote
        uint256 upVoteWeight = _calcVoterWeight(
            voter.upCount,
            voter.voteCount - 1,
            PRECISION
        );
        voter.upCount += 1;

        // Record up vote
        ballot.upVoters[_voter] = true;
        ballot.upVoteVal += upVoteWeight;
        ballot.voteWeights[_voter] = upVoteWeight;
    }

    /**
     * @dev Records down vote by increasing ballots down vote value by
     * the voters down vote weight. Undo previous up vote if one exists
     * @param _ballotID The ID of the ballot to up vote.
     * @param _voter Address of the voter casting the vote.
     */
    function _castDownVote(uint256 _ballotID, address _voter) internal virtual {
        Ballot storage ballot = _ballots[_ballotID];
        require(
            !ballot.downVoters[_voter],
            "WeightedBallot: Already down voted"
        );
        Voter storage voter = _voters[_voter];

        // If voter has already cast an up vote for this
        // ballot, delete previous up vote record
        if (ballot.upVoters[_voter]) {
            delete ballot.upVoters[_voter];
            ballot.upVoteVal -= ballot.voteWeights[_voter];
            voter.upCount -= 1;
        } else {
            // Record new vote
            voter.voteCount += 1;
        }
        // Reduce vote count by 1 to exclude current vote
        uint256 downVoteWeight = _calcVoterWeight(
            voter.downCount,
            voter.voteCount - 1,
            PRECISION
        );
        voter.downCount += 1;

        // Record down vote
        ballot.downVoters[_voter] = true;
        ballot.downVoteVal += downVoteWeight;
        ballot.voteWeights[_voter] = downVoteWeight;
    }

    /***********************************|
    |          Pure Functions           |
    |__________________________________*/

    /**
     * @dev Calculate the value of a voter for either direction.
     * If the voter has not voted, the value is equal to the precision.
     * @param _part The number of up or down votes cast.
     * @param _whole The total number of votes cast.
     * @param _precision The precision of the vote (default is 10000).
     * @return The weighted value of the vote.
     */
    function _calcVoterWeight(
        uint256 _part,
        uint256 _whole,
        uint256 _precision
    ) internal pure virtual returns (uint256) {
        if (_whole == 0) {
            return _precision;
        }
        return _precision - ((_part * _precision) / _whole);
    }
}

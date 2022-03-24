// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title UpDownVote
 * @author Riley Stephens
 * @dev Provides contract with the ability to create and manage a voting simple
 * voting system. The system allows for a single up or down vote to be cast per
 * address. In order to prevent spam voting, it is expected that this will be
 * converted to a weighted system that reduces the impact of an address's votes
 * if they up they cast a lot of votes in ether direction.
 */
contract UpDownVote {
    /**
     * @dev A Ballot tracks the number of up and down votes and how each
     * address voted. Tracking addresses prevents double voting.
     * @param upvoteCount The number of up votes cast.
     * @param downvoteCount The number of up votes cast.
     * @param upVoters Mapping of addresses that up voted.
     * @param downVoters Mapping of addresses that down voted.
     */
    struct Ballot {
        uint256 upVoteCount;
        uint256 downVoteCount;
        mapping(address => bool) upVoters;
        mapping(address => bool) downVoters;
    }

    mapping(uint256 => bool) internal _registeredBallots;
    mapping(uint256 => Ballot) internal _ballots;

    /**
     * @dev Requires that _ballotId is true in _registeredBallots mapping.
     * @param _ballotID The ID of a ballot
     */
    modifier ballotExists(uint256 _ballotID) {
        require(
            _registeredBallots[_ballotID],
            "UpDownVote: Ballot does not exists"
        );
        _;
    }

    /**
     * @dev Accessor function for checking if a ballot has been registered.
     * @param _ballotID The ID of a ballot to check.
     * @return True if the ballot has been registered, false if not.
     */
    function ballotIsRegistered(uint256 _ballotID)
        public
        view
        virtual
        returns (bool)
    {
        return _registeredBallots[_ballotID];
    }

    /**
     * @dev Accessor function for getting a ballot's upVoteCount.
     * @param _ballotID The ID of a ballot
     * @return The number of up votes cast on a given ballot.
     */
    function upVotesFor(uint256 _ballotID)
        public
        view
        virtual
        returns (uint256)
    {
        return _ballots[_ballotID].upVoteCount;
    }

    /**
     * @dev Accessor function for getting a ballot's downVoteCount.
     * @param _ballotID The ID of a ballot
     * @return The number of down votes cast on a given ballot.
     */
    function downVotesFor(uint256 _ballotID)
        public
        view
        virtual
        returns (uint256)
    {
        return _ballots[_ballotID].downVoteCount;
    }

    /**
     * @dev Sets the new ballot ID to true in the _registeredBallots
     * mapping. The new ballot ID must be unique.
     * @param _newBallotID The ID of the ballot to create
     */
    function _createBallot(uint256 _newBallotID) internal virtual {
        require(
            !_registeredBallots[_newBallotID],
            "UpDownVote: Ballot already exists"
        );
        _registeredBallots[_newBallotID] = true;
    }

    /**
     * @dev Increments the upVoteCount for a given ballot. Requires
     * that msg.sender has not already casted a vote on the ballot.
     * @param _ballotID The ID of the ballot to up vote.
     */
    function _castUpVote(uint256 _ballotID)
        internal
        virtual
        ballotExists(_ballotID)
    {
        Ballot storage bal = _ballots[_ballotID];
        require(
            !bal.upVoters[msg.sender],
            "UpDownVote: ACCOUNT_ALREADY_UPVOTED"
        );
        require(
            !bal.downVoters[msg.sender],
            "UpDownVotes: ACCOUNT_ALREADY_DOWNVOTED"
        );
        bal.upVoters[msg.sender] = true;
        bal.upVoteCount += 1;
    }

    /**
     * @dev Increments the downVoteCount for a given ballot. Requires
     * that msg.sender has not already casted a vote on the ballot.
     * @param _ballotID The ID of the ballot to down vote.
     */
    function _castDownVote(uint256 _ballotID)
        internal
        virtual
        ballotExists(_ballotID)
    {
        Ballot storage bal = _ballots[_ballotID];
        require(
            !bal.upVoters[msg.sender],
            "UpDownVote: ACCOUNT_ALREADY_UPVOTED"
        );
        require(
            !bal.downVoters[msg.sender],
            "UpDownVotes: ACCOUNT_ALREADY_DOWNVOTED"
        );
        bal.downVoters[msg.sender] = true;
        bal.downVoteCount += 1;
    }
}

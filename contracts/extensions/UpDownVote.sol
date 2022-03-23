// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

contract UpDownVote {
    /**
     * A Ballot tracks the number of up and down votes and how each
     * address voted. Tracking addresses prevents double voting.
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
     * @notice Returns true if _ballotID is registered, false if not.
     * @param _ballotID The ID of a ballot
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
     * @notice Returns the number of up votes for a given ballot.
     * @param _ballotID The ID of a ballot
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
     * @notice Returns the number of down votes for a given ballot.
     * @param _ballotID The ID of a ballot
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
     * @notice Requires _ballotID to be registered.
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
     * @notice Count msg.sender's upvote for a token
     * @dev Reverts if msg.send has already voted on token
     * @param _newBallotID The ID of the token to upvote
     */
    function _createBallot(uint256 _newBallotID) internal virtual {
        require(
            !_registeredBallots[_newBallotID],
            "UpDownVote: Ballot already exists"
        );
        _registeredBallots[_newBallotID] = true;
    }

    /**
     * @notice Count msg.sender's upvote for a token
     * @dev Reverts if msg.send has already voted on token
     * @param _ballotID The ID of the token to upvote
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
     * @notice Count msg.sender's downvote for a token
     * @dev Reverts if msg.send has already voted on token
     * @param _ballotID The ID of the token to downvote
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

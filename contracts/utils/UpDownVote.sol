// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

contract UpDownVote {
    struct Votes {
        uint64 upVoteCount;
        uint64 downVoteCount;
        mapping(address => bool) upVoters;
        mapping(address => bool) downVoters;
    }

    mapping(uint256 => Votes) public votes;

    /**
     * @notice Ensure msg.sender has not voted on token
     * @dev Reverts if msg.send has already voted on token
     */
    modifier onlyNewVoters(uint256 tokenID) {
        Votes storage tokenVote = votes[tokenID];
        require(
            !tokenVote.upVoters[msg.sender],
            "UpDownVote: ACCOUNT_ALREADY_UPVOTED"
        );
        require(
            !tokenVote.downVoters[msg.sender],
            "UpDownVotes: ACCOUNT_ALREADY_DOWNVOTED"
        );
        _;
    }

    /**
     * @notice Count msg.sender's upvote for a token
     * @dev Only allows one vote per account per token
     * @param tokenID The ID of the token to upvote
     */
    function upVote(uint256 tokenID) public onlyNewVoters(tokenID) {
        Votes storage tokenVote = votes[tokenID];
        tokenVote.upVoters[msg.sender] = true;
        tokenVote.upVoteCount = tokenVote.upVoteCount + 1;
    }

    /**
     * @notice Count msg.sender's downvote for a token
     * @dev Only allows one vote per account per token
     * @param tokenID The ID of the token to downvote
     */
    function downVote(uint256 tokenID) public onlyNewVoters(tokenID) {
        Votes storage tokenVote = votes[tokenID];
        tokenVote.downVoters[msg.sender] = true;
        tokenVote.downVoteCount = tokenVote.downVoteCount + 1;
    }
}

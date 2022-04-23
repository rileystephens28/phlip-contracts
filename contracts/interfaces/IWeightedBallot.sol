// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

/**
 * @title IWeightedBallot
 * @author Riley Stephens
 * @dev The IWeightedBallot interface is used to define the functions
 * needed to conduct a weighted vote.
 */
interface IWeightedBallot {
    /**
     * @dev Accessor function for getting a ballots upVoteVal.
     * @param _ballotID The ID of a ballot
     * @return The number of up votes cast on a given ballot.
     */
    function upVoteValueOf(uint256 _ballotID) external view returns (uint256);

    /**
     * @dev Accessor function for getting a ballots downVoteVal.
     * @param _ballotID The ID of a ballot
     * @return The number of down votes cast on a given ballot.
     */
    function downVoteValueOf(uint256 _ballotID) external view returns (uint256);

    /**
     * @dev Accessor function for up vote weight of address.
     * @param _voter Address of voter to check
     * @return The up vote weight of a voter.
     */
    function upVoteWeightOf(address _voter) external view returns (uint256);

    /**
     * @dev Accessor function for down vote weight of address.
     * @param _voter Address of voter to check
     * @return The down vote weight of a voter.
     */
    function downVoteWeightOf(address _voter) external view returns (uint256);

    /**
     * @dev Record an up vote for a ballot.
     * @param _ballotId ID of the ballot to vote on.
     */
    function upVote(uint256 _ballotId) external;

    /**
     * @dev Record a down vote for a ballot.
     * @param _ballotId ID of the ballot to vote on.
     */
    function downVote(uint256 _ballotId) external;
}

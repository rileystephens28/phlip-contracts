// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;
import "../voting/WeightedBallot.sol";

contract WeightedBallotMock is WeightedBallot {
    function upVote(uint256 _id) external {
        _castUpVote(_id, msg.sender);
    }

    function downVote(uint256 _id) external {
        _castDownVote(_id, msg.sender);
    }
}

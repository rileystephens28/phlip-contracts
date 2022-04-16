const WeightedBallotMock = artifacts.require("WeightedBallotMock");
const { expectRevert, constants, BN } = require("@openzeppelin/test-helpers");
require("chai").should();

contract("WeightedBallot", (accounts) => {
    let ballotInstance;
    const [voter, otherAccount] = accounts;

    const upVote = async (id = 0, from = voter) => {
        return await ballotInstance.upVote(id, {
            from: from,
        });
    };

    const downVote = async (id = 0, from = voter) => {
        return await ballotInstance.downVote(id, {
            from: from,
        });
    };

    const verifyUpVoteValue = async (id, val) => {
        const upVoteVal = await ballotInstance.upVoteValueOf(id);
        upVoteVal.should.be.bignumber.equal(val);
    };

    const verifyDownVoteValue = async (id, val) => {
        const downVoteVal = await ballotInstance.downVoteValueOf(id);
        downVoteVal.should.be.bignumber.equal(val);
    };

    const verifyUpVoteWeight = async (address, val) => {
        const upVoteWeight = await ballotInstance.upVoteWeightOf(address);
        upVoteWeight.should.be.bignumber.equal(val);
    };

    const verifyDownVoteWeight = async (address, val) => {
        const downVoteWeight = await ballotInstance.downVoteWeightOf(address);
        downVoteWeight.should.be.bignumber.equal(val);
    };

    const verifyHasUpVoted = async (id, address, bool) => {
        const hasVoted = await ballotInstance.hasUpVoted(id, address);
        hasVoted.should.be.equal(bool);
    };

    const verifyHasDownVoted = async (id, address, bool) => {
        const hasVoted = await ballotInstance.hasDownVoted(id, address);
        hasVoted.should.be.equal(bool);
    };

    beforeEach(async () => {
        ballotInstance = await WeightedBallotMock.new({
            from: voter,
        });
    });

    describe("Up Voting", async () => {
        // Failure case
        it("should fail when voter has already up voted", async () => {
            await upVote();

            // Voter should have up voted
            await verifyHasUpVoted(0, voter, true);

            await expectRevert(upVote(), "WeightedBallot: Already up voted");
        });

        // Passing case
        it("should pass when voter has never cast vote", async () => {
            await upVote();

            // Voter should have up voted
            await verifyHasUpVoted(0, voter, true);

            // Ballot should have up vote value
            await verifyUpVoteValue(0, new BN(10000));

            // Voter should have up vote weight
            await verifyUpVoteWeight(voter, new BN(10000));
        });
        it("should pass when voter has already cast down vote", async () => {
            await downVote();
            await upVote();

            // Voter should have up voted
            await verifyHasUpVoted(0, voter, true);

            // Ballot should have up vote value
            await verifyUpVoteValue(0, new BN(10000));

            // Voter should have up vote weight
            await verifyUpVoteWeight(voter, new BN(10000));
        });
    });

    describe("Down Voting", async () => {
        // Failure case
        it("should fail when voter has already down voted", async () => {
            await downVote();

            // Voter should have up voted
            await verifyHasDownVoted(0, voter, true);

            await expectRevert(
                downVote(),
                "WeightedBallot: Already down voted"
            );
        });

        // Passing case
        it("should pass when voter has never cast vote", async () => {
            await downVote();

            // Voter should have down voted
            await verifyHasDownVoted(0, voter, true);

            // Ballot should have down vote value
            await verifyDownVoteValue(0, new BN(10000));

            // Voter should have down vote weight
            await verifyDownVoteWeight(voter, new BN(10000));
        });
        it("should pass when voter has already cast up vote", async () => {
            await upVote();
            await downVote();

            // Voter should have down voted
            await verifyHasDownVoted(0, voter, true);

            // Ballot should have down vote value
            await verifyDownVoteValue(0, new BN(10000));

            // Voter should have down vote weight
            await verifyDownVoteWeight(voter, new BN(10000));
        });
    });

    describe("Calculating Vote Weight", () => {
        // The issue right now is that most voting weights are rounding up, regardless
        // of the "demical" value. This is causing the test to fail and the total voting weight
        // of voters to exceed 10,000 (this shoudl never happen)
        it("voter has cast 3 up votes & 2 down votes", async () => {
            await upVote(0, voter);
            await upVote(1, voter);
            await upVote(2, voter);
            await downVote(3, voter);
            await downVote(4, voter);

            // Voter up vote weight should be 40.00%
            await verifyUpVoteWeight(voter, new BN(4000));

            // Voter down vote weight should be 60.00%
            await verifyDownVoteWeight(voter, new BN(6000));
        });
        it("voter has cast 2 up votes & 7 down votes", async () => {
            for (let i = 0; i < 2; i++) {
                await upVote(i, voter);
            }

            for (let i = 2; i < 9; i++) {
                await downVote(i, voter);
            }

            // Voter up vote weight should be 40.00%
            await verifyUpVoteWeight(voter, new BN(7778));

            // Voter down vote weight should be 60.00%
            await verifyDownVoteWeight(voter, new BN(2222));
        });

        it("voter has cast 11 up votes & 8 down votes", async () => {
            for (let i = 0; i < 11; i++) {
                await upVote(i, voter);
            }

            for (let i = 11; i < 19; i++) {
                await downVote(i, voter);
            }

            // Voter up vote weight should be 40.00%
            await verifyUpVoteWeight(voter, new BN(4211));

            // Voter down vote weight should be 60.00%
            await verifyDownVoteWeight(voter, new BN(5789));
        });
        it("voter has cast 1 up votes & 12 down votes", async () => {
            await upVote(0, voter);

            for (let i = 1; i < 13; i++) {
                await downVote(i, voter);
            }

            // Voter up vote weight should be 40.00%
            await verifyUpVoteWeight(voter, new BN(9231));

            // Voter down vote weight should be 60.00%
            await verifyDownVoteWeight(voter, new BN(769));
        });
    });
});

const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
} = require("@openzeppelin/test-helpers");
require("chai").should();

const RECORDER = web3.utils.soliditySha3("RECORDER_ROLE");

function shouldBehaveLikeAdminGameRecord(
    context,
    recorderKey,
    tokenKey,
    recorder,
    otherAccount
) {
    baseTokenReward = 1;
    baseEthReward = 1;

    const accessControlRevertReason =
        "AccessControl: account " +
        otherAccount.toLowerCase() +
        " is missing role " +
        RECORDER +
        ".";

    const recordNoRewardWin = async (id = 0, from = recorder) => {
        return await context[recorderKey].methods["recordWin(uint256)"](id, {
            from: from,
        });
    };

    const recordEthWin = async (id = 0, amount = 1, from = recorder) => {
        return await context[recorderKey].methods["recordWin(uint256,uint256)"](
            id,
            new BN(amount),
            {
                from: from,
            }
        );
    };

    const recordTokenWin = async (
        id = 0,
        amount = 1,
        token = context[tokenKey].address,
        from = recorder
    ) => {
        return await context[recorderKey].methods[
            "recordWin(uint256,address,uint256)"
        ](id, token.toLowerCase(), new BN(amount), {
            from: from,
        });
    };

    const recordLoss = async (id = 0, from = recorder) => {
        return await context[recorderKey].recordLoss(id, {
            from: from,
        });
    };

    const verifyWinCount = async (id, val) => {
        const wins = await context[recorderKey].winsFor(id);
        wins.should.be.bignumber.equal(new BN(val));
    };

    const verifyLossCount = async (id, val) => {
        const losses = await context[recorderKey].lossesFor(id);
        losses.should.be.bignumber.equal(new BN(val));
    };

    const verifyTokenWinnings = async (id, token, val) => {
        const winnings = await context[recorderKey].getTokenWinnings(id, token);
        winnings.should.be.bignumber.equal(new BN(val));
    };

    const verifyEthWinnings = async (id, val) => {
        const winnings = await context[recorderKey].getEthWinnings(id);
        winnings.should.be.bignumber.equal(new BN(val));
    };

    describe("Recording Game Wins", async () => {
        describe("With No Rewards", async () => {
            // Failure cases
            it("should fail when card ID is out of bounds", async () => {
                await expectRevert(
                    recordNoRewardWin(1),
                    "GameRecord: Game record does not exist"
                );
                // Should not have any wins
                await verifyWinCount(0, 0);
            });
            it("should fail when msg.sender != recorder", async () => {
                await expectRevert(
                    recordNoRewardWin(0, otherAccount),
                    accessControlRevertReason
                );
                // Should not have any wins
                await verifyWinCount(0, 0);
            });

            // Passing cases
            it("should pass when msg.sender is recorder and card ID is valid", async () => {
                await recordNoRewardWin();

                // Should  have 1 win
                await verifyWinCount(0, 1);
            });
        });
        describe("With ETH Rewards", async () => {
            // Failure cases
            it("should fail when card ID is out of bounds", async () => {
                await expectRevert(
                    recordEthWin(1),
                    "GameRecord: Game record does not exist"
                );
            });
            it("should fail when reward amount is 0", async () => {
                await expectRevert(
                    recordEthWin(0, 0),
                    "GameRecord: Reward amount must be greater than 0 ETH"
                );
                // Should not have any wins or token winnings
                await verifyWinCount(0, 0);
                await verifyEthWinnings(0, 0);
            });
            it("should fail when msg.sender != recorder", async () => {
                await expectRevert(
                    recordEthWin(0, 1, otherAccount),
                    accessControlRevertReason
                );
                // Should not have any wins or ETH winnings
                await verifyWinCount(0, 0);
                await verifyEthWinnings(0, 0);
            });

            // Passing cases
            it("should pass when msg.sender is recorder and card ID is valid", async () => {
                await recordEthWin();

                // Should not have any wins or ETH winnings
                await verifyWinCount(0, 1);
                await verifyEthWinnings(0, 1);
            });
        });
        describe("With Token Rewards", async () => {
            // Failure cases
            it("should fail when card ID is out of bounds", async () => {
                await expectRevert(
                    recordTokenWin(1),
                    "GameRecord: Game record does not exist"
                );
            });
            it("should fail when token address is 0x0", async () => {
                await expectRevert(
                    recordTokenWin(0, 1, constants.ZERO_ADDRESS),
                    "GameRecord: Reward token cannot be 0x0"
                );
                // Should not have any wins or token winnings
                await verifyWinCount(0, 0);
                await verifyTokenWinnings(0, constants.ZERO_ADDRESS, 0);
            });
            it("should fail when reward amount is 0", async () => {
                await expectRevert(
                    recordTokenWin(0, 0),
                    "GameRecord: Reward amount must be greater than 0 tokens"
                );
                // Should not have any wins or token winnings
                await verifyWinCount(0, 0);
                await verifyTokenWinnings(0, context[tokenKey].address, 0);
            });
            it("should fail when msg.sender != recorder", async () => {
                await expectRevert(
                    recordTokenWin(
                        0,
                        1,
                        context[tokenKey].address,
                        otherAccount
                    ),
                    accessControlRevertReason
                );
                // Should not have any wins or token winnings
                await verifyWinCount(0, 0);
                await verifyTokenWinnings(0, context[tokenKey].address, 0);
            });

            // Passing cases
            it("should pass when msg.sender is recorder and card ID is valid", async () => {
                await recordTokenWin();

                // Should not have any wins or ETH winnings
                await verifyWinCount(0, 1);
                await verifyTokenWinnings(0, context[tokenKey].address, 1);
            });
        });
    });

    describe("Recording Game Losses", async () => {
        it("should fail when card ID is out of bounds", async () => {
            await expectRevert(
                recordLoss(1),
                "GameRecord: Game record does not exist"
            );
            // Should not have any wins
            await verifyLossCount(0, 0);
        });
        it("should fail when msg.sender != recorder", async () => {
            await expectRevert(
                recordLoss(0, otherAccount),
                accessControlRevertReason
            );
            // Should not have any wins
            await verifyLossCount(0, 0);
        });

        // Passing cases
        it("should pass when msg.sender is recorder and card ID is valid", async () => {
            await recordLoss();

            // Should  have 1 win
            await verifyLossCount(0, 1);
        });
    });
}

module.exports = { shouldBehaveLikeAdminGameRecord };

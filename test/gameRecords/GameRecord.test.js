const GameRecordMock = artifacts.require("GameRecordMock");
const { expectRevert, constants, BN } = require("@openzeppelin/test-helpers");
require("chai").should();

contract("GameRecord", (accounts) => {
    let gameRecordInstance;
    const [account1, token1, token2] = accounts;

    const createGameRecord = async (id = 0, from = account1) => {
        return await gameRecordInstance.createGameRecord(new BN(id), {
            from: from,
        });
    };

    const recordNoRewardWin = async (id = 0, from = account1) => {
        return await gameRecordInstance.recordNoRewardWin(new BN(id), {
            from: from,
        });
    };

    const recordTokenWin = async (
        id = 0,
        token = token1,
        amount = 1,
        from = account1
    ) => {
        return await gameRecordInstance.recordTokenWin(
            new BN(id),
            token,
            new BN(amount),
            {
                from: from,
            }
        );
    };

    const recordEthWin = async (id = 0, amount = 1, from = account1) => {
        return await gameRecordInstance.recordEthWin(new BN(id), amount, {
            from: from,
        });
    };

    const recordLoss = async (id = 0, from = account1) => {
        return await gameRecordInstance.recordLoss(new BN(id), {
            from: from,
        });
    };

    const verifyGameRecordExists = async (id, bool) => {
        const exists = await gameRecordInstance.gameRecordExists(new BN(id));
        exists.should.be.equal(bool);
    };

    const verifyWinCount = async (id, val) => {
        const wins = await gameRecordInstance.winsFor(new BN(id));
        wins.should.be.bignumber.equal(new BN(val));
    };

    const verifyLossCount = async (id, val) => {
        const losses = await gameRecordInstance.lossesFor(new BN(id));
        losses.should.be.bignumber.equal(new BN(val));
    };

    const verifyTokenWinnings = async (id, token, val) => {
        const winnings = await gameRecordInstance.getTokenWinnings(
            new BN(id),
            token
        );
        winnings.should.be.bignumber.equal(new BN(val));
    };

    const verifyEthWinnings = async (id, val) => {
        const winnings = await gameRecordInstance.getEthWinnings(new BN(id));
        winnings.should.be.bignumber.equal(new BN(val));
    };

    beforeEach(async () => {
        gameRecordInstance = await GameRecordMock.new({ from: account1 });
    });

    describe("Creating Game Record", async () => {
        // Failure case
        it("should fail when ID has already been created", async () => {
            await createGameRecord();
            await verifyGameRecordExists(0, true);
            await expectRevert(
                createGameRecord(),
                "GameRecord: Game record already exists"
            );
        });

        // Passing case
        it("should pass when ID has not been created yet", async () => {
            await createGameRecord();
            await verifyGameRecordExists(0, true);
        });
    });

    describe("Recording Wins (No Rewards)", async () => {
        beforeEach(async () => {
            await createGameRecord();
        });
        // Failure case
        it("should fail when game record ID does not exist", async () => {
            await expectRevert(
                recordNoRewardWin(1),
                "GameRecord: Game record does not exist"
            );

            // Should not have any wins
            await verifyWinCount(0, 0);
        });

        // Passing case
        it("should pass when game record ID exists", async () => {
            await recordNoRewardWin();
            await verifyWinCount(0, 1);
        });
    });

    describe("Recording Wins (ETH Rewards)", async () => {
        beforeEach(async () => {
            await createGameRecord();
        });
        // Failure case
        it("should fail when game record ID does not exist", async () => {
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
            // Should not have any wins or ETH winnings
            await verifyWinCount(0, 0);
            await verifyEthWinnings(0, 0);
        });

        // Passing case
        it("should pass when game record ID exists and amount > 0", async () => {
            await recordEthWin();

            // Should have 1 win ane 1 ETH in winnings
            await verifyWinCount(0, 1);
            await verifyEthWinnings(0, 1);
        });
    });

    describe("Recording Wins (Token Rewards)", async () => {
        beforeEach(async () => {
            await createGameRecord();
        });
        // Failure case
        it("should fail when game record ID does not exist", async () => {
            await expectRevert(
                recordTokenWin(1),
                "GameRecord: Game record does not exist"
            );
        });
        it("should fail when reward token address is 0x0", async () => {
            await expectRevert(
                recordTokenWin(0, constants.ZERO_ADDRESS),
                "GameRecord: Reward token cannot be 0x0"
            );
            // Should not have any wins or token winnings
            await verifyWinCount(0, 0);
            await verifyTokenWinnings(0, token1, 0);
        });
        it("should fail when reward amount is 0", async () => {
            await expectRevert(
                recordTokenWin(0, token1, 0),
                "GameRecord: Reward amount must be greater than 0 tokens"
            );
            // Should not have any wins or token winnings
            await verifyWinCount(0, 0);
            await verifyTokenWinnings(0, token1, 0);
        });

        // Passing case
        it("should pass when params are valid for a single token reward", async () => {
            await recordTokenWin(0, token1, 1);

            // Should have 1 win and 1 token1
            await verifyWinCount(0, 1);
            await verifyTokenWinnings(0, token1, 1);
        });

        it("should pass when params are valid for multiple token rewards", async () => {
            await recordTokenWin(0, token1, 1);
            await recordTokenWin(0, token2, 2);

            // Should have 2 wins, 1 token1, and 2 token2
            await verifyWinCount(0, 2);
            await verifyTokenWinnings(0, token1, 1);
            await verifyTokenWinnings(0, token2, 2);
        });
    });

    describe("Recording Losses", async () => {
        beforeEach(async () => {
            await createGameRecord();
        });
        // Failure case
        it("should fail when game record ID does not exist", async () => {
            await expectRevert(
                recordLoss(1),
                "GameRecord: Game record does not exist"
            );
        });

        // Passing case
        it("should pass when game record ID exists", async () => {
            await recordLoss();
            await verifyLossCount(0, 1);
        });
    });
});

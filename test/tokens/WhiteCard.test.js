const WhiteCard = artifacts.require("WhiteCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN,
    snapshot,
    expectRevert,
    constants,
} = require("@openzeppelin/test-helpers");
require("chai").should();
const { shouldBehaveLikePhlipCard } = require("./PhlipCard.behavior");

const RECORDER = web3.utils.soliditySha3("RECORDER_ROLE");

contract("WhiteCard", (accounts) => {
    const cardAttributes = {
        name: "Phlip White Card",
        symbol: "WPC",
        baseUri: "https.ipfs.moralis.io/ipfs/",
        maxDownVotes: new BN(2),
        maxUriChanges: new BN(1),
        minDaoTokensRequired: new BN(100),
    };

    const context = {};

    const accessControlRevertReason =
        "AccessControl: account " +
        accounts[1].toLowerCase() +
        " is missing role " +
        RECORDER +
        ".";

    const recordNoRewardWin = async (id = 0, from = accounts[0]) => {
        return await context.cardInstance.methods["recordWin(uint256)"](id, {
            from: from,
        });
    };

    const recordEthWin = async (id = 0, amount = 1, from = accounts[0]) => {
        return await context.cardInstance.methods["recordWin(uint256,uint256)"](
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
        token = context.tokenInstance.address,
        from = accounts[0]
    ) => {
        return await context.cardInstance.methods[
            "recordWin(uint256,address,uint256)"
        ](id, token.toLowerCase(), new BN(amount), {
            from: from,
        });
    };

    const recordLoss = async (id = 0, from = accounts[0]) => {
        return await context.cardInstance.recordLoss(id, {
            from: from,
        });
    };

    const verifyWinCount = async (id, val) => {
        const wins = await context.cardInstance.winsFor(id);
        wins.should.be.bignumber.equal(new BN(val));
    };

    const verifyLossCount = async (id, val) => {
        const losses = await context.cardInstance.lossesFor(id);
        losses.should.be.bignumber.equal(new BN(val));
    };

    const verifyTokenWinnings = async (id, token, val) => {
        const winnings = await context.cardInstance.getTokenWinnings(id, token);
        winnings.should.be.bignumber.equal(new BN(val));
    };

    const verifyEthWinnings = async (id, val) => {
        const winnings = await context.cardInstance.getEthWinnings(id);
        winnings.should.be.bignumber.equal(new BN(val));
    };

    before(async () => {
        // Initialize contract state so tests have default cards, claims, etc
        // to interact with throughout the test suite.

        // Create a new contract instance of erc20 and card contracts
        context.tokenInstance = await ERC20Mock.new({ from: accounts[0] });
        context.cardInstance = await WhiteCard.new(
            cardAttributes.baseUri,
            cardAttributes.maxDownVotes,
            cardAttributes.maxUriChanges,
            cardAttributes.minDaoTokensRequired,
            context.tokenInstance.address,
            { from: accounts[0] }
        );

        // fund the deployer account with 10,000 tokens
        await context.tokenInstance.mint(accounts[0], 10000, {
            from: accounts[0],
        });

        // Send some tokens to token holder account
        context.tokenInstance.transfer(accounts[1], new BN(200), {
            from: accounts[0],
        });

        // Mint 1 card to card holder. Card ID is 0.
        await context.cardInstance.mintCard(accounts[2], "base123", {
            from: accounts[0],
        });

        // Creates a claim for two cards. Takes card IDs 1 and 2.
        await context.cardInstance.createClaim(accounts[3], new BN(2), {
            from: accounts[0],
        });
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    shouldBehaveLikePhlipCard(context, cardAttributes, ...accounts);

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
                    recordNoRewardWin(0, accounts[1]),
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
                    recordEthWin(0, 1, accounts[1]),
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
                await verifyTokenWinnings(0, context.tokenInstance.address, 0);
            });
            it("should fail when msg.sender != recorder", async () => {
                await expectRevert(
                    recordTokenWin(
                        0,
                        1,
                        context.tokenInstance.address,
                        accounts[1]
                    ),
                    accessControlRevertReason
                );
                // Should not have any wins or token winnings
                await verifyWinCount(0, 0);
                await verifyTokenWinnings(0, context.tokenInstance.address, 0);
            });

            // Passing cases
            it("should pass when msg.sender is recorder and card ID is valid", async () => {
                await recordTokenWin();

                // Should not have any wins or ETH winnings
                await verifyWinCount(0, 1);
                await verifyTokenWinnings(0, context.tokenInstance.address, 1);
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
                recordLoss(0, accounts[1]),
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
});

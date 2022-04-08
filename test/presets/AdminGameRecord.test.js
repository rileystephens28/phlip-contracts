const AdminGameRecord = artifacts.require("AdminGameRecordMock");
const ERC20Mock = artifacts.require("ERC20Mock");
const { BN, snapshot } = require("@openzeppelin/test-helpers");
const {
    shouldBehaveLikeAdminGameRecord,
} = require("./AdminGameRecord.behavior");

require("chai").should();

contract("AdminGameRecord", (accounts) => {
    const context = {};

    before(async () => {
        // Initialize contract state so tests have default cards, claims, etc
        // to interact with throughout the test suite.

        // Create a new contract instance of erc20 and game recorder contracts
        context.tokenInstance = await ERC20Mock.new({ from: accounts[0] });
        context.gameRecorderInstance = await AdminGameRecord.new({
            from: accounts[0],
        });

        // fund the deployer account with 10,000 tokens
        await context.tokenInstance.mint(accounts[0], 10000, {
            from: accounts[0],
        });

        //Create game record with id 0
        await context.gameRecorderInstance.createGameRecord(new BN(0), {
            from: accounts[0],
        });
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    shouldBehaveLikeAdminGameRecord(
        context,
        "gameRecorderInstance",
        "tokenInstance",
        ...accounts
    );
});

const WhiteCard = artifacts.require("WhiteCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const { BN, snapshot } = require("@openzeppelin/test-helpers");
require("chai").should();
const { shouldBehaveLikePhlipCard } = require("./PhlipCard.behavior");

contract("WhiteCard", (accounts) => {
    const cardAttributes = {
        name: "Phlip White Card",
        symbol: "WPC",
        baseUri: "https.ipfs.moralis.io/ipfs/",
        maxDownvotes: new BN(20),
        maxUriChanges: new BN(5),
        minDaoTokensRequired: new BN(100),
    };

    const context = {};

    before(async () => {
        // Initialize contract state so tests have default cards, claims, etc
        // to interact with throughout the test suite.

        // Create a new contract instance of erc20 and card contracts
        context.tokenInstance = await ERC20Mock.new({ from: accounts[0] });
        context.cardInstance = await WhiteCard.new(
            cardAttributes.baseUri,
            cardAttributes.maxDownvotes,
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
        context.tokenInstance.transfer(accounts[1], new BN(100), {
            from: accounts[0],
        });

        // Mint 1 card to card holder
        await context.cardInstance.mintCard(accounts[2], "test123", {
            from: accounts[0],
        });

        // Create claim for claim holder with amount = 2
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
});

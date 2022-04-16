const PinkCard = artifacts.require("PinkCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const { BN, snapshot } = require("@openzeppelin/test-helpers");
require("chai").should();
const { shouldBehaveLikePhlipCard } = require("./PhlipCard.behavior");

contract("PinkCard", (accounts) => {
    const cardAttributes = {
        name: "Phlip Pink Card",
        symbol: "PPC",
        baseUri: "https.ipfs.moralis.io/ipfs/",
        maxDownVotes: new BN(2),
        maxUriChanges: new BN(1),
        minDaoTokensRequired: new BN(100),
    };

    const context = {};

    before(async () => {
        // Initialize contract state so tests have default cards, claims, etc
        // to interact with throughout the test suite.

        const baseSchedule = {
            cliff: new BN(100),
            duration: new BN(1000),
            rate: new BN(1),
        };
        let receipt;
        context.tokenInstance = await ERC20Mock.new({ from: accounts[0] });
        context.tokenInstance2 = await ERC20Mock.new({ from: accounts[0] });

        // Create a new contract instance of erc20 and card contracts

        context.cardInstance = await PinkCard.new(
            cardAttributes.baseUri,
            cardAttributes.maxDownVotes,
            cardAttributes.maxUriChanges,
            cardAttributes.minDaoTokensRequired,
            context.tokenInstance.address,
            { from: accounts[0] }
        );

        receipt = await context.cardInstance.createVestingSchedule(
            context.tokenInstance.address,
            baseSchedule.cliff,
            baseSchedule.duration,
            baseSchedule.rate,
            {
                from: accounts[0],
            }
        );
        console.log(`Create Vesting Schedule: ${receipt.receipt.gasUsed}`);
        await context.cardInstance.createVestingSchedule(
            context.tokenInstance2.address,
            baseSchedule.cliff,
            baseSchedule.duration,
            baseSchedule.rate,
            {
                from: accounts[0],
            }
        );

        receipt = await context.cardInstance.setVestingSchedule([0, 1]);
        console.log(`Set Vesting Schedule: ${receipt.receipt.gasUsed}`);

        // fund the deployer account with 10,000 tokens
        receipt = await context.tokenInstance.mint(accounts[0], 10000, {
            from: accounts[0],
        });
        console.log(`Mint ERC20: ${receipt.receipt.gasUsed}`);

        receipt = await context.tokenInstance2.mint(accounts[0], 10000, {
            from: accounts[0],
        });

        receipt = await context.tokenInstance.approve(
            context.cardInstance.address,
            new BN(1000),
            { from: accounts[0] }
        );
        console.log(`Approve ERC20: ${receipt.receipt.gasUsed}`);

        receipt = await context.tokenInstance2.approve(
            context.cardInstance.address,
            new BN(1000),
            { from: accounts[0] }
        );

        receipt = await context.cardInstance.fillReserves(0, new BN(1000), {
            from: accounts[0],
        });
        console.log(`Fill Schedule Reserves: ${receipt.receipt.gasUsed}`);

        receipt = await context.cardInstance.fillReserves(1, new BN(1000), {
            from: accounts[0],
        });

        // Send some tokens to token holder account
        receipt = await context.tokenInstance.transfer(
            accounts[1],
            new BN(200),
            {
                from: accounts[0],
            }
        );

        console.log(`Transfer ERC20: ${receipt.receipt.gasUsed}`);
        // Mint 1 card to card holder
        receipt = await context.cardInstance.mintCard(accounts[2], "base123", {
            from: accounts[0],
            gas: 9000000,
        });
        console.log(`Mint Card: ${receipt.receipt.gasUsed}`);

        // await context.cardInstance.createClaim(accounts[3], new BN(2), {
        //     from: accounts[0],
        // });
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    shouldBehaveLikePhlipCard(context, cardAttributes, ...accounts);
});

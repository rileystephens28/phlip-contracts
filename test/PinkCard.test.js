const PhlipDAO = artifacts.require("PhlipDAO");
const PinkCard = artifacts.require("PinkCard");

require("chai").should();
const utils = require("./utils.js");

contract("PinkCard", (accounts) => {
    const _name = "Phlip Pink Card";
    const _symbol = "PPC";
    const _baseUri = "https.ipfs.moralis.io/ipfs/";
    const _maxDownvotes = 20;
    const _maxUriChanges = 5;
    const _minDaoTokensRequired = 100;

    const MINTER_ACCOUNT = accounts[0];
    const PAUSER_ACCOUNT = accounts[0];
    const BLOCKER_ACCOUNT = accounts[0];
    const NO_ROLL_ACCOUNT = accounts[0];

    before(async () => {
        this.phlipDaoToken = await PhlipDAO.new("PhlipDAO", "PHLIP");
    });

    beforeEach(async () => {
        this.token = await PinkCard.new(
            _baseUri,
            _maxDownvotes,
            _maxUriChanges,
            _minDaoTokensRequired,
            this.phlipDaoToken.address,
            { from: accounts[0] }
        );
    });

    describe.skip("Token Attributes", () => {
        it("has the correct name", async () => {
            const name = await this.token.name();
            name.should.equal(_name);
        });

        it("has the correct symbol", async () => {
            const symbol = await this.token.symbol();
            symbol.should.equal(_symbol);
        });

        it("has the correct base URI", async () => {
            const baseUri = await this.token.BASE_URI.call();
            baseUri.should.equal(_baseUri);
        });

        it("has the correct max allowed downvotes", async () => {
            const maxDownvotes = await this.token.MAX_DOWNVOTES.call();
            maxDownvotes.toString().should.equal(_maxDownvotes.toString());
        });

        it("has the correct max allowed URI changes", async () => {
            const maxUriChanges = await this.token.MAX_URI_CHANGES.call();
            maxUriChanges.toString().should.equal(_maxUriChanges.toString());
        });

        it("has the correct min DAO token requirement", async () => {
            const minDaoTokensRequired =
                await this.token.MIN_DAO_TOKENS_REQUIRED.call();
            minDaoTokensRequired
                .toString()
                .should.equal(_minDaoTokensRequired.toString());
        });
    });

    describe.skip("Setter Functions", () => {
        const SETTER = accounts[0];

        it("should set base URI for cards", async () => {
            // Set base URI
            const newBaseUri = "https://test.com/";
            await this.token.setBaseURI(newBaseUri, { from: SETTER });

            // URI should equal new URI
            const uri = await this.token.BASE_URI.call();
            uri.should.equal(newBaseUri);
        });
        it("should set max number of allowed downvotes per card", async () => {
            // Set max downvotes
            const newMax = 200;
            await this.token.setDownVoteMax(newMax, { from: SETTER });

            // Max should equal new max (compare as strings to avoid big number issues)
            const maxDownVotes = await this.token.MAX_DOWNVOTES.call();
            maxDownVotes.toString().should.equal(newMax.toString());
        });
        it("should set max number of allowed URI changes per card", async () => {
            // Set max uri changes
            const newMax = 10;
            await this.token.setUriChangeMax(newMax, { from: SETTER });

            // Max should equal new max (compare as strings to avoid big number issues)
            const maxUriChanges = await this.token.MAX_URI_CHANGES.call();
            maxUriChanges.toString().should.equal(newMax.toString());
        });
        it("should set min number of DAO tokens required to vote", async () => {
            // Set min require DAO tokens
            const newMin = 200;
            await this.token.setMinDaoTokensRequired(newMin, { from: SETTER });

            // Min should equal new min (compare as strings to avoid big number issues)
            const minTokensRequired =
                await this.token.MIN_DAO_TOKENS_REQUIRED.call();
            minTokensRequired.toString().should.equal(newMin.toString());
        });
    });

    describe.skip("Pausing Tranfers", () => {
        const PAUSER = accounts[0];
        const NON_PAUSER = accounts[1];

        it("should allow PAUSER to pause transfers", async () => {
            // Contract should not be paused
            let isPaused = await this.token.paused();
            isPaused.should.equal(false);

            // Pause the contract
            await this.token.pause({ from: PAUSER });

            // Contract should be paused
            isPaused = await this.token.paused();
            isPaused.should.equal(true);
        });
        it("should prevent non-PAUSER from pausing transfers", async () => {
            // Contract should not be paused
            let isPaused = await this.token.paused();
            isPaused.should.equal(false);
            try {
                // Attempt to pause the contract
                await this.token.pause({ from: NON_PAUSER });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Contract should still not be paused
            isPaused = await this.token.paused();
            isPaused.should.equal(false);
        });
        it("should allow PAUSER to unpause transfers", async () => {
            // Pause the contract
            await this.token.pause({ from: PAUSER });
            let isPaused = await this.token.paused();
            isPaused.should.equal(true);

            // Unpause the contract
            await this.token.unpause({ from: PAUSER });

            // Contract should be un paused
            isPaused = await this.token.paused();
            isPaused.should.equal(false);
        });
        it("should prevent non-PAUSER from unpausing transfers", async () => {
            // Pause the contract
            await this.token.pause({ from: PAUSER });
            let isPaused = await this.token.paused();
            isPaused.should.equal(true);

            try {
                // Attempt to unpause the contract
                await this.token.unpause({ from: NON_PAUSER });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Contract should still be paused
            isPaused = await this.token.paused();
            isPaused.should.equal(true);
        });
    });

    describe.skip("Blocking Addresses", () => {
        const BLOCKER = accounts[0];
        const NON_BLOCKER = accounts[1];
        const account = accounts[2];

        it("should allow BLOCKER to blacklist address", async () => {
            // Address should not be blacklisted
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);

            // Blacklist the address
            await this.token.blacklistAddress(account, { from: BLOCKER });

            // Address should be blacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);
        });
        it("should prevent non-BLOCKER from blacklisting address", async () => {
            // Address should not be blacklisted
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);

            try {
                // Attempt to blacklist the address
                await this.token.blacklistAddress(account, {
                    from: NON_BLOCKER,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Address should still not be blacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);
        });
        it("should allow BLOCKER to unblacklist address", async () => {
            // Blacklist the address
            await this.token.blacklistAddress(account, { from: BLOCKER });
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);

            // Unlacklist the address
            await this.token.unblacklistAddress(account, { from: BLOCKER });

            // Address should be unblacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);
        });
        it("should prevent non-BLOCKER from unblacklisting address", async () => {
            // Blacklist the address
            await this.token.blacklistAddress(account, { from: BLOCKER });
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);

            try {
                // Attempt to unblacklist the address
                await this.token.unblacklistAddress(account, {
                    from: NON_BLOCKER,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Address should still be blacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);
        });
    });

    describe("Claiming and Minting", () => {
        const MINTER_ACCOUNT = accounts[0];
        const NON_MINTER = accounts[1];
        const account = accounts[2];

        //  Minting Cards
        it("should allow MINTER_ACCOUNT to mint a new card to an address", async () => {
            // Account should 0 cards
            utils.tokenBalanceCheck(this.token, account, 0);

            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });

            // Account should have 1 card
            utils.tokenBalanceCheck(this.token, account, 2);
        });
        it("should prevent NO_ROLE_ACCOUNT from minting a new card to an address", async () => {
            // Account should 0 cards
            let accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");

            try {
                // Attempt to mint a card
                await this.token.mintCard(account, "test123", {
                    from: NON_MINTER,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have no cards
            accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");
        });

        //  Creating Claiming
        it("should allow MINTER_ACCOUNT to create a new claim", async () => {
            // Account should 0 claimable cards
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");

            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 card
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("1");
        });
        it("should prevent non-MINTER_ACCOUNT from creating a new claim", async () => {
            // Account should 0 claimable cards
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");

            try {
                // Attempt to mint a card
                await this.token.createClaim(account, 1, { from: NON_MINTER });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still 0 claimable cards
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");
        });

        // Increasing Claims
        it("should allow MINTER_ACCOUNT to increase claimable amount of existing claim", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 claimable card
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("1");

            await this.token.increaseClaim(account, 2, {
                from: MINTER_ACCOUNT,
            });

            // Account should have 3 claimable cards
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("3");
        });
        it("should prevent non-MINTER_ACCOUNT from increasing claimable amount of existing claim", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 claimable card
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("1");

            try {
                // Attempt to mint a card
                await this.token.increaseClaim(account, 2, {
                    from: NON_MINTER,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have 1 claimable card
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("1");
        });

        // Redeeming Claims
        it("should allow address with multiple claims to redeem card", async () => {
            // Create a claim
            await this.token.createClaim(account, 5, { from: MINTER_ACCOUNT });

            // Account should have a registered claim
            let hasClaim = await this.token.hasClaim(account);
            hasClaim.should.equal(true);

            // Account should have 5 claimable card
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("5");

            // Account should have 0 cards
            let accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");

            await this.token.redeemCard("test123", { from: account });

            // Account should still have a registered claim
            hasClaim = await this.token.hasClaim(account);
            hasClaim.should.equal(true);

            // Account should have 4 claimable cards
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("4");

            // Account should have 1 card
            accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("1");
        });
        it("should allow address with 1 claim to redeem card", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have a registered claim
            let hasClaim = await this.token.hasClaim(account);
            hasClaim.should.equal(true);

            // Account should have 1 claimable card
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("1");

            // Account should have 0 cards
            let accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");

            await this.token.redeemCard("test123", { from: account });

            // Account should not have a registered claim
            hasClaim = await this.token.hasClaim(account);
            hasClaim.should.equal(false);

            // Account should have 0 claimable cards
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");

            // Account should have 1 card
            accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("1");
        });
        it("should prevent address without claim from redeeming card", async () => {
            // Account should have 0 claimable cards
            let remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");

            // Account should have 0 cards
            let accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");

            try {
                // Attempt to redeem a card
                await this.token.redeemCard("test123", { from: account });
            } catch (error) {
                // Expect not beneficiary exception to be thrown
                error.message.should.includes("not a beneficiary");
            }

            // Account should still have 0 claimable cards
            remainingClaims = await this.token.remainingClaims(account);
            remainingClaims.toString().should.equal("0");

            // Account should still have 0 cards
            accountBalance = await this.token.balanceOf(account);
            accountBalance.toString().should.equal("0");
        });
    });
});

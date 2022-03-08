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
    const NO_ROLL_ACCOUNT = accounts[1];
    const DAO_TOKEN_HOLDER_ACCOUNT = accounts[2];
    const account = accounts[3];

    before(async () => {
        this.phlipDaoToken = await PhlipDAO.new("PhlipDAO", "PHLIP");
        this.phlipDaoToken.transfer(
            DAO_TOKEN_HOLDER_ACCOUNT,
            _minDaoTokensRequired + 10
        );
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

    describe("Token Attributes", () => {
        it("has the correct name", async () => {
            await utils.tokenFnEqualCheck(this.token, "name", _name);
        });

        it("has the correct symbol", async () => {
            await utils.tokenFnEqualCheck(this.token, "symbol", _symbol);
            const symbol = await this.token.symbol();
            symbol.should.equal(_symbol);
        });

        it("has the correct base URI", async () => {
            await utils.tokenVarEqualCheck(this.token, "BASE_URI", _baseUri);
        });

        it("has the correct max allowed downvotes", async () => {
            await utils.tokenNumEqualCheck(
                this.token,
                "MAX_DOWNVOTES",
                _maxDownvotes
            );
        });

        it("has the correct max allowed URI changes", async () => {
            await utils.tokenNumEqualCheck(
                this.token,
                "MAX_URI_CHANGES",
                _maxUriChanges
            );
        });

        it("has the correct min DAO token requirement", async () => {
            await utils.tokenNumEqualCheck(
                this.token,
                "MIN_DAO_TOKENS_REQUIRED",
                _minDaoTokensRequired
            );
        });
    });

    describe("Setter Functions", () => {
        it("should set base URI for cards", async () => {
            // Set base URI
            const newBaseUri = "https://test.com/";
            await this.token.setBaseURI(newBaseUri, { from: MINTER_ACCOUNT });

            // URI should equal new URI
            await utils.tokenVarEqualCheck(this.token, "BASE_URI", newBaseUri);
        });
        it("should set max number of allowed downvotes per card", async () => {
            // Set max downvotes
            const newMax = 200;
            await this.token.setDownVoteMax(newMax, { from: MINTER_ACCOUNT });

            // Max should equal new max
            await utils.tokenNumEqualCheck(this.token, "MAX_DOWNVOTES", newMax);
        });
        it("should set max number of allowed URI changes per card", async () => {
            // Set max uri changes
            const newMax = 10;
            await this.token.setUriChangeMax(newMax, { from: MINTER_ACCOUNT });

            // Max should equal new max
            await utils.tokenNumEqualCheck(
                this.token,
                "MAX_URI_CHANGES",
                newMax
            );
        });
        it("should set min number of DAO tokens required to vote", async () => {
            // Set min require DAO tokens
            const newMin = 300;
            await this.token.setMinDaoTokensRequired(newMin, {
                from: MINTER_ACCOUNT,
            });

            // Min should equal new min
            await utils.tokenNumEqualCheck(
                this.token,
                "MIN_DAO_TOKENS_REQUIRED",
                newMin
            );
        });
    });

    describe("Pausing Tranfers", () => {
        it("should allow PAUSER to pause & unpause transfers", async () => {
            // Pause the contract
            await this.token.pause({ from: PAUSER_ACCOUNT });

            // Contract should be paused
            await utils.tokenFnEqualCheck(this.token, "paused", true);

            // Unpause the contract
            await this.token.unpause({ from: PAUSER_ACCOUNT });

            // Contract should be unpaused
            await utils.tokenFnEqualCheck(this.token, "paused", false);
        });
        it("should prevent non-PAUSER from pausing transfers", async () => {
            // Contract should not be paused
            await utils.tokenFnEqualCheck(this.token, "paused", false);

            try {
                // Attempt to pause the contract
                await this.token.pause({ from: NO_ROLL_ACCOUNT });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Contract should still not be paused
            await utils.tokenFnEqualCheck(this.token, "paused", false);
        });

        it("should prevent non-PAUSER from unpausing transfers", async () => {
            // Pause the contract
            await this.token.pause({ from: PAUSER_ACCOUNT });

            // Contract should be paused
            await utils.tokenFnEqualCheck(this.token, "paused", true);

            try {
                // Attempt to unpause the contract
                await this.token.unpause({ from: NO_ROLL_ACCOUNT });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Contract should still be paused
            await utils.tokenFnEqualCheck(this.token, "paused", true);
        });
    });

    describe("Blocking Addresses", () => {
        it("should allow BLOCKER to blacklist & unblacklist address", async () => {
            // Blacklist the address
            await this.token.blacklistAddress(account, {
                from: BLOCKER_ACCOUNT,
            });

            // Address should be blacklisted
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);

            // Unblacklist the address
            await this.token.unblacklistAddress(account, {
                from: BLOCKER_ACCOUNT,
            });

            // Address should be unblacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);
        });
        it("should prevent non-BLOCKER from blacklisting address", async () => {
            // Address should not be blacklisted
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);

            try {
                // Attempt to blacklist the address
                await this.token.blacklistAddress(account, {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Address should still not be blacklisted
            isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(false);
        });

        it("should prevent non-BLOCKER from unblacklisting address", async () => {
            // Blacklist the address
            await this.token.blacklistAddress(account, {
                from: BLOCKER_ACCOUNT,
            });
            let isBlacklisted = await this.token.isBlacklisted(account);
            isBlacklisted.should.equal(true);

            try {
                // Attempt to unblacklist the address
                await this.token.unblacklistAddress(account, {
                    from: NO_ROLL_ACCOUNT,
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
        //  Minting Cards
        it("should allow MINTER_ACCOUNT to mint a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);

            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.token, account, 1);
        });
        it("should prevent NO_ROLE_ACCOUNT from minting a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);

            try {
                // Attempt to mint a card
                await this.token.mintCard(account, "test123", {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have no cards
            await utils.tokenBalanceCheck(this.token, account, 0);
        });

        //  Creating Claiming
        it("should allow MINTER_ACCOUNT to create a new claim", async () => {
            // Account should 0 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 0);

            // Create claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 card
            await utils.tokenRemainingClaimCheck(this.token, account, 1);
        });
        it("should prevent non-MINTER_ACCOUNT from creating a new claim", async () => {
            // Account should 0 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 0);

            try {
                // Attempt to mint a card
                await this.token.createClaim(account, 1, {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still 0 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 0);
        });

        // Increasing Claims
        it("should allow MINTER_ACCOUNT to increase claimable amount of existing claim", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 1);

            await this.token.increaseClaim(account, 2, {
                from: MINTER_ACCOUNT,
            });

            // Account should have 3 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 3);
        });
        it("should prevent non-MINTER_ACCOUNT from increasing claimable amount of existing claim", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 1);

            try {
                // Attempt to mint a card
                await this.token.increaseClaim(account, 2, {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have 1 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 1);
        });

        // Redeeming Claims
        it("should allow address with multiple claims to redeem card", async () => {
            // Create a claim
            await this.token.createClaim(account, 5, { from: MINTER_ACCOUNT });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, true);

            // Account should have 5 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 5);

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);

            // Redeem the card
            await this.token.redeemCard("test123", { from: account });

            // Account should still have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, true);

            // Account should have 4 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 4);

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.token, account, 1);
        });
        it("should allow address with 1 claim to redeem card", async () => {
            // Create a claim
            await this.token.createClaim(account, 1, { from: MINTER_ACCOUNT });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, true);

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 1);

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);

            // Redeem the card
            await this.token.redeemCard("test123", { from: account });

            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, false);

            // Account should have 0 claimable cards
            await utils.tokenRemainingClaimCheck(this.token, account, 0);

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.token, account, 1);
        });
        it("should prevent address without claim from redeeming card", async () => {
            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, false);

            // Account should have 0 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 0);

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);

            try {
                // Attempt to redeem a card
                await this.token.redeemCard("test123", { from: account });
            } catch (error) {
                // Expect not beneficiary exception to be thrown
                error.message.should.includes("not a beneficiary");
            }

            // Account should still not have a registered claim
            await utils.tokenHasClaimCheck(this.token, account, false);

            // Account should still have 0 claimable card
            await utils.tokenRemainingClaimCheck(this.token, account, 0);

            // Account should still have 0 cards
            await utils.tokenBalanceCheck(this.token, account, 0);
        });
    });

    describe("Up/Down Voting", () => {
        //  PhlipDAO Vote on Existing Cards
        const mintedCardId = 0;

        it("should allow phlipDAO holder to up vote existing card", async () => {
            // Mint a card
            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });

            // DAO holder casts up vote
            await this.token.upVote(mintedCardId, {
                from: DAO_TOKEN_HOLDER_ACCOUNT,
            });

            // Card should have 1 up vote
            const upVotes = await this.token.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("1");
        });
        it("should allow phlipDAO holder to down vote existing card", async () => {
            // Mint a card
            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });

            // DAO holder casts down vote
            await this.token.downVote(mintedCardId, {
                from: DAO_TOKEN_HOLDER_ACCOUNT,
            });

            // Card should have 1 down vote
            const upVotes = await this.token.downVotesFor(mintedCardId);
            upVotes.toString().should.equal("1");
        });

        // Non-PhlipDAO Attemptig to Vote
        it("should prevent non-phlipDAO holder from up voting", async () => {
            // Mint a card
            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });
            try {
                // non-DAO holder attemptes to cast up vote
                await this.token.upVote(mintedCardId, {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {}
            // Card should have 0 up votes
            const upVotes = await this.token.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("0");
        });
        it("should prevent non-phlipDAO holder from down voting", async () => {
            // Mint a card
            await this.token.mintCard(account, "test123", {
                from: MINTER_ACCOUNT,
            });
            try {
                // non-DAO holder attemptes to cast down vote
                await this.token.downVote(mintedCardId, {
                    from: NO_ROLL_ACCOUNT,
                });
            } catch (error) {}
            // Card should have 0 down votes
            const upVotes = await this.token.downVotesFor(mintedCardId);
            upVotes.toString().should.equal("0");
        });

        //  PhlipDAO Vote on Non-Existing Cards
        it("should prevent phlipDAO holder from up voting non-existant card", async () => {
            let voteFailed = false;
            try {
                // DAO holder casts down vote
                await this.token.upVote(mintedCardId, {
                    from: DAO_TOKEN_HOLDER_ACCOUNT,
                });
            } catch (error) {
                voteFailed = true;
            }
            voteFailed.should.equal(true);
        });
        it("should prevent phlipDAO holder from down voting non-existant card", async () => {
            let voteFailed = false;
            try {
                // DAO holder casts down vote
                await this.token.downVote(mintedCardId, {
                    from: DAO_TOKEN_HOLDER_ACCOUNT,
                });
            } catch (error) {
                voteFailed = true;
            }
            voteFailed.should.equal(true);
        });
    });
});

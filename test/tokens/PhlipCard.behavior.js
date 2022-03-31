const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    snapshot,
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();
const utils = require("../utils/token");

function shouldBehaveLikePhlipCard(initialAttr, accounts) {
    const minter = (pauser = blocker = accounts[0]);
    const tokenHolder = accounts[1];
    const otherAccount = accounts[2];

    const verifyBaseUri = async (val) => {
        const baseUri = await this.cardInstance.BASE_URI();
        baseUri.should.be.equal(val);
    };

    const verifyMaxDownvotes = async (val) => {
        const maxDownvotes = await this.cardInstance.MAX_DOWNVOTES();
        maxDownvotes.should.be.bignumber.equal(val);
    };

    const verifyMaxUriChanges = async (val) => {
        const maxUriChanges = await this.cardInstance.MAX_URI_CHANGES();
        maxUriChanges.should.be.bignumber.equal(val);
    };

    const verifyMinTokenReq = async (val) => {
        const minDaoTokensRequired =
            await this.cardInstance.MIN_DAO_TOKENS_REQUIRED();
        minDaoTokensRequired.should.be.bignumber.equal(val);
    };

    const verifyPause = async (bool) => {
        const paused = await this.cardInstance.paused();
        paused.should.be.equal(bool);
    };

    const verifyBlacklisted = async (address, bool) => {
        const blacklisted = await this.cardInstance.isBlacklisted(address);
        blacklisted.should.be.equal(bool);
    };

    const getRoleRevertReason = (account, role) => {
        return (
            "AccessControl: account " +
            account.toLowerCase() +
            " is missing role " +
            role +
            "."
        );
    };

    describe("Token Attributes", () => {
        console.log("YEE", this.cardInstance);

        it("has the correct name", async function () {
            console.log("WEE1", this.cardInstance);

            const name = await this.cardInstance.name();
            name.should.equal(initialAttr.name);
        });

        it("has the correct symbol", async () => {
            const symbol = await this.cardInstance.symbol();
            symbol.should.equal(initialAttr.symbol);
        });

        it("has the correct base URI", async () => {
            await verifyBaseUri(initialAttr.baseUri);
        });

        it("has the correct max allowed downvotes", async () => {
            await verifyMaxDownvotes(initialAttr.maxDownvotes);
        });

        it("has the correct max allowed URI changes", async () => {
            await verifyMaxUriChanges(initialAttr.maxUriChanges);
        });

        it("has the correct min DAO token requirement", async () => {
            await verifyMinTokenReq(initialAttr.minDaoTokensRequired);
        });
    });

    describe("Setter Functions", () => {
        const newBaseUri = "https://test.com/";
        const newMaxDownvotes = 200;
        const newMaxUriChanges = 10;
        const newMinTokenReq = 300;
        const revertReason = getRoleRevertReason(otherAccount, this.minterRole);

        // Failing cases
        it("should fail to set base URI for cards when msg.sender != minter", async () => {
            // Set base URI
            await expectRevert(
                this.cardInstance.setBaseUri(newBaseUri, {
                    from: otherAccount,
                }),
                revertReason
            );

            // URI should still equal initial base URI
            await verifyBaseUri(initialAttr.baseUri);
        });
        it("should fail to set max number of allowed downvotes per card when msg.sender != minter", async () => {
            // Set max downvotes
            await expectRevert(
                this.cardInstance.setMaxDownvotes(newMaxDownvotes, {
                    from: otherAccount,
                }),
                revertReason
            );
            // Max downvotes should still equal initial max downvotes
            await verifyMaxDownvotes(initialAttr.maxDownvotes);
        });
        it("should fail to set max number of allowed URI changes per card when msg.sender != minter", async () => {
            // Set max uri changes
            await expectRevert(
                this.cardInstance.setMaxUriChanges(newMaxUriChanges, {
                    from: otherAccount,
                }),
                revertReason
            );
            // Max uri changes should still equal initial max uri changes
            await verifyMaxUriChanges(initialAttr.maxUriChanges);
        });
        it("should fail to set min number of DAO tokens required to vote when msg.sender != minter", async () => {
            // Set min require DAO tokens
            await expectRevert(
                this.cardInstance.setMinDaoTokensRequired(newMinTokenReq, {
                    from: otherAccount,
                }),
                revertReason
            );
            // Min DAO tokens required should still equal initial min DAO tokens required
            await verifyMinTokenReq(initialAttr.minDaoTokensRequired);
        });

        // Passing cases
        it("should set base URI for cards when msg.sender = minter", async () => {
            // Set base URI
            await this.cardInstance.setBaseURI(newBaseUri, { from: minter });

            // URI should equal new URI
            await verifyBaseUri(newBaseUri);
        });
        it("should set max number of allowed downvotes per card when msg.sender = minter", async () => {
            // Set max downvotes
            await this.cardInstance.setDownVoteMax(newMaxDownvotes, {
                from: minter,
            });

            // Max should equal new max
            await verifyMaxDownvotes(newMaxDownvotes);
        });
        it("should set max number of allowed URI changes per card when msg.sender = minter", async () => {
            // Set max uri changes
            await this.cardInstance.setUriChangeMax(newMaxUriChanges, {
                from: minter,
            });

            // Max should equal new max
            await verifyMaxUriChanges(newMaxUriChanges);
        });
        it("should set min number of DAO tokens required to vote", async () => {
            // Set min require DAO tokens
            await this.cardInstance.setMinDaoTokensRequired(newMinTokenReq, {
                from: minter,
            });

            // Min should equal new min
            await verifyMinTokenReq(newMinTokenReq);
        });
    });

    describe("Pausing Tranfers", () => {
        const revertReason = getRoleRevertReason(otherAccount, this.pauserRole);
        // Failing cases
        it("should fail to pause when msg.sender != pauser", async () => {
            expectRevert(
                this.cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should not be paused
            await verifyPause(false);
        });

        it("should fail to unpause when msg.sender != pauser", async () => {
            // Pause the contract
            await this.cardInstance.pause({ from: pauser });

            // Contract should be paused
            await verifyPause(true);

            expectRevert(
                this.cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should still be paused
            await verifyPause(true);
        });

        // Passing cases
        it("should pause/unpause when msg.sender = pauser", async () => {
            // Pause the contract
            await this.cardInstance.pause({ from: pauser });

            // Contract should be paused
            await verifyPause(true);

            // Unpause the contract
            await this.cardInstance.unpause({ from: pauser });

            // Contract should be unpaused
            await verifyPause(false);
        });
    });

    describe("Blocking Addresses", () => {
        const revertReason = getRoleRevertReason(
            otherAccount,
            this.blockerRole
        );
        // Failing cases
        it("should fail to blacklist when msg.sender != blocker", async () => {
            expectRevert(
                this.cardInstance.blacklistAddress(tokenHolder, {
                    from: otherAccount,
                }),
                revertReason
            );

            // Contract should not be paused
            await verifyBlacklisted(tokenHolder, false);
        });

        it("should fail to unblacklist when msg.sender != blocker", async () => {
            // Blacklist address
            await this.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            expectRevert(
                this.cardInstance.unblacklistAddress(tokenHolder, {
                    from: otherAccount,
                }),
                revertReason
            );

            // Contract should not be paused
            await verifyBlacklisted(tokenHolder, true);
        });

        // Passing cases
        it("should blacklist/unblacklist when msg.sender = blocker", async () => {
            // Blacklist address
            await this.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            // Unblacklist address
            await this.cardInstance.unblacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should not be blacklisted
            await verifyBlacklisted(tokenHolder, false);
        });
    });

    describe.skip("Minting Cards", () => {
        // Failing cases
        it("should fail to mint when msg.sender != blocker", async () => {
            expectRevert(
                this.cardInstance.blacklistAddress(tokenHolder, {
                    from: otherAccount,
                }),
                revertReason
            );

            // Contract should not be paused
            await verifyBlacklisted(tokenHolder, false);
        });

        //  Minting Cards
        it("should allow minter to mint a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 1);
        });
        it("should prevent NO_ROLE_ACCOUNT from minting a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            try {
                // Attempt to mint a card
                await this.cardInstance.mintCard(otherAccount, "test123", {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have no cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);
        });
    });

    describe.skip("Claiming and Minting", () => {
        //  Minting Cards
        it("should allow minter to mint a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 1);
        });
        it("should prevent NO_ROLE_ACCOUNT from minting a new card to an address", async () => {
            // Account should 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            try {
                // Attempt to mint a card
                await this.cardInstance.mintCard(otherAccount, "test123", {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have no cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);
        });

        //  Creating Claiming
        it("should allow minter to create a new claim", async () => {
            // Account should 0 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );

            // Create claim
            await this.cardInstance.createClaim(otherAccount, 1, {
                from: minter,
            });

            // Account should have 1 card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                1
            );
        });
        it("should prevent non-minter from creating a new claim", async () => {
            // Account should 0 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );

            try {
                // Attempt to mint a card
                await this.cardInstance.createClaim(otherAccount, 1, {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still 0 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );
        });

        // Increasing Claims
        it("should allow minter to increase claimable amount of existing claim", async () => {
            // Create a claim
            await this.cardInstance.createClaim(otherAccount, 1, {
                from: minter,
            });

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                1
            );

            await this.cardInstance.increaseClaim(otherAccount, 2, {
                from: minter,
            });

            // Account should have 3 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                3
            );
        });
        it("should prevent non-minter from increasing claimable amount of existing claim", async () => {
            // Create a claim
            await this.cardInstance.createClaim(otherAccount, 1, {
                from: minter,
            });

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                1
            );

            try {
                // Attempt to mint a card
                await this.cardInstance.increaseClaim(otherAccount, 2, {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect missing role exception to be thrown
                error.message.should.includes("missing role");
            }

            // Account should still have 1 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                1
            );
        });

        // Redeeming Claims
        it("should allow address with multiple claims to redeem card", async () => {
            // Create a claim
            await this.cardInstance.createClaim(otherAccount, 5, {
                from: minter,
            });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                true
            );

            // Account should have 5 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                5
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            // Redeem the card
            await this.cardInstance.redeemCard("test123", {
                from: otherAccount,
            });

            // Account should still have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                true
            );

            // Account should have 4 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                4
            );

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 1);
        });
        it("should allow address with 1 claim to redeem card", async () => {
            // Create a claim
            await this.cardInstance.createClaim(otherAccount, 1, {
                from: minter,
            });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                true
            );

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                1
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            // Redeem the card
            await this.cardInstance.redeemCard("test123", {
                from: otherAccount,
            });

            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                false
            );

            // Account should have 0 claimable cards
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );

            // Account should have 1 card
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 1);
        });
        it("should prevent address without claim from redeeming card", async () => {
            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                false
            );

            // Account should have 0 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);

            try {
                // Attempt to redeem a card
                await this.cardInstance.redeemCard("test123", {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect not beneficiary exception to be thrown
                error.message.should.includes("not a beneficiary");
            }

            // Account should still not have a registered claim
            await utils.tokenHasClaimCheck(
                this.cardInstance,
                otherAccount,
                false
            );

            // Account should still have 0 claimable card
            await utils.tokenRemainingClaimCheck(
                this.cardInstance,
                otherAccount,
                0
            );

            // Account should still have 0 cards
            await utils.tokenBalanceCheck(this.cardInstance, otherAccount, 0);
        });
    });

    describe.skip("Up/Down Voting", () => {
        //  PhlipDAO Vote on Existing Cards
        const mintedCardId = 0;

        it("should allow phlipDAO holder to up vote existing card", async () => {
            // Mint a card
            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // DAO holder casts up vote
            await this.cardInstance.upVote(mintedCardId, {
                from: tokenHolder,
            });

            // Card should have 1 up vote
            const upVotes = await this.cardInstance.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("1");
        });
        it("should allow phlipDAO holder to down vote existing card", async () => {
            // Mint a card
            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // DAO holder casts down vote
            await this.cardInstance.downVote(mintedCardId, {
                from: tokenHolder,
            });

            // Card should have 1 down vote
            const upVotes = await this.cardInstance.downVotesFor(mintedCardId);
            upVotes.toString().should.equal("1");
        });

        // Non-PhlipDAO Attemptig to Vote
        it("should prevent non-phlipDAO holder from up voting", async () => {
            // Mint a card
            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });
            try {
                // non-DAO holder attemptes to cast up vote
                await this.cardInstance.upVote(mintedCardId, {
                    from: otherAccount,
                });
            } catch (error) {}
            // Card should have 0 up votes
            const upVotes = await this.cardInstance.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("0");
        });
        it("should prevent non-phlipDAO holder from down voting", async () => {
            // Mint a card
            await this.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });
            try {
                // non-DAO holder attemptes to cast down vote
                await this.cardInstance.downVote(mintedCardId, {
                    from: otherAccount,
                });
            } catch (error) {}
            // Card should have 0 down votes
            const upVotes = await this.cardInstance.downVotesFor(mintedCardId);
            upVotes.toString().should.equal("0");
        });

        //  PhlipDAO Vote on Non-Existing Cards
        it("should prevent phlipDAO holder from up voting non-existant card", async () => {
            let voteFailed = false;
            try {
                // DAO holder casts down vote
                await this.cardInstance.upVote(mintedCardId, {
                    from: tokenHolder,
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
                await this.cardInstance.downVote(mintedCardId, {
                    from: tokenHolder,
                });
            } catch (error) {
                voteFailed = true;
            }
            voteFailed.should.equal(true);
        });
    });
}

module.exports = { shouldBehaveLikePhlipCard };

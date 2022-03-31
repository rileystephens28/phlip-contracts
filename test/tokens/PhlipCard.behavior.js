const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();
const utils = require("../utils/token");

const MINTER = web3.utils.soliditySha3("MINTER_ROLE");
const PAUSER = web3.utils.soliditySha3("PAUSER_ROLE");
const BLOCKER = web3.utils.soliditySha3("BLOCKER_ROLE");

function shouldBehaveLikePhlipCard(
    context,
    initialAttr,
    admin,
    tokenHolder,
    cardHolder,
    claimHolder,
    otherAccount
) {
    const minter = admin;
    const pauser = admin;
    const blocker = admin;
    baseCid = "test123";

    const mintCard = async (
        from = minter,
        to = otherAccount,
        cid = baseCid
    ) => {
        return await context.cardInstance.mintCard(to, cid, {
            from: from,
        });
    };

    const createClaim = async (
        from = minter,
        to = otherAccount,
        amount = 1
    ) => {
        return await context.cardInstance.createClaim(to, new BN(amount), {
            from: from,
        });
    };

    const increaseClaim = async (
        from = minter,
        account = claimHolder,
        amount = 1
    ) => {
        return await context.cardInstance.increaseClaim(
            account,
            new BN(amount),
            {
                from: from,
            }
        );
    };

    const verifyBaseUri = async (val) => {
        const baseUri = await context.cardInstance.BASE_URI();
        baseUri.should.be.equal(val);
    };

    const verifyMaxDownvotes = async (val) => {
        const maxDownvotes = await context.cardInstance.MAX_DOWNVOTES();
        maxDownvotes.should.be.bignumber.equal(val);
    };

    const verifyMaxUriChanges = async (val) => {
        const maxUriChanges = await context.cardInstance.MAX_URI_CHANGES();
        maxUriChanges.should.be.bignumber.equal(val);
    };

    const verifyMinTokenReq = async (val) => {
        const minDaoTokensRequired =
            await context.cardInstance.MIN_DAO_TOKENS_REQUIRED();
        minDaoTokensRequired.should.be.bignumber.equal(val);
    };

    const verifyPause = async (bool) => {
        const paused = await context.cardInstance.paused();
        paused.should.be.equal(bool);
    };

    const verifyBlacklisted = async (address, bool) => {
        const blacklisted = await context.cardInstance.isBlacklisted(address);
        blacklisted.should.be.equal(bool);
    };

    const verifyCardBalance = async (address, amount) => {
        const cardBalance = await context.cardInstance.balanceOf(address);
        cardBalance.should.be.bignumber.equal(new BN(amount));
    };

    const verifyClaimBalance = async (address, amount) => {
        const claimBalance = await context.cardInstance.remainingClaims(
            address
        );
        claimBalance.should.be.bignumber.equal(new BN(amount));
    };

    const verifyAddressHasClaim = async (address, bool = true) => {
        const hasClaim = await context.cardInstance.hasClaim(address);
        hasClaim.should.be.equal(bool);
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

    describe.skip("Token Attributes", () => {
        it("has the correct name", async function () {
            const name = await context.cardInstance.name();
            name.should.equal(initialAttr.name);
        });

        it("has the correct symbol", async () => {
            const symbol = await context.cardInstance.symbol();
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

    describe.skip("Setter Functions", () => {
        const newBaseUri = "https://test.com/";
        const newMaxDownvotes = new BN(200);
        const newMaxUriChanges = new BN(10);
        const newMinTokenReq = new BN(300);
        const revertReason = getRoleRevertReason(otherAccount, MINTER);

        // Failing cases
        it("should fail to set base URI for cards when msg.sender != minter", async () => {
            // Set base URI
            await expectRevert(
                context.cardInstance.setBaseURI(newBaseUri, {
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
                context.cardInstance.setMaxDownvotes(newMaxDownvotes, {
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
                context.cardInstance.setMaxUriChanges(newMaxUriChanges, {
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
                context.cardInstance.setMinDaoTokensRequired(newMinTokenReq, {
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
            await context.cardInstance.setBaseURI(newBaseUri, { from: minter });

            // URI should equal new URI
            await verifyBaseUri(newBaseUri);
        });
        it("should set max number of allowed downvotes per card when msg.sender = minter", async () => {
            // Set max downvotes
            await context.cardInstance.setMaxDownvotes(newMaxDownvotes, {
                from: minter,
            });

            // Max should equal new max
            await verifyMaxDownvotes(newMaxDownvotes);
        });
        it("should set max number of allowed URI changes per card when msg.sender = minter", async () => {
            // Set max uri changes
            await context.cardInstance.setMaxUriChanges(newMaxUriChanges, {
                from: minter,
            });

            // Max should equal new max
            await verifyMaxUriChanges(newMaxUriChanges);
        });
        it("should set min number of DAO tokens required to vote", async () => {
            // Set min require DAO tokens
            await context.cardInstance.setMinDaoTokensRequired(newMinTokenReq, {
                from: minter,
            });

            // Min should equal new min
            await verifyMinTokenReq(newMinTokenReq);
        });
    });

    describe.skip("Pausing Tranfers", () => {
        const revertReason = getRoleRevertReason(otherAccount, PAUSER);
        // Failing cases
        it("should fail to pause when msg.sender != pauser", async () => {
            await expectRevert(
                context.cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should not be paused
            await verifyPause(false);
        });

        it("should fail to unpause when msg.sender != pauser", async () => {
            // Pause the contract
            await context.cardInstance.pause({ from: pauser });

            // Contract should be paused
            await verifyPause(true);

            await expectRevert(
                context.cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should still be paused
            await verifyPause(true);
        });

        // Passing cases
        it("should pause/unpause when msg.sender = pauser", async () => {
            // Pause the contract
            await context.cardInstance.pause({ from: pauser });

            // Contract should be paused
            await verifyPause(true);

            // Unpause the contract
            await context.cardInstance.unpause({ from: pauser });

            // Contract should be unpaused
            await verifyPause(false);
        });
    });

    describe.skip("Blocking Addresses", () => {
        const revertReason = getRoleRevertReason(otherAccount, BLOCKER);
        // Failing cases
        it("should fail to blacklist when msg.sender != blocker", async () => {
            await expectRevert(
                context.cardInstance.blacklistAddress(tokenHolder, {
                    from: otherAccount,
                }),
                revertReason
            );

            // Contract should not be paused
            await verifyBlacklisted(tokenHolder, false);
        });

        it("should fail to unblacklist when msg.sender != blocker", async () => {
            // Blacklist address
            await context.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            await expectRevert(
                context.cardInstance.unblacklistAddress(tokenHolder, {
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
            await context.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            // Unblacklist address
            await context.cardInstance.unblacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should not be blacklisted
            await verifyBlacklisted(tokenHolder, false);
        });
    });

    describe.skip("Minting Cards", () => {
        // Failing cases
        it("should fail when msg.sender != minter", async () => {
            const revertReason = getRoleRevertReason(tokenHolder, MINTER);
            await expectRevert(mintCard(tokenHolder), revertReason);
        });

        xit("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                mintCard(minter, constants.ZERO_ADDRESS),
                "ERC721: mint to the zero address"
            );
        });

        it("should fail to mint when URI is blank", async () => {
            await expectRevert(
                mintCard(minter, otherAccount, ""),
                "PhlipCard: Cannot mint with empty URI."
            );
        });

        // Passing cases
        it("should pass when msg.sender = minter", async () => {
            await mintCard();

            // token holder should have 1 card
            await verifyCardBalance(otherAccount, 1);
        });
    });

    describe.skip("Creating Card Claims", () => {
        // Failing cases
        it("should fail when msg.sender != minter", async () => {
            const revertReason = getRoleRevertReason(tokenHolder, MINTER);
            await expectRevert(createClaim(tokenHolder), revertReason);
        });

        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                createClaim(minter, constants.ZERO_ADDRESS),
                "Claimable._createClaim: Beneficiary cannot be 0x0 address"
            );
        });

        it("should fail when address has an existing claim", async () => {
            await createClaim();

            // Ensure account has a claim
            await verifyAddressHasClaim(otherAccount);

            await expectRevert(
                createClaim(),
                "Claimable._createClaim: Claim has already been created for this address. Call _updateClaim() for existing beneficiaries."
            );
        });

        // Passing cases
        it("should pass when msg.sender = minter and address has no claims", async () => {
            await createClaim();

            // Ensure account has a claim with correct balance
            await verifyAddressHasClaim(otherAccount);
            await verifyClaimBalance(otherAccount, 1);
        });
    });

    describe("Increasing Card Claims", () => {
        // Failing cases
        it("should fail when msg.sender != minter", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(increaseClaim(otherAccount), revertReason);
        });

        it("should fail when address does not have an existing claim", async () => {
            await expectRevert(
                increaseClaim(minter, otherAccount),
                "Claimable: Claim does not exist."
            );
        });

        it("should fail when amount to increase = 0", async () => {
            await expectRevert(
                increaseClaim(minter, claimHolder, 0),
                "PhlipCard: Can only increase claim by amount greater than 0."
            );
        });

        // Passing cases
        it("should pass when msg.sender = minter and address has a claim", async () => {
            // Increase claim of claimHolder by 2
            await increaseClaim(minter, claimHolder, 2);

            // Ensure claim was increased correctly
            await verifyClaimBalance(claimHolder, 4);
        });
    });

    describe("Redeeming Card Claims", () => {
        // Redeeming Claims
        xit("should allow address with multiple claims to redeem card", async () => {
            // Create a claim
            await context.cardInstance.createClaim(otherAccount, 5, {
                from: minter,
            });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                true
            );

            // Account should have 5 claimable card
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                5
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            // Redeem the card
            await context.cardInstance.redeemCard("test123", {
                from: otherAccount,
            });

            // Account should still have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                true
            );

            // Account should have 4 claimable cards
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                4
            );

            // Account should have 1 card
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                1
            );
        });
        xit("should allow address with 1 claim to redeem card", async () => {
            // Create a claim
            await context.cardInstance.createClaim(otherAccount, 1, {
                from: minter,
            });

            // Account should have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                true
            );

            // Account should have 1 claimable card
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                1
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            // Redeem the card
            await context.cardInstance.redeemCard("test123", {
                from: otherAccount,
            });

            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                false
            );

            // Account should have 0 claimable cards
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            // Account should have 1 card
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                1
            );
        });
        xit("should prevent address without claim from redeeming card", async () => {
            // Account should not have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                false
            );

            // Account should have 0 claimable card
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            // Account should have 0 cards
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            try {
                // Attempt to redeem a card
                await context.cardInstance.redeemCard("test123", {
                    from: otherAccount,
                });
            } catch (error) {
                // Expect not beneficiary exception to be thrown
                error.message.should.includes("not a beneficiary");
            }

            // Account should still not have a registered claim
            await utils.tokenHasClaimCheck(
                context.cardInstance,
                otherAccount,
                false
            );

            // Account should still have 0 claimable card
            await utils.tokenRemainingClaimCheck(
                context.cardInstance,
                otherAccount,
                0
            );

            // Account should still have 0 cards
            await utils.tokenBalanceCheck(
                context.cardInstance,
                otherAccount,
                0
            );
        });
    });

    describe.skip("Up/Down Voting", () => {
        //  PhlipDAO Vote on Existing Cards
        const mintedCardId = 0;

        it("should allow phlipDAO holder to up vote existing card", async () => {
            // Mint a card
            await context.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // DAO holder casts up vote
            await context.cardInstance.upVote(mintedCardId, {
                from: tokenHolder,
            });

            // Card should have 1 up vote
            const upVotes = await context.cardInstance.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("1");
        });
        it("should allow phlipDAO holder to down vote existing card", async () => {
            // Mint a card
            await context.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });

            // DAO holder casts down vote
            await context.cardInstance.downVote(mintedCardId, {
                from: tokenHolder,
            });

            // Card should have 1 down vote
            const upVotes = await context.cardInstance.downVotesFor(
                mintedCardId
            );
            upVotes.toString().should.equal("1");
        });

        // Non-PhlipDAO Attemptig to Vote
        it("should prevent non-phlipDAO holder from up voting", async () => {
            // Mint a card
            await context.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });
            try {
                // non-DAO holder attemptes to cast up vote
                await context.cardInstance.upVote(mintedCardId, {
                    from: otherAccount,
                });
            } catch (error) {}
            // Card should have 0 up votes
            const upVotes = await context.cardInstance.upVotesFor(mintedCardId);
            upVotes.toString().should.equal("0");
        });
        it("should prevent non-phlipDAO holder from down voting", async () => {
            // Mint a card
            await context.cardInstance.mintCard(otherAccount, "test123", {
                from: minter,
            });
            try {
                // non-DAO holder attemptes to cast down vote
                await context.cardInstance.downVote(mintedCardId, {
                    from: otherAccount,
                });
            } catch (error) {}
            // Card should have 0 down votes
            const upVotes = await context.cardInstance.downVotesFor(
                mintedCardId
            );
            upVotes.toString().should.equal("0");
        });

        //  PhlipDAO Vote on Non-Existing Cards
        it("should prevent phlipDAO holder from up voting non-existant card", async () => {
            let voteFailed = false;
            try {
                // DAO holder casts down vote
                await context.cardInstance.upVote(mintedCardId, {
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
                await context.cardInstance.downVote(mintedCardId, {
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

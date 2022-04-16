const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();

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
    baseCid = "base123";
    testCid = "test123";

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

    const redeemCard = async (uri = testCid, from = claimHolder) => {
        return await context.cardInstance.redeemCard(uri, {
            from: from,
        });
    };

    const updateCardURI = async (
        cardID = 0,
        uri = testCid,
        from = cardHolder
    ) => {
        return await context.cardInstance.updateCardURI(cardID, uri, {
            from: from,
        });
    };

    const upVote = async (account = tokenHolder, id = 0) => {
        return await context.cardInstance.upVote(new BN(id), {
            from: account,
        });
    };

    const downVote = async (account = tokenHolder, id = 0) => {
        return await context.cardInstance.downVote(new BN(id), {
            from: account,
        });
    };

    const verifyBaseUri = async (val) => {
        const baseUri = await context.cardInstance.BASE_URI();
        baseUri.should.be.equal(val);
    };

    const verifyMaxDownvotes = async (val) => {
        const maxDownVotes = await context.cardInstance.MAX_DOWNVOTES();
        maxDownVotes.should.be.bignumber.equal(val);
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

    const verifyDaoTokenAddress = async (val) => {
        const token = await context.cardInstance.DAO_TOKEN();
        token.should.be.equal(val);
    };

    const verifyPause = async (bool) => {
        const paused = await context.cardInstance.paused();
        paused.should.be.equal(bool);
    };

    const verifyBlacklisted = async (address, bool) => {
        const blacklisted = await context.cardInstance.isBlacklisted(address);
        blacklisted.should.be.equal(bool);
    };

    const verifyCardURI = async (cardId, uri) => {
        const cardURI = await context.cardInstance.tokenURI(new BN(cardId));
        cardURI.should.be.equal(uri);
    };

    const verifyCardMinter = async (cardId, address) => {
        const cardMinter = await context.cardInstance.minterOf(new BN(cardId));
        cardMinter.should.be.equal(address);
    };

    const verifyCardOwner = async (cardId, address) => {
        const cardOwner = await context.cardInstance.ownerOf(new BN(cardId));
        cardOwner.should.be.equal(address);
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

    const verifyUpVotes = async (cardId, numVotes = true) => {
        const voteCount = await context.cardInstance.upVotesFor(new BN(cardId));
        voteCount.should.be.bignumber.equal(new BN(numVotes));
    };

    const verifyDownVotes = async (cardId, numVotes = true) => {
        const voteCount = await context.cardInstance.downVotesFor(
            new BN(cardId)
        );
        voteCount.should.be.bignumber.equal(new BN(numVotes));
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
            await verifyMaxDownvotes(initialAttr.maxDownVotes);
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
        const newMaxDownvotes = new BN(200);
        const newMaxUriChanges = new BN(10);
        const newMinTokenReq = new BN(300);
        const newDaoTokenAddress = "0x0000000000000000000000000000000000000001";
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
            await verifyMaxDownvotes(initialAttr.maxDownVotes);
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
        it("should fail to set DAO token address when msg.sender != minter", async () => {
            // Set min require DAO tokens
            await expectRevert(
                context.cardInstance.setDaoTokenAddress(newDaoTokenAddress, {
                    from: otherAccount,
                }),
                revertReason
            );
            // Min DAO tokens required should still equal initial min DAO tokens required
            await verifyDaoTokenAddress(context.tokenInstance.address);
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
        it("should set min number of DAO tokens required to vote when msg.sender = minter", async () => {
            // Set min require DAO tokens
            await context.cardInstance.setMinDaoTokensRequired(newMinTokenReq, {
                from: minter,
            });

            // Min should equal new min
            await verifyMinTokenReq(newMinTokenReq);
        });
        it("should set DAO token address when msg.sender = minter", async () => {
            // Set DAO token address
            await context.cardInstance.setDaoTokenAddress(newDaoTokenAddress, {
                from: minter,
            });

            // DAO token address should equal new DAO token address
            await verifyDaoTokenAddress(newDaoTokenAddress);
        });
    });

    describe("Pausing Contract", () => {
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

    describe("Blocking Addresses", () => {
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

    describe("Minting Cards", () => {
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
            // account should have 0 cards
            await verifyCardBalance(otherAccount, 0);
        });

        // Passing cases
        it("should pass when msg.sender = minter", async () => {
            // Mints new card with ID = 3. (IDs 0, 1, 2 are used in before() function)
            await mintCard();

            // account should have 1 card
            await verifyCardBalance(otherAccount, 1);

            // Verify card minter and URI are correct
            await verifyCardMinter(3, otherAccount);
            await verifyCardURI(3, initialAttr.baseUri + baseCid);
        });
    });

    describe.skip("Transfering Cards", () => {
        // Failing cases
        it("should fail when from address is not card owner", async () => {});
        it("should fail when to address is 0x0", async () => {});
        it("should fail when contract is paused", async () => {});

        // Passing cases
        it("should pass when card's vesting capsule has not reached cliff", async () => {});
        it("should pass when card's vesting capsule is partially vested", async () => {});
        it("should pass when card's vesting capsule is fully vested", async () => {});
    });

    describe("Updating Card Metadata", () => {
        // Failing cases
        it("should fail when card ID is out of bounds", async () => {
            await expectRevert(
                updateCardURI(3),
                "PhlipCard: Token does not exist."
            );
        });
        it("should fail when msg.sender != owner", async () => {
            await expectRevert(
                updateCardURI(0, testCid, tokenHolder),
                "PhlipCard: Address does not own this card."
            );
            await verifyCardURI(0, initialAttr.baseUri + baseCid);
        });

        it("should fail when msg.sender != minter", async () => {
            // Tranfer card to new owner
            await context.cardInstance.transferFrom(
                cardHolder,
                otherAccount,
                0,
                { from: cardHolder }
            );

            await verifyCardOwner(0, otherAccount);

            await expectRevert(
                updateCardURI(0, testCid, otherAccount),
                "PhlipCard: Only the minter can update the URI."
            );
            await verifyCardURI(0, initialAttr.baseUri + baseCid);
        });
        it("should fail when metadata has been updated max number of times", async () => {
            await updateCardURI();
            await expectRevert(
                updateCardURI(),
                "PhlipCard: Maximum number of URI changes reached."
            );
        });

        // Passing cases
        it("should pass when msg.sender is owner/minter and metadata updates < max number of times", async () => {
            await updateCardURI();
            await verifyCardURI(0, initialAttr.baseUri + testCid);
        });
    });

    // describe("Creating Card Claims", () => {
    //     // Failing cases
    //     it("should fail when msg.sender != minter", async () => {
    //         const revertReason = getRoleRevertReason(tokenHolder, MINTER);
    //         await expectRevert(createClaim(tokenHolder), revertReason);
    //     });

    //     it("should fail when recipient is 0x0", async () => {
    //         // BUG: This test fails because it uses all gas not because of zero address
    //         await expectRevert(
    //             createClaim(minter, constants.ZERO_ADDRESS),
    //             "Claimable._createClaim: Beneficiary cannot be 0x0 address"
    //         );
    //     });

    //     it("should fail when address has an existing claim", async () => {
    //         await createClaim();

    //         // Ensure account has a claim
    //         await verifyAddressHasClaim(otherAccount);

    //         await expectRevert(
    //             createClaim(),
    //             "Claimable._createClaim: Claim has already been created for this address. Call _updateClaim() for existing beneficiaries."
    //         );
    //     });

    //     // Passing cases
    //     it("should pass when msg.sender = minter and address has no claims", async () => {
    //         await createClaim();

    //         // Ensure account has a claim with correct balance
    //         await verifyAddressHasClaim(otherAccount);
    //         await verifyClaimBalance(otherAccount, 1);
    //     });
    // });

    // describe("Increasing Card Claims", () => {
    //     // Failing cases
    //     it("should fail when msg.sender != minter", async () => {
    //         const revertReason = getRoleRevertReason(otherAccount, MINTER);
    //         await expectRevert(increaseClaim(otherAccount), revertReason);
    //     });

    //     it("should fail when address does not have an existing claim", async () => {
    //         await expectRevert(
    //             increaseClaim(minter, otherAccount),
    //             "Claimable: Claim does not exist."
    //         );
    //     });

    //     it("should fail when amount to increase = 0", async () => {
    //         await expectRevert(
    //             increaseClaim(minter, claimHolder, 0),
    //             "PhlipCard: Can only increase claim by amount greater than 0."
    //         );
    //     });

    //     // Passing cases
    //     it("should pass when msg.sender = minter and address has a claim", async () => {
    //         // Increase claim of claimHolder by 2
    //         await increaseClaim(minter, claimHolder, 2);

    //         // Ensure claim was increased correctly
    //         await verifyClaimBalance(claimHolder, 4);
    //     });
    // });

    // describe("Redeeming Card Claims", () => {
    //     // Failing cases
    //     it("should fail when msg.sender does not have claim", async () => {
    //         await verifyClaimBalance(otherAccount, 0);

    //         await expectRevert(
    //             redeemCard(baseCid, otherAccount),
    //             "Claimable: Address does not have a claim."
    //         );
    //     });

    //     it("should fail when contract is paused", async () => {
    //         // Pause the contract
    //         await context.cardInstance.pause({ from: pauser });

    //         // Contract should be paused
    //         await verifyPause(true);

    //         await expectRevert(redeemCard(), "Pausable: paused");
    //     });

    //     it("should fail when claim has been emptied", async () => {
    //         // Redeem all cards owed to claimHolder
    //         const claimBalance = await context.cardInstance.remainingClaims(
    //             claimHolder
    //         );
    //         for (let i = 0; i < claimBalance; i++) {
    //             await redeemCard();
    //         }
    //         // Should treat claimHolder account as if it has no claim
    //         await expectRevert(
    //             redeemCard(),
    //             "Claimable: Address does not have a claim."
    //         );
    //     });

    //     // Passing cases
    //     it("should pass when msg.sender has a claim amount > 0", async () => {
    //         // Claim one of the cards owed to claimHolder
    //         await redeemCard();

    //         // claimHolder should now have 1 card and 1 claim left
    //         await verifyCardBalance(claimHolder, 1);
    //         await verifyClaimBalance(claimHolder, 1);
    //     });
    // });

    describe("Up Voting", () => {
        // Failing cases
        it("should fail when msg.sender owns card", async () => {
            await expectRevert(
                upVote(cardHolder),
                "PhlipCard: Cannot vote on your own card."
            );
            // Verify that the card has no upvotes
            await verifyUpVotes(0, 0);
        });
        it("should fail when msg.sender does not hold enough tokens", async () => {
            await expectRevert(
                upVote(otherAccount),
                "PhlipCard: Must own PhlipDAO tokens to vote."
            );
            // Verify that the card has no upvotes
            await verifyUpVotes(0, 0);
        });
        it("should fail when msg.sender is blacklisted", async () => {
            // Blacklist address
            await context.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            await expectRevert(
                upVote(tokenHolder),
                "Blacklistable: Blacklisted addresses are forbidden"
            );
            // Verify that the card has no upvotes
            await verifyUpVotes(0, 0);
        });
        it("should fail when card does not exist", async () => {
            await expectRevert(
                upVote(tokenHolder, 1),
                "PhlipCard: Token does not exist."
            );
            // Verify that the card has no upvotes
            await verifyUpVotes(0, 0);
        });

        // Passing cases
        it("should up vote when msg.sender does not own card and has enough tokens", async () => {
            // Up vote cardHolder's card
            await upVote();
            // Verify up vote was successful
            await verifyUpVotes(0, 1);
        });
    });

    describe("Down Voting", () => {
        // Failing cases
        it("should fail when msg.sender owns card", async () => {
            await expectRevert(
                downVote(cardHolder),
                "PhlipCard: Cannot vote on your own card."
            );
            // Verify that the card has no down votes
            await verifyDownVotes(0, 0);
        });
        it("should fail when msg.sender does not hold enough tokens", async () => {
            await expectRevert(
                downVote(otherAccount),
                "PhlipCard: Must own PhlipDAO tokens to vote."
            );
            // Verify that the card has no down votes
            await verifyDownVotes(0, 0);
        });
        it("should fail when msg.sender is blacklisted", async () => {
            // Blacklist address
            await context.cardInstance.blacklistAddress(tokenHolder, {
                from: blocker,
            });

            // Address should be blacklisted
            await verifyBlacklisted(tokenHolder, true);

            await expectRevert(
                downVote(tokenHolder),
                "Blacklistable: Blacklisted addresses are forbidden"
            );
            // Verify that the card has no down votes
            await verifyDownVotes(0, 0);
        });
        it("should fail when card does not exist", async () => {
            await expectRevert(
                downVote(tokenHolder, 1),
                "PhlipCard: Token does not exist."
            );
            // Verify that the card has no down votes
            await verifyDownVotes(0, 0);
        });

        // Passing cases
        it("should pass when msg.sender does not own card and has enough tokens", async () => {
            // Down vote cardHolder's card
            await downVote();
            // Verify down vote was successful
            await verifyDownVotes(0, 1);
        });

        it("should make card unplayable if down votes count >= max down votes allowed", async () => {
            // Doen vote card twice (testing max)
            await downVote(tokenHolder);
            await downVote(minter);

            // Verify down votes were successful
            await verifyDownVotes(0, initialAttr.maxDownVotes);
            const isPlayable = await context.cardInstance.isPlayable(new BN(0));
            isPlayable.should.be.equal(false);
        });
    });
}

module.exports = { shouldBehaveLikePhlipCard };

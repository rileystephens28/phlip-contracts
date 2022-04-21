const PhlipCard = artifacts.require("PhlipCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN,
    snapshot,
    expectRevert,
    constants,
} = require("@openzeppelin/test-helpers");
require("chai").should();

const MINTER = web3.utils.soliditySha3("MINTER_ROLE");
const PAUSER = web3.utils.soliditySha3("PAUSER_ROLE");
const SETTINGS_ADMIN = web3.utils.soliditySha3("SETTINGS_ROLE");

contract("PhlipCard", (accounts) => {
    let cardInstance, tokenInstance1, tokenInstance2;
    const [admin, cardOwner, voucherHolder, recipient, account, otherAccount] =
        accounts;

    // 100 second cliff
    const baseCliff = new BN(100);

    // 1000 second vesting duration
    const baseDuration = new BN(1000);

    // 1 token unit per second
    const baseRate = new BN(1);

    const baseUri = "https.ipfs.moralis.io/ipfs/";
    const baseMaxUriChanges = new BN(1);
    const baseCid = "base123";
    const testCid = "test123";

    const fillReserves = async (
        scheduleId = 0,
        amount = new BN(1000),
        token = tokenInstance1,
        from = admin,
        preApprove = true
    ) => {
        if (preApprove) {
            await token.approve(cardInstance.address, new BN(amount), {
                from: from,
            });
        }
        return await cardInstance.fillReserves(scheduleId, new BN(amount), {
            from: from,
        });
    };

    const createSchedule = async (
        token = tokenInstance1.address,
        cliff = baseCliff,
        duration = baseDuration,
        rate = baseRate,
        from = admin
    ) => {
        return await cardInstance.createVestingSchedule(
            token,
            new BN(cliff),
            new BN(duration),
            new BN(rate),
            { from: from }
        );
    };

    const addVestingScheme = async (scheduleIds = [0, 1], from = admin) => {
        return await cardInstance.addVestingScheme(
            scheduleIds[0],
            scheduleIds[1],
            {
                from: from,
            }
        );
    };

    const setVestingScheme = async (scheduleId = 0, from = admin) => {
        return await cardInstance.setVestingScheme(scheduleId, {
            from: from,
        });
    };

    const mintTextCard = async (
        to = cardOwner,
        cid = baseCid,
        from = admin
    ) => {
        return await cardInstance.mintTextCard(to, cid, {
            from: from,
        });
    };

    const issueTextCardVoucher = async (to = voucherHolder, from = admin) => {
        return await cardInstance.issueTextCardVoucher(to, {
            from: from,
        });
    };

    const batchIssueTextCardVouchers = async (
        to = voucherHolder,
        amount = 1,
        from = admin
    ) => {
        return await cardInstance.batchIssueTextCardVouchers(
            to,
            new BN(amount),
            {
                from: from,
            }
        );
    };

    const transfer = async (
        from = cardOwner,
        to = recipient,
        tokeneId = 0,
        caller
    ) => {
        const estimatedGas = await cardInstance.transferFrom.estimateGas(
            from,
            to,
            tokeneId,
            { from: caller || from }
        );
        return await cardInstance.transferFrom(from, to, tokeneId, {
            from: from,
            gas: estimatedGas,
        });
    };

    const redeemVoucher = async (
        reservedID = 0,
        uri = testCid,
        from = voucherHolder
    ) => {
        return await cardInstance.redeemVoucher(reservedID, uri, {
            from: from,
        });
    };

    const updateMetadata = async (
        cardID = 0,
        uri = testCid,
        from = cardOwner
    ) => {
        return await cardInstance.updateMetadata(cardID, uri, {
            from: from,
        });
    };

    const verifyBaseUri = async (val) => {
        const baseUri = await cardInstance.BASE_URI();
        baseUri.should.be.equal(val);
    };

    const verifyMaxUriChanges = async (val) => {
        const maxUriChanges = await cardInstance.MAX_URI_CHANGES();
        maxUriChanges.should.be.bignumber.equal(val);
    };

    const verifyPause = async (bool) => {
        const paused = await cardInstance.paused();
        paused.should.be.equal(bool);
    };

    const verifyCardURI = async (cardId, uri) => {
        const cardURI = await cardInstance.tokenURI(new BN(cardId));
        cardURI.should.be.equal(uri);
    };

    const verifyCardMinter = async (cardId, address) => {
        const cardMinter = await cardInstance.minterOf(new BN(cardId));
        cardMinter.should.be.equal(address);
    };

    const verifyCardOwner = async (cardId, address) => {
        const cardOwner = await cardInstance.ownerOf(new BN(cardId));
        cardOwner.should.be.equal(address);
    };

    const verifyCardBalance = async (address, amount) => {
        const cardBalance = await cardInstance.balanceOf(address);
        cardBalance.should.be.bignumber.equal(new BN(amount));
    };

    // const verifyClaimBalance = async (address, amount) => {
    //     const claimBalance = await cardInstance.remainingClaims(address);
    //     claimBalance.should.be.bignumber.equal(new BN(amount));
    // };

    // const verifyAddressHasClaim = async (address, bool = true) => {
    //     const hasClaim = await cardInstance.hasClaim(address);
    //     hasClaim.should.be.equal(bool);
    // };

    const getRoleRevertReason = (address, role) => {
        return (
            "AccessControl: account " +
            address.toLowerCase() +
            " is missing role " +
            role +
            "."
        );
    };

    before(async () => {
        // Initialize contract state
        cardInstance = await PhlipCard.new(
            "Phlip Base Card",
            "BPC",
            baseUri,
            baseMaxUriChanges,
            {
                from: admin,
            }
        );

        tokenInstance1 = await ERC20Mock.new({ from: admin });
        tokenInstance2 = await ERC20Mock.new({ from: admin });

        // fund the deployer account with 10,000 of tokens 1 & 2
        await tokenInstance1.mint(admin, 10000, { from: admin });
        await tokenInstance2.mint(admin, 10000, { from: admin });

        // Create vesting schedules
        await createSchedule(tokenInstance1.address);
        await createSchedule(tokenInstance2.address);

        // Fill schedule reserves with tokens 1 & 2
        await fillReserves(0, 5000, tokenInstance1);
        await fillReserves(1, 5000, tokenInstance2);

        await addVestingScheme([0, 1]);
        await setVestingScheme(0);
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    describe("Token Attributes", () => {
        it("has the correct name", async function () {
            const name = await cardInstance.name();
            name.should.equal("Phlip Base Card");
        });
        it("has the correct symbol", async () => {
            const symbol = await cardInstance.symbol();
            symbol.should.equal("BPC");
        });
        it("has the correct base URI", async () => {
            await verifyBaseUri(baseUri);
        });
        it("has the correct max allowed URI changes", async () => {
            await verifyMaxUriChanges(baseMaxUriChanges);
        });
    });

    describe("Setter Functions", () => {
        const newBaseUri = "https://test.com/";
        const newMaxUriChanges = new BN(10);
        const revertReason = getRoleRevertReason(otherAccount, SETTINGS_ADMIN);

        // Failing cases
        it("should fail to set base URI when caller is not settings admin", async () => {
            // Set base URI
            await expectRevert(
                cardInstance.setBaseURI(newBaseUri, {
                    from: otherAccount,
                }),
                revertReason
            );

            // URI should still equal initial base URI
            await verifyBaseUri(baseUri);
        });

        it("should fail to set max number of allowed URI changes when caller is not settings adminr", async () => {
            // Set max uri changes
            await expectRevert(
                cardInstance.setMaxUriChanges(newMaxUriChanges, {
                    from: otherAccount,
                }),
                revertReason
            );
            // Max uri changes should still equal initial max uri changes
            await verifyMaxUriChanges(baseMaxUriChanges);
        });

        // Passing cases
        it("should set base URI when caller is not settings admin", async () => {
            // Set base URI
            await cardInstance.setBaseURI(newBaseUri, { from: admin });

            // URI should equal new URI
            await verifyBaseUri(newBaseUri);
        });

        it("should set max number of allowed URI changes when caller is not settings admin", async () => {
            // Set max uri changes
            await cardInstance.setMaxUriChanges(newMaxUriChanges, {
                from: admin,
            });

            // Max should equal new max
            await verifyMaxUriChanges(newMaxUriChanges);
        });
    });

    describe("Pausing Contract", () => {
        const revertReason = getRoleRevertReason(otherAccount, PAUSER);
        // Failing cases
        it("should fail to pause when caller is not pauser", async () => {
            await expectRevert(
                cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should not be paused
            await verifyPause(false);
        });

        it("should fail to unpause when caller is not pauser", async () => {
            // Pause the contract
            await cardInstance.pause({ from: admin });

            // Contract should be paused
            await verifyPause(true);

            await expectRevert(
                cardInstance.pause({ from: otherAccount }),
                revertReason
            );

            // Contract should still be paused
            await verifyPause(true);
        });

        // Passing cases
        it("should pause/unpause when caller is not pauser", async () => {
            // Pause the contract
            await cardInstance.pause({ from: admin });

            // Contract should be paused
            await verifyPause(true);

            // Unpause the contract
            await cardInstance.unpause({ from: admin });

            // Contract should be unpaused
            await verifyPause(false);
        });
    });

    describe("Minting Text Cards", () => {
        // Failing cases
        it("should fail when caller is not minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                mintTextCard(recipient, baseCid, otherAccount),
                revertReason
            );
        });

        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                mintTextCard(constants.ZERO_ADDRESS),
                "ERC721: mint to the zero address"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin", async () => {
            // Mints new card with ID = 3. (IDs 0, 1, 2 are used in before() function)
            await mintTextCard();

            // account should have 1 card
            await verifyCardBalance(cardOwner, 1);

            // Verify card minter and URI are correct
            await verifyCardMinter(0, cardOwner);
            await verifyCardURI(0, baseUri + baseCid);
        });
    });

    describe("Transfering Cards", () => {
        beforeEach(async () => {
            await mintTextCard();
        });
        // Failing cases
        it("should fail when from caller is not card owner", async () => {
            await expectRevert(
                transfer(otherAccount, recipient, 0),
                "ERC721: transfer caller is not owner nor approved"
            );
        });
        it("should fail when to address is 0x0", async () => {
            await expectRevert(
                transfer(cardOwner, constants.ZERO_ADDRESS, 0),
                "ERC721: transfer to the zero address"
            );
        });
        it("should fail when contract is paused", async () => {
            await cardInstance.pause({ from: admin });
            await expectRevert(transfer(), "Pausable: paused");
        });

        // Passing cases
        it("should pass when caller is owner and card not paused", async () => {
            // Transfer cardOwner => recipient
            await transfer();

            // Verify card owner is now recipient
            await verifyCardOwner(0, recipient);

            // Verify previous owner has no cards
            await verifyCardBalance(cardOwner, 0);
        });

        it("should pass when caller is approved operator and card not paused", async () => {
            // Approve other account as operator
            await cardInstance.approve(otherAccount, 0, { from: cardOwner });

            // Transfer cardOwner => recipient
            await transfer(cardOwner, recipient, 0, otherAccount);

            // Verify card owner is now recipient
            await verifyCardOwner(0, recipient);

            // Verify previous owner has no cards
            await verifyCardBalance(cardOwner, 0);
        });
    });

    describe("Updating Card Metadata", () => {
        beforeEach(async () => {
            await mintTextCard();
        });
        // Failing cases
        it("should fail when card ID is out of bounds", async () => {
            await expectRevert(
                updateMetadata(3),
                "PhlipCard: Card does not exist"
            );
        });
        it("should fail when URI is blank", async () => {
            await expectRevert(
                updateMetadata(0, ""),
                "PhlipCard: URI cannot be empty"
            );
            // account should have 0 cards
            await verifyCardURI(0, baseUri + baseCid);
        });
        it("should fail when caller is not card owner", async () => {
            await expectRevert(
                updateMetadata(0, testCid, otherAccount),
                "PhlipCard: Must be owner"
            );
            await verifyCardURI(0, baseUri + baseCid);
        });

        it("should fail when caller is not card minter", async () => {
            // Tranfer card to new owner
            await transfer();

            await verifyCardOwner(0, recipient);

            await expectRevert(
                updateMetadata(0, testCid, recipient),
                "PhlipCard: Must be minter"
            );
            await verifyCardURI(0, baseUri + baseCid);
        });
        it("should fail when metadata has been updated max number of times", async () => {
            await updateMetadata();
            await expectRevert(
                updateMetadata(),
                "PhlipCard: Exceeded max URI changes"
            );
        });

        // Passing cases
        it("should pass when caller is card owner/minter and metadata is eligible for update", async () => {
            await updateMetadata();
            await verifyCardURI(0, baseUri + testCid);
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
    //             createClaim(admin, constants.ZERO_ADDRESS),
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
    //             increaseClaim(admin, otherAccount),
    //             "Claimable: Claim does not exist."
    //         );
    //     });

    //     it("should fail when amount to increase = 0", async () => {
    //         await expectRevert(
    //             increaseClaim(admin, claimHolder, 0),
    //             "PhlipCard: Can only increase claim by amount greater than 0."
    //         );
    //     });

    //     // Passing cases
    //     it("should pass when msg.sender = minter and address has a claim", async () => {
    //         // Increase claim of claimHolder by 2
    //         await increaseClaim(admin, claimHolder, 2);

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
    //         await cardInstance.pause({ from: admin });

    //         // Contract should be paused
    //         await verifyPause(true);

    //         await expectRevert(redeemCard(), "Pausable: paused");
    //     });

    //     it("should fail when claim has been emptied", async () => {
    //         // Redeem all cards owed to claimHolder
    //         const claimBalance = await cardInstance.remainingClaims(
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
});

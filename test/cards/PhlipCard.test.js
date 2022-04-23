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
        amount = 2,
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

    const verifyVoucherHolder = async (id, address) => {
        const hasVoucher = await cardInstance.voucherHolderOf(id);
        hasVoucher.should.be.equal(address);
    };

    const verifyRemainingVouchers = async (address, amount) => {
        const remaining = await cardInstance.remainingVouchers(address);
        remaining.should.be.bignumber.equal(new BN(amount));
    };

    const verifyAddressHasVoucher = async (address, bool) => {
        const hasVoucher = await cardInstance.hasVoucher(address);
        hasVoucher.should.be.equal(bool);
    };

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

    describe("Issuing Text Card Vouchers", () => {
        // Failing cases
        it("should fail when caller is not card minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                issueTextCardVoucher(voucherHolder, otherAccount),
                revertReason
            );
        });
        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                issueTextCardVoucher(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin and address is valid", async () => {
            await issueTextCardVoucher();

            // Ensure voucher was properly issued to voucherHolder
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 1);
            await verifyVoucherHolder(0, voucherHolder);
        });
    });

    describe("Batch Issuing Text Card Vouchers", () => {
        // Failing cases
        it("should fail when caller is not card minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                batchIssueTextCardVouchers(voucherHolder, 2, otherAccount),
                revertReason
            );
        });
        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                batchIssueTextCardVouchers(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin and address is valid", async () => {
            await batchIssueTextCardVouchers();

            // Ensure voucher was properly issued to voucherHolder
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 2);
            await verifyVoucherHolder(0, voucherHolder);
            await verifyVoucherHolder(1, voucherHolder);
        });
    });

    describe("Redeeming Card Vouchers", () => {
        beforeEach(async () => {
            await batchIssueTextCardVouchers();
        });
        // Failing cases
        it("should fail when caller has no vouchers", async () => {
            await expectRevert(
                redeemVoucher(0, baseCid, otherAccount),
                "VoucherRegistry: Not voucher holder"
            );
        });

        it("should fail when contract is paused", async () => {
            // Pause the contract
            await cardInstance.pause({ from: admin });

            // Contract should be paused
            await verifyPause(true);

            await expectRevert(redeemVoucher(), "Pausable: paused");
        });

        it("should fail when caller has already redeemed voucher", async () => {
            // Redeem all cards owed to voucherHolder
            const remainingVouchers = await cardInstance.remainingVouchers(
                voucherHolder
            );
            for (let i = 0; i < remainingVouchers; i++) {
                await redeemVoucher(i);
            }

            // voucherHolder should no longer have any vouchers
            await verifyAddressHasVoucher(voucherHolder, false);

            // Should treat voucherHolder as if they have no vouchers
            await expectRevert(
                redeemVoucher(),
                "VoucherRegistry: Not voucher holder"
            );
        });

        // Passing cases
        it("should pass when caller redeems one of many vouchers", async () => {
            // Claim one of the cards owed to voucherHolder
            await redeemVoucher();

            // Should still have one voucher
            await verifyAddressHasVoucher(voucherHolder, true);

            // Should act as if zero address holds redeemed voucher
            await verifyVoucherHolder(0, constants.ZERO_ADDRESS);

            // voucherHolder should still hold voucher 1 and own card 0
            await verifyVoucherHolder(1, voucherHolder);
            await verifyCardOwner(0, voucherHolder);

            // voucherHolder should now have 1 card and 1 voucher left
            await verifyCardBalance(voucherHolder, 1);
            await verifyRemainingVouchers(voucherHolder, 1);
        });
        it("should pass when caller redeems all vouchers", async () => {
            const remainingVouchers = await cardInstance.remainingVouchers(
                voucherHolder
            );

            // Redeem all cards owed to voucherHolder
            for (let i = 0; i < remainingVouchers; i++) {
                await redeemVoucher(i);
            }

            // Should no longer have any vouchers
            await verifyAddressHasVoucher(voucherHolder, false);

            // Should act as if zero address holds both vouchers
            await verifyVoucherHolder(0, constants.ZERO_ADDRESS);
            await verifyVoucherHolder(0, constants.ZERO_ADDRESS);

            // voucherHolder should now own card 0 and 1
            await verifyCardOwner(0, voucherHolder);
            await verifyCardOwner(1, voucherHolder);

            // voucherHolder should now have 2 cards and 0 vouchers left
            await verifyCardBalance(voucherHolder, 2);
            await verifyRemainingVouchers(voucherHolder, 0);
        });
    });
});
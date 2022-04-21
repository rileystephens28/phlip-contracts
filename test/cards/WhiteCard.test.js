const WhiteCard = artifacts.require("WhiteCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN,
    snapshot,
    expectRevert,
    constants,
} = require("@openzeppelin/test-helpers");
require("chai").should();

const MINTER = web3.utils.soliditySha3("MINTER_ROLE");

contract("WhiteCard", (accounts) => {
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

    const BLANK_CARD = new BN(1);

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

    const mintBlankCard = async (to = cardOwner, from = admin) => {
        return await cardInstance.mintBlankCard(to, {
            from: from,
        });
    };

    const issueBlankCardVoucher = async (to = voucherHolder, from = admin) => {
        return await cardInstance.issueBlankCardVoucher(to, {
            from: from,
        });
    };

    const batchIssueBlankCardVouchers = async (
        to = voucherHolder,
        amount = 2,
        from = admin
    ) => {
        return await cardInstance.batchIssueBlankCardVouchers(
            to,
            new BN(amount),
            {
                from: from,
            }
        );
    };

    const redeemVoucher = async (reservedID = 0, from = voucherHolder) => {
        return await cardInstance.redeemVoucher(reservedID, "", {
            from: from,
        });
    };

    const verifyCardType = async (cardId, val) => {
        const type = await cardInstance.typeOf(cardId);
        type.should.be.bignumber.equal(new BN(val));
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
        cardInstance = await WhiteCard.new(baseUri, baseMaxUriChanges, {
            from: admin,
        });

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

    describe("Minting Blank Cards", () => {
        // Failing cases
        it("should fail when caller is not minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                mintBlankCard(recipient, otherAccount),
                revertReason
            );
        });

        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                mintBlankCard(constants.ZERO_ADDRESS),
                "ERC721: mint to the zero address"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin", async () => {
            // Mints new card with ID = 3. (IDs 0, 1, 2 are used in before() function)
            await mintBlankCard();

            // account should have 1 card
            await verifyCardBalance(cardOwner, 1);

            // Verify card minter and URI are correct
            await verifyCardMinter(0, cardOwner);
            await verifyCardURI(0, "");
            await verifyCardType(0, BLANK_CARD);
        });
    });

    describe("Issuing Blank Card Vouchers", () => {
        // Failing cases
        it("should fail when caller is not card minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                issueBlankCardVoucher(voucherHolder, otherAccount),
                revertReason
            );
        });
        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                issueBlankCardVoucher(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin and address is valid", async () => {
            await issueBlankCardVoucher();

            // Ensure voucher was properly issued to voucherHolder
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 1);
            await verifyVoucherHolder(0, voucherHolder);
        });
    });

    describe("Batch Issuing Blank Card Vouchers", () => {
        // Failing cases
        it("should fail when caller is not card minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                batchIssueBlankCardVouchers(voucherHolder, 2, otherAccount),
                revertReason
            );
        });
        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                batchIssueBlankCardVouchers(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );
        });

        // Passing cases
        it("should pass when caller is minter admin and address is valid", async () => {
            await batchIssueBlankCardVouchers();

            // Ensure voucher was properly issued to voucherHolder
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 2);
            await verifyVoucherHolder(0, voucherHolder);
            await verifyVoucherHolder(1, voucherHolder);
        });
    });

    describe("Redeeming Card Vouchers", () => {
        beforeEach(async () => {
            await batchIssueBlankCardVouchers();
        });
        // Failing cases
        it("should fail when caller has no vouchers", async () => {
            await expectRevert(
                redeemVoucher(0, otherAccount),
                "VoucherRegistry: Not voucher holder"
            );
        });

        it("should fail when caller has already redeemed voucher", async () => {
            // Redeem all cards owed to claimHolder
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

            // Should have minted a blank card
            await verifyCardType(0, BLANK_CARD);

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

            // Cards should be blank
            await verifyCardType(0, BLANK_CARD);
            await verifyCardType(1, BLANK_CARD);

            // voucherHolder should now have 2 cards and 0 vouchers left
            await verifyCardBalance(voucherHolder, 2);
            await verifyRemainingVouchers(voucherHolder, 0);
        });
    });
});

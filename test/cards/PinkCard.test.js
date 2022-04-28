const PinkCard = artifacts.require("PinkCard");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN,
    snapshot,
    expectRevert,
    constants,
} = require("@openzeppelin/test-helpers");
require("chai").should();

const MINTER = web3.utils.soliditySha3("MINTER_ROLE");

contract("PinkCard", (accounts) => {
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
    const baseScheduleIds = [new BN(0), new BN(1)];

    const TEXT_CARD = new BN(0);
    const IMAGE_CARD = new BN(1);

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

    const mintTextCard = async (
        to = cardOwner,
        cid = baseCid,
        scheduleIds = baseScheduleIds,
        from = admin
    ) => {
        const getEstimate = await cardInstance.mintCard.estimateGas(
            to,
            cid,
            IMAGE_CARD,
            scheduleIds,
            {
                from: from,
            }
        );
        return await cardInstance.mintCard(to, cid, TEXT_CARD, scheduleIds, {
            from: from,
            gas: getEstimate,
        });
    };

    const mintImageCard = async (
        to = cardOwner,
        cid = baseCid,
        scheduleIds = baseScheduleIds,
        from = admin
    ) => {
        const getEstimate = await cardInstance.mintCard.estimateGas(
            to,
            cid,
            IMAGE_CARD,
            scheduleIds,
            {
                from: from,
            }
        );
        return await cardInstance.mintCard(to, cid, IMAGE_CARD, scheduleIds, {
            from: from,
            gas: getEstimate,
        });
    };

    const issueTextCardVoucher = async (
        to = voucherHolder,
        scheduleIds = baseScheduleIds,
        from = admin
    ) => {
        const getEstimate = await cardInstance.issueCardVoucher.estimateGas(
            to,
            TEXT_CARD,
            scheduleIds,
            {
                from: from,
            }
        );
        return await cardInstance.issueCardVoucher(to, TEXT_CARD, scheduleIds, {
            from: from,
            gas: getEstimate,
        });
    };

    const issueImageCardVoucher = async (
        to = voucherHolder,
        scheduleIds = baseScheduleIds,
        from = admin
    ) => {
        const getEstimate = await cardInstance.issueCardVoucher.estimateGas(
            to,
            IMAGE_CARD,
            scheduleIds,
            {
                from: from,
            }
        );
        return await cardInstance.issueCardVoucher(
            to,
            IMAGE_CARD,
            scheduleIds,
            {
                from: from,
                gas: getEstimate,
            }
        );
    };

    const batchIssueCardVouchers = async (
        to = voucherHolder,
        amount = 2,
        type = IMAGE_CARD,
        scheduleIds = baseScheduleIds,
        from = admin
    ) => {
        const getEstimate =
            await cardInstance.batchIssueCardVouchers.estimateGas(
                to,
                type,
                new BN(amount),
                scheduleIds,
                {
                    from: from,
                }
            );
        return await cardInstance.batchIssueCardVouchers(
            to,
            type,
            new BN(amount),
            scheduleIds,
            {
                from: from,
                gas: getEstimate,
            }
        );
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
            role
        );
    };

    before(async () => {
        // Initialize contract state
        cardInstance = await PinkCard.new(baseUri, baseMaxUriChanges, {
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
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    describe("Minting Cards", () => {
        context("Text Cards", () => {
            // Failing cases
            it("should fail when caller is not minter admin", async () => {
                const revertReason = getRoleRevertReason(otherAccount, MINTER);
                await expectRevert(
                    mintTextCard(
                        recipient,
                        baseCid,
                        baseScheduleIds,
                        otherAccount
                    ),
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
                await mintTextCard();

                // account should have 1 card
                await verifyCardBalance(cardOwner, 1);

                // Verify card minter and URI are correct
                await verifyCardMinter(0, cardOwner);
                await verifyCardURI(0, baseUri + baseCid);
                await verifyCardType(0, TEXT_CARD);
            });
        });
        context("Image Cards", () => {
            // Failing cases
            it("should fail when caller is not minter admin", async () => {
                const revertReason = getRoleRevertReason(otherAccount, MINTER);
                await expectRevert(
                    mintImageCard(
                        recipient,
                        baseCid,
                        baseScheduleIds,
                        otherAccount
                    ),
                    revertReason
                );
            });

            it("should fail when recipient is 0x0", async () => {
                // BUG: This test fails because it uses all gas not because of zero address
                await expectRevert(
                    mintImageCard(constants.ZERO_ADDRESS),
                    "ERC721: mint to the zero address"
                );
            });

            // Passing cases
            it("should pass when caller is minter admin", async () => {
                await mintImageCard();

                // account should have 1 card
                await verifyCardBalance(cardOwner, 1);

                // Verify card minter and URI are correct
                await verifyCardMinter(0, cardOwner);
                await verifyCardURI(0, baseUri + baseCid);
                await verifyCardType(0, IMAGE_CARD);
            });
        });
    });

    describe("Issuing Vouchers", () => {
        context("For Text Cards", () => {
            // Failing cases
            it("should fail when caller is not card minter admin", async () => {
                const revertReason = getRoleRevertReason(otherAccount, MINTER);
                await expectRevert(
                    issueTextCardVoucher(
                        voucherHolder,
                        baseScheduleIds,
                        otherAccount
                    ),
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
                await verifyCardType(0, TEXT_CARD);
            });
        });

        context("For Image Cards", () => {
            // Failing cases
            it("should fail when caller is not card minter admin", async () => {
                const revertReason = getRoleRevertReason(otherAccount, MINTER);
                await expectRevert(
                    issueImageCardVoucher(
                        voucherHolder,
                        baseScheduleIds,
                        otherAccount
                    ),
                    revertReason
                );
            });
            it("should fail when recipient is 0x0", async () => {
                // BUG: This test fails because it uses all gas not because of zero address
                await expectRevert(
                    issueImageCardVoucher(constants.ZERO_ADDRESS),
                    "VoucherRegistry: Cannot issue voucher to 0x0"
                );
            });

            // Passing cases
            it("should pass when caller is minter admin and address is valid", async () => {
                await issueImageCardVoucher();

                // Ensure voucher was properly issued to voucherHolder
                await verifyAddressHasVoucher(voucherHolder, true);
                await verifyRemainingVouchers(voucherHolder, 1);
                await verifyVoucherHolder(0, voucherHolder);
                await verifyCardType(0, IMAGE_CARD);
            });
        });
    });

    describe("Batch Issuing Vouchers", () => {
        // Failing cases
        it("should fail when caller is not card minter admin", async () => {
            const revertReason = getRoleRevertReason(otherAccount, MINTER);
            await expectRevert(
                batchIssueCardVouchers(
                    voucherHolder,
                    2,
                    IMAGE_CARD,
                    baseScheduleIds,
                    otherAccount
                ),
                revertReason
            );
        });
        it("should fail when recipient is 0x0", async () => {
            // BUG: This test fails because it uses all gas not because of zero address
            await expectRevert(
                batchIssueCardVouchers(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );
        });

        // Passing cases
        it("should pass when issuing text cards", async () => {
            await batchIssueCardVouchers(voucherHolder, 2, TEXT_CARD);

            // Ensure voucher was properly issued
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 2);

            // voucherOwner should own vouchers 0 and 1
            await verifyVoucherHolder(0, voucherHolder);
            await verifyVoucherHolder(1, voucherHolder);

            // Both vouchers should be for TEXT_CARDs
            await verifyCardType(0, TEXT_CARD);
            await verifyCardType(1, TEXT_CARD);
        });

        it("should pass when issuing all image card vouchers", async () => {
            await batchIssueCardVouchers(voucherHolder, 2, IMAGE_CARD);

            // Ensure voucher was properly issued
            await verifyAddressHasVoucher(voucherHolder, true);
            await verifyRemainingVouchers(voucherHolder, 2);

            // voucherOwner should own vouchers 0 and 1
            await verifyVoucherHolder(0, voucherHolder);
            await verifyVoucherHolder(1, voucherHolder);

            // Both vouchers should be for IMAGE_CARDs
            await verifyCardType(0, IMAGE_CARD);
            await verifyCardType(1, IMAGE_CARD);
        });
    });

    describe("Redeeming Card Vouchers", () => {
        beforeEach(async () => {
            await issueTextCardVoucher();
            await issueImageCardVoucher();
        });
        // Failing cases
        it("should fail when caller has no vouchers", async () => {
            await expectRevert(
                redeemVoucher(0, baseCid, otherAccount),
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
            await verifyCardType(0, TEXT_CARD);

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

            // Should have 1 text card and 1 image card
            await verifyCardType(0, TEXT_CARD);
            await verifyCardType(1, IMAGE_CARD);

            // voucherHolder should now have 2 cards and 0 vouchers left
            await verifyCardBalance(voucherHolder, 2);
            await verifyRemainingVouchers(voucherHolder, 0);
        });
    });
});

const FxSaleChildTunnel = artifacts.require("FxSaleChildTunnel");
const PinkCard = artifacts.require("PinkCard");
const WhiteCard = artifacts.require("WhiteCard");
const DaoToken = artifacts.require("PhlipDAO");
const P2eToken = artifacts.require("PhlipP2E");

const {
    BN,
    expectRevert,
    expectEvent,
    constants,
} = require("@openzeppelin/test-helpers");
const { tokenUnits } = require("../helpers");
require("chai").should();

const TREASURER_ROLE = web3.utils.soliditySha3("TREASURER_ROLE");
const MINTER_ROLE = web3.utils.soliditySha3("MINTER_ROLE");

contract("FxSaleChildTunnel", (accounts) => {
    let childSaleInstance,
        pinkCardInstance,
        whiteCardInstance,
        daoInstance,
        p2eInstance;
    const [admin, tokenWallet, otherAccount] = accounts;

    const baseDevWallet = accounts[8];

    const baseCliff = new BN(100);
    const baseDuration = new BN(1000);

    const baseDaoAmount = tokenUnits(1000);
    const baseP2eAmount = tokenUnits(1000);

    const baseSaleQty = new BN(2);
    const baseCardQty = new BN(2);

    const baseUri = "https.ipfs.moralis.io/ipfs/";
    const baseMaxUriChanges = new BN(1);

    const createAndFillSchedule = async (
        cardInstance,
        scheduleId,
        tokenAddress,
        cliff = baseCliff,
        duration = baseDuration,
        amount = tokenUnits(100),
        from = admin
    ) => {
        await cardInstance.createVestingSchedule(
            tokenAddress,
            new BN(cliff),
            new BN(duration),
            new BN(amount),
            { from: from }
        );
        await cardInstance.fillReserves(
            tokenWallet,
            scheduleId,
            new BN(amount).mul(new BN(5)),
            {
                from: from,
            }
        );
    };

    const createAndFillDefaultSchedules = async () => {
        // Create pink card vesting schedules and fill reserves
        await createAndFillSchedule(
            pinkCardInstance,
            0,
            daoInstance.address,
            baseCliff,
            baseDuration,
            tokenUnits(200)
        );
        await createAndFillSchedule(
            pinkCardInstance,
            1,
            p2eInstance.address,
            baseCliff,
            baseDuration,
            tokenUnits(2000)
        );

        // Create white card vesting schedules and fill reserves
        await createAndFillSchedule(
            whiteCardInstance,
            0,
            daoInstance.address,
            baseCliff,
            baseDuration,
            tokenUnits(100)
        );
        await createAndFillSchedule(
            whiteCardInstance,
            1,
            p2eInstance.address,
            baseCliff,
            baseDuration,
            tokenUnits(1000)
        );
    };

    const createSingleCardPackage = async (
        cardID = 0,
        numCards = baseCardQty,
        daoAmount = baseDaoAmount,
        p2eAmount = baseP2eAmount,
        reserveMultiple = baseSaleQty,
        from = admin
    ) => {
        const gasEstimate =
            await childSaleInstance.createSingleCardPackage.estimateGas(
                cardID,
                new BN(numCards),
                new BN(daoAmount),
                new BN(p2eAmount),
                new BN(reserveMultiple),
                {
                    from: from,
                }
            );
        return await childSaleInstance.createSingleCardPackage(
            cardID,
            new BN(numCards),
            new BN(daoAmount),
            new BN(p2eAmount),
            new BN(reserveMultiple),
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const createMultiCardPackage = async (
        cardIDs = [new BN(0), new BN(1)],
        numCards = [new BN(1), new BN(2)],
        daoAmounts = [tokenUnits(100), tokenUnits(200)],
        p2eAmounts = [tokenUnits(1000), tokenUnits(2000)],
        reserveMultiple = baseSaleQty,
        from = admin
    ) => {
        const gasEstimate =
            await childSaleInstance.createMultiCardPackage.estimateGas(
                cardIDs,
                numCards,
                daoAmounts,
                p2eAmounts,
                new BN(reserveMultiple),
                {
                    from: from,
                }
            );
        return await childSaleInstance.createMultiCardPackage(
            cardIDs,
            numCards,
            daoAmounts,
            p2eAmounts,
            new BN(reserveMultiple),
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const setCardVestingInfo = async (
        cardID = 0,
        scheduleIds = [new BN(0), new BN(1)],
        from = admin
    ) => {
        const gasEstimate =
            await childSaleInstance.setCardVestingInfo.estimateGas(
                cardID,
                scheduleIds,
                { from: from }
            );
        return await childSaleInstance.setCardVestingInfo(cardID, scheduleIds, {
            from: from,
            gas: gasEstimate,
        });
    };

    const setMaxApproval = async (
        tokenInstance,
        spender,
        from = tokenWallet
    ) => {
        return await tokenInstance.approve(spender, constants.MAX_UINT256, {
            from: from,
        });
    };

    const validateCardVestingInfo = async (
        id,
        scheduleIds = [new BN(0), new BN(1)]
    ) => {
        const vestingInfo = await childSaleInstance.getCardVestingInfo(id);

        // check that the new card sale info has correct values
        vestingInfo.length.should.equal(scheduleIds.length);
        for (let i = 0; i < scheduleIds.length; i++) {
            vestingInfo[i].should.be.bignumber.equal(scheduleIds[i]);
        }
    };

    const validatePackageInfo = async (
        pkgId,
        cardIds,
        cardNums,
        scheduleIds
    ) => {
        const bundles = await childSaleInstance.getPackageInfo(pkgId);
        for (let i = 0; i < bundles.length; i++) {
            const bundle = bundles[i];
            bundle.cardID.should.be.bignumber.equal(cardIds[i]);
            bundle.numCards.should.be.bignumber.equal(cardNums[i]);
            for (let j = 0; j < bundle.scheduleIDs.length; j++) {
                bundle.scheduleIDs[j].should.be.bignumber.equal(
                    scheduleIds[i][j]
                );
            }
        }
    };

    const validateSchedule = async (
        id,
        cardInstance,
        tokenAddress,
        amount = baseDaoAmount,
        cliff = baseCliff,
        duration = baseDuration
    ) => {
        const schedule = await cardInstance.getSchedule(id);

        duration = new BN(duration);

        // check that the new schedule has correct values
        schedule["token"].should.be.equal(tokenAddress);
        schedule["amount"].should.be.bignumber.equal(amount);
        schedule["rate"].should.be.bignumber.equal(amount.div(duration));
        schedule["cliff"].should.be.bignumber.equal(cliff);
        schedule["duration"].should.be.bignumber.equal(duration);
    };

    const verifyTotalReserves = async (scheduleId, cardInstance, val) => {
        const reserves = await cardInstance.totalReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyAvailableReserves = async (scheduleId, cardInstance, val) => {
        const reserves = await cardInstance.availableReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyTokenBalance = async (token, address, amount) => {
        const tokenBalance = await token.balanceOf(address);
        tokenBalance.should.be.bignumber.equal(new BN(amount));
    };

    const verifyCardMinter = async (cardInstance, cardId, address) => {
        const cardMinter = await cardInstance.minterOf(new BN(cardId));
        cardMinter.should.be.equal(address);
    };

    const verifyCardOwner = async (cardInstance, cardId, address) => {
        const cardOwner = await cardInstance.ownerOf(new BN(cardId));
        cardOwner.should.be.equal(address);
    };

    const verifyCardBalance = async (cardInstance, address, amount) => {
        const cardBalance = await cardInstance.balanceOf(address);
        cardBalance.should.be.bignumber.equal(new BN(amount));
    };

    beforeEach(async () => {
        pinkCardInstance = await PinkCard.new(
            baseUri,
            baseDevWallet,
            baseMaxUriChanges,
            {
                from: admin,
            }
        );
        whiteCardInstance = await WhiteCard.new(
            baseUri,
            baseDevWallet,
            baseMaxUriChanges,
            {
                from: admin,
            }
        );
        daoInstance = await DaoToken.new("Phlip DAO", "PDAO", {
            from: tokenWallet,
        });
        p2eInstance = await P2eToken.new("Phlip P2E", "PEARN", {
            from: tokenWallet,
        });

        childSaleInstance = await FxSaleChildTunnel.new(
            pinkCardInstance.address,
            whiteCardInstance.address,
            daoInstance.address,
            p2eInstance.address,
            tokenWallet,
            tokenWallet,
            baseCliff,
            baseDuration,
            constants.ZERO_ADDRESS, // leave fxChild as 0x0 until we can mock it
            { from: admin }
        );

        // Grant child sale contract treasury & minter roles for pink cards
        await pinkCardInstance.grantRole(
            TREASURER_ROLE,
            childSaleInstance.address
        );
        await pinkCardInstance.grantRole(
            MINTER_ROLE,
            childSaleInstance.address
        );

        // Grant child sale contract treasury & minter roles for white cards
        await whiteCardInstance.grantRole(
            TREASURER_ROLE,
            childSaleInstance.address
        );
        await whiteCardInstance.grantRole(
            MINTER_ROLE,
            childSaleInstance.address
        );

        // Approve pink card contract to spend tokens on behalf of tokenWallet
        await setMaxApproval(daoInstance, pinkCardInstance.address);
        await setMaxApproval(p2eInstance, pinkCardInstance.address);

        // Approve white card contract to spend tokens on behalf of tokenWallet
        await setMaxApproval(daoInstance, whiteCardInstance.address);
        await setMaxApproval(p2eInstance, whiteCardInstance.address);
    });

    describe("Setting Card Vesting Info", async () => {
        beforeEach(async () => {
            await createAndFillDefaultSchedules();
        });

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setCardVestingInfo(0, [new BN(0), new BN(1)], otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when card ID is not valid", async () => {
            await expectRevert(setCardVestingInfo(4), "Invalid card ID");
        });
        it("should fail when vesting schedule does not exist", async () => {
            await expectRevert(
                setCardVestingInfo(0, [new BN(0), new BN(2)]),
                "Vesting schedule ID is invalid"
            );
        });

        // Passing case
        it("should pass when params are valid for pink text card", async () => {
            await setCardVestingInfo(0);
            await validateCardVestingInfo(0);
        });
        it("should pass when params are valid for pink image card", async () => {
            await setCardVestingInfo(1);
            await validateCardVestingInfo(1);
        });
        it("should pass when params are valid for white text card", async () => {
            await setCardVestingInfo(2);
            await validateCardVestingInfo(2);
        });
    });

    describe("Creating Single Card package", async () => {
        // Failure case

        it("should fail when number of cards is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, 0),
                "Number of cards is 0"
            );
        });
        it("should fail when DAO token amount is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, baseCardQty, 0),
                "DAO token amount is 0"
            );
        });
        it("should fail when P2E token amount is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, baseCardQty, baseDaoAmount, 0),
                "P2E token amount is 0"
            );
        });
        it("should fail when reserve multiple is 0", async () => {
            await expectRevert(
                createSingleCardPackage(
                    0,
                    baseCardQty,
                    baseDaoAmount,
                    baseP2eAmount,
                    0
                ),
                "Reserve multiple is 0"
            );
        });

        // Passing case
        it("should pass when package contains pink text cards", async () => {
            await createSingleCardPackage();

            // Ensure vesting schedules were created
            await validateSchedule(0, pinkCardInstance, daoInstance.address);
            await validateSchedule(1, pinkCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                pinkCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                pinkCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                0,
                [new BN(0)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
        it("should pass when package contains pink image cards", async () => {
            await createSingleCardPackage(1);

            // Ensure vesting schedules were created
            await validateSchedule(0, pinkCardInstance, daoInstance.address);
            await validateSchedule(1, pinkCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                pinkCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                pinkCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                0,
                [new BN(1)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
        it("should pass when package contains white text cards", async () => {
            await createSingleCardPackage(2);

            // Ensure vesting schedules were created
            await validateSchedule(0, whiteCardInstance, daoInstance.address);
            await validateSchedule(1, whiteCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                whiteCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                whiteCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                0,
                [new BN(2)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });

        it("should pass when package with same card & type has been created already", async () => {
            await createSingleCardPackage();
            await createSingleCardPackage();

            // Ensure vesting schedules were created
            await validateSchedule(2, pinkCardInstance, daoInstance.address);
            await validateSchedule(3, pinkCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                2,
                pinkCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                3,
                pinkCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                1,
                [new BN(0)],
                [baseCardQty],
                [[new BN(2), new BN(3)]]
            );
        });
        it("should pass when package with same card but different type has been created already", async () => {
            await createSingleCardPackage();

            await createSingleCardPackage(1);

            // Ensure vesting schedules were created
            await validateSchedule(2, pinkCardInstance, daoInstance.address);
            await validateSchedule(3, pinkCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                2,
                pinkCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                3,
                pinkCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                1,
                [new BN(1)],
                [baseCardQty],
                [[new BN(2), new BN(3)]]
            );
        });
        it("should pass when package with different card has been created already", async () => {
            await createSingleCardPackage();

            await createSingleCardPackage(2);

            // Ensure vesting schedules were created
            await validateSchedule(0, whiteCardInstance, daoInstance.address);
            await validateSchedule(1, whiteCardInstance, p2eInstance.address);

            // Ensure vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                whiteCardInstance,
                baseDaoAmount.mul(baseCardQty).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                whiteCardInstance,
                baseP2eAmount.mul(baseCardQty).mul(baseSaleQty)
            );

            // Ensure package was created correctly
            await validatePackageInfo(
                1,
                [new BN(2)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
    });

    describe("Creating Multi Card package", async () => {
        // Failure case
        it("should fail when number of cards is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    [new BN(0), new BN(1)],
                    [new BN(0), new BN(1)]
                ),
                "Number of cards is 0"
            );
        });
        it("should fail when DAO token amount is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    [new BN(0), new BN(1)],
                    [new BN(1), new BN(2)],
                    [tokenUnits(0), tokenUnits(200)]
                ),
                "DAO token amount is 0"
            );
        });
        it("should fail when P2E token amount is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    [new BN(0), new BN(1)],
                    [new BN(1), new BN(2)],
                    [tokenUnits(100), tokenUnits(200)],
                    [tokenUnits(0), tokenUnits(2000)]
                ),
                "P2E token amount is 0"
            );
        });

        // Passing case
        it("should pass when package contains pink text & image cards", async () => {
            await createMultiCardPackage();

            // Ensure text card vesting schedules were created
            await validateSchedule(
                0,
                pinkCardInstance,
                daoInstance.address,
                tokenUnits(100)
            );
            await validateSchedule(
                1,
                pinkCardInstance,
                p2eInstance.address,
                tokenUnits(1000)
            );

            // Ensure image card vesting schedules were created
            await validateSchedule(
                2,
                pinkCardInstance,
                daoInstance.address,
                tokenUnits(200)
            );
            await validateSchedule(
                3,
                pinkCardInstance,
                p2eInstance.address,
                tokenUnits(2000)
            );

            // Ensure text vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                pinkCardInstance,
                tokenUnits(100).mul(new BN(1)).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                pinkCardInstance,
                tokenUnits(1000).mul(new BN(1)).mul(baseSaleQty)
            );

            // Ensure image vesting schedule reserves were filled
            await verifyTotalReserves(
                2,
                pinkCardInstance,
                tokenUnits(200).mul(new BN(2)).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                3,
                pinkCardInstance,
                tokenUnits(2000).mul(new BN(2)).mul(baseSaleQty)
            );

            // Ensure package was created
            await validatePackageInfo(
                0,
                [new BN(0), new BN(1)],
                [new BN(1), new BN(2)],
                [
                    [new BN(0), new BN(1)],
                    [new BN(2), new BN(3)],
                ]
            );
        });
        it("should pass when package contains pink & white cards", async () => {
            await createMultiCardPackage([new BN(0), new BN(2)]);

            // Ensure text card vesting schedules were created
            await validateSchedule(
                0,
                pinkCardInstance,
                daoInstance.address,
                tokenUnits(100)
            );
            await validateSchedule(
                1,
                pinkCardInstance,
                p2eInstance.address,
                tokenUnits(1000)
            );

            // Ensure image card vesting schedules were created
            await validateSchedule(
                0,
                whiteCardInstance,
                daoInstance.address,
                tokenUnits(200)
            );
            await validateSchedule(
                1,
                whiteCardInstance,
                p2eInstance.address,
                tokenUnits(2000)
            );

            // Ensure text vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                pinkCardInstance,
                tokenUnits(100).mul(new BN(1)).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                pinkCardInstance,
                tokenUnits(1000).mul(new BN(1)).mul(baseSaleQty)
            );

            // Ensure image vesting schedule reserves were filled
            await verifyTotalReserves(
                0,
                whiteCardInstance,
                tokenUnits(200).mul(new BN(2)).mul(baseSaleQty)
            );
            await verifyTotalReserves(
                1,
                whiteCardInstance,
                tokenUnits(2000).mul(new BN(2)).mul(baseSaleQty)
            );

            // Ensure package was created
            await validatePackageInfo(
                0,
                [new BN(0), new BN(2)],
                [new BN(1), new BN(2)],
                [
                    [new BN(0), new BN(1)],
                    [new BN(0), new BN(1)],
                ]
            );
        });
    });
});

const CrowdSale = artifacts.require("PhlipSale");
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

contract("PhlipSale", (accounts) => {
    let saleInstance,
        pinkCardInstance,
        whiteCardInstance,
        daoInstance,
        p2eInstance;
    const [admin, tokenWallet, proceedsWallet, account1] = accounts;

    const baseCliff = new BN(100);
    const baseDuration = new BN(1000);
    const baseRate = tokenUnits(1);
    const baseDaoAmount = tokenUnits(1000);
    const baseP2eAmount = tokenUnits(1000);

    const baseSaleQty = new BN(2);
    const baseCardQty = new BN(2);

    const baseUri = "https.ipfs.moralis.io/ipfs/";
    const baseMaxUriChanges = new BN(1);

    const createSingleCardPackage = async (
        packageID = 0,
        weiPrice = tokenUnits(1),
        numForSale = baseSaleQty,
        numCards = baseCardQty,
        cardID = 0,
        daoAmount = baseDaoAmount,
        p2eAmount = baseP2eAmount,
        from = admin
    ) => {
        const gasEstimate =
            await saleInstance.createSingleCardPackage.estimateGas(
                packageID,
                weiPrice,
                new BN(numForSale),
                new BN(numCards),
                new BN(cardID),
                daoAmount,
                p2eAmount,
                {
                    from: from,
                }
            );
        return await saleInstance.createSingleCardPackage(
            packageID,
            weiPrice,
            new BN(numForSale),
            new BN(numCards),
            new BN(cardID),
            daoAmount,
            p2eAmount,
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const createMultiCardPackage = async (
        packageID = 0,
        weiPrice = tokenUnits(1),
        numForSale = baseSaleQty,
        cardIDs = [new BN(0), new BN(1)],
        numCards = [new BN(1), new BN(2)],
        daoAmounts = [tokenUnits(100), tokenUnits(200)],
        p2eAmounts = [tokenUnits(1000), tokenUnits(2000)],
        from = admin
    ) => {
        const gasEstimate =
            await saleInstance.createMultiCardPackage.estimateGas(
                packageID,
                weiPrice,
                new BN(numForSale),
                cardIDs,
                numCards,
                daoAmounts,
                p2eAmounts,
                {
                    from: from,
                }
            );
        return await saleInstance.createMultiCardPackage(
            packageID,
            weiPrice,
            new BN(numForSale),
            cardIDs,
            numCards,
            daoAmounts,
            p2eAmounts,
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const purchasePackage = async (
        packageID = 0,
        weiPrice = tokenUnits(1),
        from = account1
    ) => {
        const gasEstimate = await saleInstance.purchasePackage.estimateGas(
            packageID,
            { from: from, value: weiPrice }
        );
        return await saleInstance.purchasePackage(packageID, {
            from: from,
            value: weiPrice,
            gas: gasEstimate,
        });
    };

    const setPresaleActive = async (bool, from = admin) => {
        return await saleInstance.setPresaleActive(bool, {
            from: from,
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

    const verifyPackagePrice = async (pkgId, val) => {
        const price = await saleInstance.priceOf(pkgId);
        price.should.be.bignumber.equal(new BN(val));
    };

    const verifyRemainingForSale = async (pkgId, val) => {
        const remaining = await saleInstance.getPackagesRemaining(pkgId);
        remaining.should.be.bignumber.equal(new BN(val));
    };

    const validateCardBundle = async (
        pkgId,
        cardIds,
        cardNums,
        scheduleIds
    ) => {
        const bundles = await saleInstance.getCardBundles(pkgId);
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
        // console.log(bundles);
        // remaining.should.be.bignumber.equal(new BN(val));
    };

    const validateSchedule = async (
        id,
        cardInstance,
        tokenAddress,
        rate = baseRate,
        cliff = baseCliff,
        duration = baseDuration,
        amount = baseDaoAmount
    ) => {
        const schedule = await cardInstance.getSchedule(id);

        // check that the new schedule has correct values
        schedule["token"].should.be.equal(tokenAddress);
        schedule["rate"].should.be.bignumber.equal(rate);
        schedule["cliff"].should.be.bignumber.equal(cliff);
        schedule["duration"].should.be.bignumber.equal(duration);
        schedule["amount"].should.be.bignumber.equal(amount);
    };

    const verifyTotalReserves = async (scheduleId, cardInstance, val) => {
        const reserves = await cardInstance.totalReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyAvailableReserves = async (scheduleId, cardInstance, val) => {
        const reserves = await cardInstance.availableReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    beforeEach(async () => {
        pinkCardInstance = await PinkCard.new(baseUri, baseMaxUriChanges, {
            from: admin,
        });
        whiteCardInstance = await WhiteCard.new(baseUri, baseMaxUriChanges, {
            from: admin,
        });
        daoInstance = await DaoToken.new("Phlip DAO", "PDAO", {
            from: tokenWallet,
        });
        p2eInstance = await P2eToken.new("Phlip P2E", "PEARN", {
            from: tokenWallet,
        });

        saleInstance = await CrowdSale.new(
            pinkCardInstance.address,
            whiteCardInstance.address,
            daoInstance.address,
            p2eInstance.address,
            tokenWallet,
            tokenWallet,
            proceedsWallet,
            baseCliff,
            baseDuration,
            { from: admin }
        );

        // Grant sale contract treasury & minter roles for pink cards
        await pinkCardInstance.grantRole(TREASURER_ROLE, saleInstance.address);
        await pinkCardInstance.grantRole(MINTER_ROLE, saleInstance.address);

        // Grant sale contract treasury & minter roles for white cards
        await whiteCardInstance.grantRole(TREASURER_ROLE, saleInstance.address);
        await whiteCardInstance.grantRole(MINTER_ROLE, saleInstance.address);

        // Approve pink card contract to spend tokens on behalf of tokenWallet
        await setMaxApproval(daoInstance, pinkCardInstance.address);
        await setMaxApproval(p2eInstance, pinkCardInstance.address);

        // Approve white card contract to spend tokens on behalf of tokenWallet
        await setMaxApproval(daoInstance, whiteCardInstance.address);
        await setMaxApproval(p2eInstance, whiteCardInstance.address);
    });

    describe("Creating Single Card package", async () => {
        // Failure case
        it("should fail when package ID already exists", async () => {
            await createSingleCardPackage();
            await expectRevert(
                createSingleCardPackage(),
                "Package already exists"
            );
        });
        it("should fail when package price is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, 0),
                "Price cannot be 0"
            );
        });
        it("should fail when number of packages for sale is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, tokenUnits(1), 0),
                "Number of packages cannot be 0"
            );
        });
        it("should fail when number of cards is 0", async () => {
            await expectRevert(
                createSingleCardPackage(0, tokenUnits(1), 1, 0),
                "Number of cards cannot be 0"
            );
        });
        it("should fail when DAO token amount is 0", async () => {
            await expectRevert(
                createSingleCardPackage(
                    0,
                    tokenUnits(1),
                    1,
                    1,
                    0,
                    tokenUnits(0)
                ),
                "DAO token amount cannot be 0"
            );
        });
        it("should fail when P2E token amount is 0", async () => {
            await expectRevert(
                createSingleCardPackage(
                    0,
                    tokenUnits(1),
                    1,
                    1,
                    0,
                    baseDaoAmount,
                    tokenUnits(0)
                ),
                "P2E token amount cannot be 0"
            );
        });

        // Passing case
        it("should pass when package contains pink text cards", async () => {
            const receipt = await createSingleCardPackage();
            expectEvent(receipt, "CreatePackage", {
                id: new BN(0),
                price: tokenUnits(1),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(0, tokenUnits(1));
            await verifyRemainingForSale(0, baseSaleQty);
            await validateCardBundle(
                0,
                [new BN(0)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
        it("should pass when package contains pink image cards", async () => {
            const receipt = await createSingleCardPackage(
                0,
                tokenUnits(2),
                baseSaleQty,
                baseCardQty,
                1
            );

            expectEvent(receipt, "CreatePackage", {
                id: new BN(0),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(0, tokenUnits(2));
            await verifyRemainingForSale(0, baseSaleQty);
            await validateCardBundle(
                0,
                [new BN(1)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
        it("should pass when package contains white text cards", async () => {
            const receipt = await createSingleCardPackage(
                0,
                tokenUnits(2),
                baseSaleQty,
                baseCardQty,
                2
            );

            expectEvent(receipt, "CreatePackage", {
                id: new BN(0),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(0, tokenUnits(2));
            await verifyRemainingForSale(0, baseSaleQty);
            await validateCardBundle(
                0,
                [new BN(2)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });

        it("should pass when package with same card & type has been created already", async () => {
            await createSingleCardPackage();

            const receipt = await createSingleCardPackage(1);

            expectEvent(receipt, "CreatePackage", {
                id: new BN(1),
                price: tokenUnits(1),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(1, tokenUnits(1));
            await verifyRemainingForSale(1, baseSaleQty);
            await validateCardBundle(
                1,
                [new BN(0)],
                [baseCardQty],
                [[new BN(2), new BN(3)]]
            );
        });
        it("should pass when package with same card but different type has been created already", async () => {
            await createSingleCardPackage();

            const receipt = await createSingleCardPackage(
                1,
                tokenUnits(2),
                baseSaleQty,
                baseCardQty,
                1
            );

            expectEvent(receipt, "CreatePackage", {
                id: new BN(1),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(1, tokenUnits(2));
            await verifyRemainingForSale(1, baseSaleQty);
            await validateCardBundle(
                1,
                [new BN(1)],
                [baseCardQty],
                [[new BN(2), new BN(3)]]
            );
        });
        it("should pass when package with different card has been created already", async () => {
            await createSingleCardPackage();

            const receipt = await createSingleCardPackage(
                1,
                tokenUnits(2),
                baseSaleQty,
                baseCardQty,
                2
            );

            expectEvent(receipt, "CreatePackage", {
                id: new BN(1),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

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

            // Ensure package was created
            await verifyPackagePrice(1, tokenUnits(2));
            await verifyRemainingForSale(1, baseSaleQty);
            await validateCardBundle(
                1,
                [new BN(2)],
                [baseCardQty],
                [[new BN(0), new BN(1)]]
            );
        });
    });

    describe("Creating Multi Card package", async () => {
        // Failure case

        // Passing case
        it("should pass when params are valid", async () => {
            const receipt = await createMultiCardPackage();
            // await expectEvent(receipt, "AddToBlacklist", {
            //     account: account2,
            // });
            // await verifyBlacklisted(account2);
        });
    });

    describe("Purchasing Card package", async () => {
        beforeEach(async () => {
            await createMultiCardPackage();
        });

        // Failure case
        it("should fail when package ID is not valid", async () => {});
        it("should fail when presale is not active", async () => {});
        it("should fail when package sold out", async () => {});
        it("should fail when caller sends less ETH than package price", async () => {});

        // Passing case
        it("should pass when params are valid", async () => {
            await setPresaleActive(true);
            const receipt = await purchasePackage();
            // await expectEvent(receipt, "AddToBlacklist", {
            //     account: account2,
            // });
            // await verifyBlacklisted(account2);
        });
    });
});

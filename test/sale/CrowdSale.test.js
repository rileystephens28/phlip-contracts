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
    const [admin, tokenWallet, proceedsWallet, otherAccount] = accounts;

    const pinkTextSupply = 2; // will actualy be 675 cards
    const pinkImageSupply = 3; // will actualy be 675 cards
    const whiteTextSupply = 4; // will actualy be 9375 cards

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

    const setCardSaleInfo = async (
        cardID = 0,
        weiPrice = tokenUnits(1),
        scheduleIds = [new BN(0), new BN(1)],
        from = admin
    ) => {
        const gasEstimate = await saleInstance.setCardSaleInfo.estimateGas(
            cardID,
            weiPrice,
            scheduleIds,
            { from: from }
        );
        return await saleInstance.setCardSaleInfo(
            cardID,
            weiPrice,
            scheduleIds,
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const purchaseCard = async (
        cardID = 0,
        weiPrice = tokenUnits(1),
        uri = baseUri,
        from = otherAccount
    ) => {
        const gasEstimate = await saleInstance.purchaseCard.estimateGas(
            cardID,
            uri,
            { from: from, value: weiPrice }
        );
        return await saleInstance.purchaseCard(cardID, uri, {
            from: from,
            value: weiPrice,
            gas: gasEstimate,
        });
    };

    const purchasePackage = async (
        packageID = 0,
        weiPrice = tokenUnits(1),
        from = otherAccount
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

    const setSaleStatus = async (val, from = admin) => {
        return await saleInstance.setSaleStatus(val, {
            from: from,
        });
    };

    const setSaleInactive = async (from = admin) => {
        return await setSaleStatus(0, from);
    };

    const setPresaleActive = async (from = admin) => {
        return await setSaleStatus(1, from);
    };

    const setGeneralSaleActive = async (from = admin) => {
        return await setSaleStatus(2, from);
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

    const verifySaleStatus = async (val) => {
        const status = await saleInstance.saleStatus();
        status.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardPrice = async (cardId, val) => {
        const price = await saleInstance.getCardPrice(cardId);
        price.should.be.bignumber.equal(new BN(val));
    };

    const verifyPackagePrice = async (pkgId, val) => {
        const price = await saleInstance.getPackagePrice(pkgId);
        price.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardMaxSupply = async (cardId, val) => {
        const max = await saleInstance.maxSupplyOf(cardId);
        max.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardMintedSupply = async (cardId, val) => {
        const minted = await saleInstance.mintedSupplyOf(cardId);
        minted.should.be.bignumber.equal(new BN(val));
    };

    const verifyRemainingForSale = async (pkgId, val) => {
        const remaining = await saleInstance.getPackagesRemaining(pkgId);
        remaining.should.be.bignumber.equal(new BN(val));
    };

    const validateCardSaleInfo = async (
        id,
        cardInstance,
        price = tokenUnits(1),
        scheduleIds = [new BN(0), new BN(1)]
    ) => {
        const saleInfo = await saleInstance.getSaleInfo(id);

        // check that the new card sale info has correct values
        saleInfo["price"].should.be.bignumber.equal(price);
        saleInfo["scheduleIDs"].length.should.equal(scheduleIds.length);
        for (let i = 0; i < scheduleIds.length; i++) {
            saleInfo["scheduleIDs"][i].should.be.bignumber.equal(
                scheduleIds[i]
            );
        }
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
            pinkTextSupply,
            pinkImageSupply,
            whiteTextSupply,
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

    describe("Setting Sale Status", async () => {
        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setSaleStatus(1, otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when status is not valid", async () => {
            await expectRevert(setSaleStatus(4), "Invalid sale status");
        });

        // Passing case
        it("should pass when setting presale to active", async () => {
            await setPresaleActive();
            await verifySaleStatus(1);
        });
        it("should pass when setting general sale to active", async () => {
            await setGeneralSaleActive();
            await verifySaleStatus(2);
        });
        it("should pass when changing pre/general sale from active to inactive", async () => {
            await setPresaleActive();
            await verifySaleStatus(1);

            await setSaleInactive();
            await verifySaleStatus(0);

            await setGeneralSaleActive();
            await verifySaleStatus(2);

            await setSaleInactive();
            await verifySaleStatus(0);
        });
    });

    describe("Setting Card Purchase Info", async () => {
        beforeEach(async () => {
            await createAndFillDefaultSchedules();
        });

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setCardSaleInfo(
                    0,
                    tokenUnits(1),
                    [new BN(0), new BN(1)],
                    otherAccount
                ),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when card ID is not valid", async () => {
            await expectRevert(setCardSaleInfo(4), "Invalid card ID");
        });
        it("should fail when sale price is 0", async () => {
            await expectRevert(
                setCardSaleInfo(0, 0),
                "Price must be greater than 0"
            );
        });
        it("should fail when vesting schedule does not exist", async () => {
            await expectRevert(
                setCardSaleInfo(0, tokenUnits(1), [new BN(0), new BN(2)]),
                "Vesting schedule ID is invalid"
            );
        });

        // Passing case
        it("should pass when params are valid for pink text card", async () => {
            const price = tokenUnits(1);
            await setCardSaleInfo(0, price);
            await validateCardSaleInfo(0, price);
        });
        it("should pass when params are valid for pink image card", async () => {
            const price = tokenUnits(1.5);
            await setCardSaleInfo(1);
            await validateCardSaleInfo(1, price);
        });
        it("should pass when params are valid for white text card", async () => {
            const price = tokenUnits(0.5);
            await setCardSaleInfo(2);
            await validateCardSaleInfo(2, price);
        });
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
        it("should fail when package ID already exists", async () => {
            await createMultiCardPackage();
            await expectRevert(
                createMultiCardPackage(),
                "Package already exists"
            );
        });
        it("should fail when package price is 0", async () => {
            await expectRevert(
                createMultiCardPackage(0, 0),
                "Price cannot be 0"
            );
        });
        it("should fail when number of packages for sale is 0", async () => {
            await expectRevert(
                createMultiCardPackage(0, tokenUnits(1), 0),
                "Number of packages cannot be 0"
            );
        });
        it("should fail when number of cards is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    0,
                    tokenUnits(1),
                    baseSaleQty,
                    [new BN(0), new BN(1)],
                    [new BN(1), new BN(0)]
                ),
                "Number of cards cannot be 0"
            );
        });
        it("should fail when DAO token amount is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    0,
                    tokenUnits(1),
                    baseSaleQty,
                    [new BN(0), new BN(1)],
                    [new BN(1), new BN(2)],
                    [tokenUnits(0), tokenUnits(200)]
                ),
                "DAO token amount cannot be 0"
            );
        });
        it("should fail when P2E token amount is 0", async () => {
            await expectRevert(
                createMultiCardPackage(
                    0,
                    tokenUnits(1),
                    baseSaleQty,
                    [new BN(0), new BN(1)],
                    [new BN(1), new BN(2)],
                    [tokenUnits(100), tokenUnits(200)],
                    [tokenUnits(0), tokenUnits(200)]
                ),
                "P2E token amount cannot be 0"
            );
        });

        // Passing case
        it("should pass when package contains pink text & image cards", async () => {
            const receipt = await createMultiCardPackage();
            expectEvent(receipt, "CreatePackage", {
                id: new BN(0),
                price: tokenUnits(1),
                numForSale: baseSaleQty,
            });

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
            await verifyPackagePrice(0, tokenUnits(1));
            await verifyRemainingForSale(0, baseSaleQty);
            await validateCardBundle(
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
            const receipt = await createMultiCardPackage(
                0,
                tokenUnits(2),
                baseSaleQty,
                [new BN(0), new BN(2)]
            );
            expectEvent(receipt, "CreatePackage", {
                id: new BN(0),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

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
            await verifyPackagePrice(0, tokenUnits(2));
            await verifyRemainingForSale(0, baseSaleQty);
            await validateCardBundle(
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

    describe("Purchasing Card Packages", async () => {
        beforeEach(async () => {
            await createSingleCardPackage();
            await createMultiCardPackage(1);
            await setPresaleActive();
        });

        // Failure case
        it("should fail when package ID is not valid", async () => {
            await expectRevert(
                purchasePackage(2, tokenUnits(1)),
                "Package does not exist"
            );
        });
        it("should fail when sale is not active", async () => {
            await setSaleInactive();
            await expectRevert(purchasePackage(), "Presale is not active");
        });
        it("should fail when general sale is active", async () => {
            await setGeneralSaleActive();
            await expectRevert(purchasePackage(), "Presale is not active");
        });
        it("should fail when package sold out", async () => {
            for (let i = 0; i < baseSaleQty; i++) {
                await purchasePackage();
            }
            await expectRevert(purchasePackage(), "Package not available");
        });
        it("should fail when caller sends less ETH than package price", async () => {
            await expectRevert(
                purchasePackage(0, tokenUnits(0.5)),
                "Not enough ETH to cover cost"
            );
        });

        // Passing case
        it("should pass when purchasing single card package", async () => {
            const receipt = await purchasePackage();
            expectEvent(receipt, "PurchasePackage", {
                id: new BN(0),
                purchaser: otherAccount,
            });

            // Ensure package was marked as sold
            await verifyRemainingForSale(0, baseSaleQty - 1);
            await verifyCardMaxSupply(0, pinkTextSupply);
            await verifyCardMintedSupply(0, 2);

            // Ensure account was credited with correct number & type of cards
            await verifyCardBalance(pinkCardInstance, otherAccount, 2);
            await verifyCardOwner(pinkCardInstance, 0, otherAccount);
            await verifyCardOwner(pinkCardInstance, 1, otherAccount);
        });
    });

    describe("Purchasing Cards", async () => {
        beforeEach(async () => {
            // Create pink card vesting schedules and fill reserves
            await createAndFillDefaultSchedules();

            // Set sale info for pink text/image and white text cards
            await setCardSaleInfo(0, tokenUnits(1));
            await setCardSaleInfo(1, tokenUnits(1));
            await setCardSaleInfo(2, tokenUnits(1));

            await setGeneralSaleActive();
        });

        // Failure case
        it("should fail when card ID is not valid or sale info not set", async () => {
            await expectRevert(purchaseCard(4), "Not available for sale");
        });
        it("should fail when sale is not active", async () => {
            await setSaleInactive();
            await expectRevert(purchaseCard(), "General sale is not active");
        });
        it("should fail when presale is active", async () => {
            await setPresaleActive();
            await expectRevert(purchaseCard(), "General sale is not active");
        });
        it("should fail when caller sends less ETH than card price", async () => {
            await expectRevert(
                purchaseCard(0, tokenUnits(0.5)),
                "Not enough ETH to cover cost"
            );
        });
        it("should fail when max supply is reached", async () => {
            // Purchase both available pink text cards
            const totalSupply = await saleInstance.maxSupplyOf(0);
            for (let i = 0; i < totalSupply; i++) {
                await purchaseCard(0);
            }

            // Attempt to purchase another card
            await expectRevert(purchaseCard(), "Max supply reached");
        });

        // Passing case
        it("should pass when purchasing pink text cards", async () => {
            const price = await saleInstance.getCardPrice(0);
            await purchaseCard(0, price);

            // Ensure card was marked as sold
            await verifyCardMintedSupply(0, 1);

            // Ensure account was credited with card
            await verifyCardOwner(pinkCardInstance, 0, otherAccount);
            await verifyCardBalance(pinkCardInstance, otherAccount, 1);
        });
        it("should pass when purchasing pink image cards", async () => {
            const price = await saleInstance.getCardPrice(1);
            await purchaseCard(1, price);

            // Ensure card was marked as sold
            await verifyCardMintedSupply(1, 1);

            // Ensure account was credited with card
            await verifyCardOwner(pinkCardInstance, 0, otherAccount);
            await verifyCardBalance(pinkCardInstance, otherAccount, 1);
        });
        it("should pass when purchasing white text cards", async () => {
            const price = await saleInstance.getCardPrice(2);
            await purchaseCard(2, price);

            // Ensure card was marked as sold
            await verifyCardMintedSupply(2, 1);

            // Ensure account was credited with card
            await verifyCardOwner(whiteCardInstance, 0, otherAccount);
            await verifyCardBalance(whiteCardInstance, otherAccount, 1);
        });
    });
});

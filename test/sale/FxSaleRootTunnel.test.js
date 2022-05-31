const FxSaleRootTunnel = artifacts.require("FxSaleRootTunnel");
const FxRoot = artifacts.require("FxRootMock");

const {
    BN,
    expectRevert,
    expectEvent,
    constants,
    time,
} = require("@openzeppelin/test-helpers");
const { tokenUnits } = require("../helpers");
require("chai").should();

contract("FxSaleRootTunnel", (accounts) => {
    let rootSaleInstance;
    const [
        owner,
        checkpointManager,
        fxChildTunnel,
        proceedsWallet,
        standardAffiliate,
        customAffiliate,
        otherAccount,
    ] = accounts;

    const baseSaleQty = new BN(2);
    const baseCardQty = [new BN(1), new BN(2), new BN(3), new BN(0)];
    const baseCommission = new BN(500); // 5%
    const customCommission = new BN(1000); // 10%
    const maxCommission = new BN(10000);

    const registerChildPackage = async (
        packageID = 0,
        weiPrice = tokenUnits(2),
        numForSale = baseSaleQty,
        numCards = baseCardQty,
        from = owner
    ) => {
        const gasEstimate =
            await rootSaleInstance.registerChildPackage.estimateGas(
                packageID,
                weiPrice,
                new BN(numForSale),
                numCards,
                {
                    from: from,
                }
            );
        return await rootSaleInstance.registerChildPackage(
            packageID,
            weiPrice,
            new BN(numForSale),
            numCards,
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const setCardMaxSupply = async (
        cardID = 0,
        supply = new BN(3),
        from = owner
    ) => {
        const gasEstimate = await rootSaleInstance.setCardMaxSupply.estimateGas(
            cardID,
            supply,
            { from: from }
        );
        return await rootSaleInstance.setCardMaxSupply(cardID, supply, {
            from: from,
            gas: gasEstimate,
        });
    };

    const setCardPrice = async (
        cardID = 0,
        weiPrice = tokenUnits(2),
        from = owner
    ) => {
        const gasEstimate = await rootSaleInstance.setCardPrice.estimateGas(
            cardID,
            weiPrice,
            { from: from }
        );
        return await rootSaleInstance.setCardPrice(cardID, weiPrice, {
            from: from,
            gas: gasEstimate,
        });
    };

    const purchaseCard = async (
        cardID = 0,
        campaignId = 0,
        affiliateId = 0,
        msgValue = tokenUnits(2),
        from = otherAccount
    ) => {
        const gasEstimate = await rootSaleInstance.purchaseCard.estimateGas(
            cardID,
            campaignId,
            affiliateId,
            { from: from, value: msgValue }
        );
        return await rootSaleInstance.purchaseCard(
            cardID,
            campaignId,
            affiliateId,
            {
                from: from,
                value: msgValue,
                gas: gasEstimate,
            }
        );
    };

    const purchasePackage = async (
        packageID = 0,
        campaignId = 0,
        affiliateId = 0,
        msgValue = tokenUnits(2),
        from = otherAccount
    ) => {
        const gasEstimate = await rootSaleInstance.purchasePackage.estimateGas(
            packageID,
            campaignId,
            affiliateId,
            { from: from, value: msgValue }
        );
        return await rootSaleInstance.purchasePackage(
            packageID,
            campaignId,
            affiliateId,
            {
                from: from,
                value: msgValue,
                gas: gasEstimate,
            }
        );
    };

    const setSaleStatus = async (val, from = owner) => {
        return await rootSaleInstance.setSaleStatus(val, {
            from: from,
        });
    };

    const setSaleInactive = async (from = owner) => {
        return await setSaleStatus(0, from);
    };

    const setPresaleActive = async (from = owner) => {
        return await setSaleStatus(1, from);
    };

    const setGeneralSaleActive = async (from = owner) => {
        return await setSaleStatus(2, from);
    };

    const createCampaign = async (
        from = owner,
        commission = baseCommission,
        startTime = null,
        endTime = null,
        uri = "testUri"
    ) => {
        if (startTime === null) {
            startTime = await time.latest();
            startTime = startTime.add(time.duration.hours(1));
        }
        if (endTime === null) {
            endTime = startTime.add(time.duration.days(1));
        }
        return await rootSaleInstance.createCampaign(
            startTime,
            endTime,
            commission,
            uri,
            { from: from }
        );
    };

    const addCustomAffiliate = async (
        from = owner,
        campaignId = 1,
        affiliate = customAffiliate,
        commission = customCommission
    ) => {
        return await rootSaleInstance.addCustomAffiliate(
            campaignId,
            affiliate,
            commission,
            { from: from }
        );
    };

    const affiliateSignUp = async (
        campaignId = 1,
        from = standardAffiliate
    ) => {
        return await rootSaleInstance.affiliateSignUp(campaignId, {
            from: from,
        });
    };

    const withdrawAffiliateRewards = async (
        affiliateId = 1,
        from = standardAffiliate
    ) => {
        return await rootSaleInstance.withdrawAffiliateRewards(affiliateId, {
            from: from,
        });
    };

    const verifySaleStatus = async (val) => {
        const status = await rootSaleInstance.saleStatus();
        status.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardPrice = async (cardId, val) => {
        const price = await rootSaleInstance.getCardPrice(cardId);
        price.should.be.bignumber.equal(new BN(val));
    };

    const verifyPackagePrice = async (pkgId, val) => {
        const price = await rootSaleInstance.getPackagePrice(pkgId);
        price.should.be.bignumber.equal(new BN(val));
    };

    const verifyRemainingForSale = async (pkgId, val) => {
        const remaining = await rootSaleInstance.getPackagesRemaining(pkgId);
        remaining.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardsInPackage = async (pkgId, arr) => {
        const cardsInPackage = await rootSaleInstance.getCardsInPackage(pkgId);
        cardsInPackage.length.should.be.equal(4);
        cardsInPackage[0].should.be.bignumber.equal(new BN(arr[0]));
        cardsInPackage[1].should.be.bignumber.equal(new BN(arr[1]));
        cardsInPackage[2].should.be.bignumber.equal(new BN(arr[2]));
        cardsInPackage[3].should.be.bignumber.equal(new BN(arr[3]));
    };

    const verifyCardMaxSupply = async (cardId, val) => {
        const max = await rootSaleInstance.maxSupplyOf(cardId);
        max.should.be.bignumber.equal(new BN(val));
    };

    const verifyCardMintedSupply = async (cardId, val) => {
        const minted = await rootSaleInstance.mintedSupplyOf(cardId);
        minted.should.be.bignumber.equal(new BN(val));
    };

    const verifyUnclaimedRewards = async (affiliateId, val) => {
        const rewards = await rootSaleInstance.unclaimedRewardsOf(affiliateId);
        rewards.should.be.bignumber.equal(new BN(val));
    };

    beforeEach(async () => {
        // Must use fxRoot mock contract rather than basic EOA address
        // because EOA addresses will revert when _sendMessageToChild is called
        const fxRoot = await FxRoot.new();
        rootSaleInstance = await FxSaleRootTunnel.new(
            checkpointManager,
            fxRoot.address,
            proceedsWallet,
            { from: owner }
        );

        await rootSaleInstance.setFxChildTunnel(fxChildTunnel);
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

    describe("Setting Card Max Supply", async () => {
        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setCardMaxSupply(0, new BN(2), otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when supply is 0", async () => {
            await expectRevert(
                setCardMaxSupply(0, 0),
                "Supply must be greater than 0"
            );
        });
        it("should fail when presale is active", async () => {
            await setPresaleActive();
            await expectRevert(setCardMaxSupply(), "Cannot change during sale");
        });

        it("should fail when general sale is active", async () => {
            await setGeneralSaleActive();
            await expectRevert(setCardMaxSupply(), "Cannot change during sale");
        });

        // Passing case
        it("should pass when caller is contract owner ans supply > 0", async () => {
            await setCardMaxSupply(0, new BN(5));
            await verifyCardMaxSupply(0, new BN(5));
        });
    });

    describe("Setting Card Price", async () => {
        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setCardPrice(0, tokenUnits(1), otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when card ID is not valid", async () => {
            await expectRevert(setCardPrice(4), "Invalid card ID");
        });
        it("should fail when price is 0", async () => {
            await expectRevert(
                setCardPrice(0, 0),
                "Price must be greater than 0"
            );
        });

        // Passing case
        it("should pass when params are valid for pink text card", async () => {
            const price = tokenUnits(1);
            await setCardPrice(0, price);
            await verifyCardPrice(0, price);
        });
        it("should pass when params are valid for pink image card", async () => {
            const price = tokenUnits(2);
            await setCardPrice(1, price);
            await verifyCardPrice(1, price);
        });
        it("should pass when params are valid for white text card", async () => {
            const price = tokenUnits(3);
            await setCardPrice(2, price);
            await verifyCardPrice(2, price);
        });
    });

    describe("Creating Affiliate Campaign", async () => {
        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                createCampaign(otherAccount),
                "Ownable: caller is not the owner"
            );
        });

        it("should pass when caller is owner and params are valid", async () => {
            await createCampaign();

            const campaign = await rootSaleInstance.getCampaign(1);
            campaign["owner"].should.be.equal(owner);
        });
    });

    describe("Adding Custom Affiliate", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                addCustomAffiliate(otherAccount),
                "Ownable: caller is not the owner"
            );
        });

        it("should fail when account has already registered as affiliate", async () => {
            await addCustomAffiliate();
            await expectRevert(
                addCustomAffiliate(),
                "AffiliateMarketing: Already joined campaign"
            );
        });

        it("should pass when caller is owner and params are valid", async () => {
            await addCustomAffiliate();

            const isRegistered = await rootSaleInstance.affiliateIsRegistered(
                1,
                1
            );
            isRegistered.should.be.equal(true);
        });
    });

    describe("Signing up as Affiliate", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign ID is invalid", async () => {
            await expectRevert(
                affiliateSignUp(5),
                "AffiliateMarketing: Campaign does not exist"
            );
        });

        it("should fail when account has already registered as affiliate", async () => {
            await affiliateSignUp();
            await expectRevert(
                affiliateSignUp(),
                "AffiliateMarketing: Already joined campaign"
            );
        });

        it("should pass when caller is owner and params are valid", async () => {
            await affiliateSignUp();

            const isRegistered = await rootSaleInstance.affiliateIsRegistered(
                1,
                1
            );
            isRegistered.should.be.equal(true);
        });
    });

    describe("Registering Child Card Packages", async () => {
        // Failure case
        it("should fail when caller is not owner", async () => {
            await expectRevert(registerChildPackage(0, 0), "Price cannot be 0");
        });
        it("should fail when package ID has already been registered", async () => {
            await registerChildPackage();
            await expectRevert(
                registerChildPackage(),
                "Package already registered"
            );
        });
        it("should fail when package price is 0", async () => {
            await expectRevert(registerChildPackage(0, 0), "Price cannot be 0");
        });
        it("should fail when number of packages for sale is 0", async () => {
            await expectRevert(
                registerChildPackage(0, tokenUnits(1), 0),
                "Number of packages cannot be 0"
            );
        });
        it("should fail when number of cards in package is 0", async () => {
            await expectRevert(
                registerChildPackage(0, tokenUnits(2), baseSaleQty, [
                    new BN(0),
                    new BN(0),
                    new BN(0),
                    new BN(0),
                ]),
                "Must contain at least one card"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            const receipt = await registerChildPackage();
            expectEvent(receipt, "RegisterPackage", {
                id: new BN(0),
                price: tokenUnits(2),
                numForSale: baseSaleQty,
            });

            // Ensure package was created
            await verifyPackagePrice(0, tokenUnits(2));
            await verifyRemainingForSale(0, baseSaleQty);
            await verifyCardsInPackage(0, baseCardQty);
        });
    });

    describe("Purchasing Card Packages", async () => {
        let startTime;
        beforeEach(async () => {
            await registerChildPackage();

            // Create presale campaign
            startTime = await time.latest();
            startTime = startTime.add(time.duration.days(1));
            await createCampaign(owner, baseCommission, startTime);

            // Activate presale
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
                purchasePackage(0, 0, 0, tokenUnits(1)),
                "Not enough ETH to cover cost"
            );
        });
        it("should fail when campaign ID is invalid", async () => {
            await expectRevert(
                purchasePackage(0, 5, 1),
                "AffiliateMarketing: Campaign not active"
            );
        });
        it("should fail when campaign has not begun", async () => {
            await affiliateSignUp();

            await expectRevert(
                purchasePackage(0, 1, 1),
                "AffiliateMarketing: Campaign not active"
            );
        });
        it("should fail when affiliate ID not registered with campaign", async () => {
            await expectRevert(
                purchasePackage(0, 1, 5),
                "AffiliateMarketing: Campaign not active"
            );
        });
        it("should fail when number of cards remaining is not enough to fulfill package", async () => {
            await setSaleInactive();

            // Set max supplies to low values to ensure we can purchase all cards
            await setCardMaxSupply(0, new BN(4));
            await setCardMaxSupply(1, new BN(3));
            await setCardMaxSupply(2, new BN(3));
            await setCardMaxSupply(3, new BN(2));

            await setPresaleActive();

            await purchasePackage();

            await expectRevert(purchasePackage(), "Not enough cards remaining");
        });

        // Passing case
        it("should pass when referred by standard affiliate", async () => {
            await affiliateSignUp();

            time.increaseTo(startTime.add(time.duration.minutes(1)));

            const receipt = await purchasePackage(0, 1, 1);
            expectEvent(receipt, "PurchasePackage", {
                id: new BN(0),
                purchaser: otherAccount,
            });

            // Ensure package was marked as sold
            await verifyRemainingForSale(0, baseSaleQty - 1);

            const expectedReward = tokenUnits(2)
                .mul(baseCommission)
                .div(maxCommission);

            await verifyUnclaimedRewards(1, expectedReward);
        });

        it("should pass when referred by custom affiliate", async () => {
            await addCustomAffiliate();

            time.increaseTo(startTime.add(time.duration.minutes(1)));

            const receipt = await purchasePackage(0, 1, 1);
            expectEvent(receipt, "PurchasePackage", {
                id: new BN(0),
                purchaser: otherAccount,
            });

            // Ensure package was marked as sold
            await verifyRemainingForSale(0, baseSaleQty - 1);

            const expectedReward = tokenUnits(2)
                .mul(customCommission)
                .div(maxCommission);

            await verifyUnclaimedRewards(1, expectedReward);
        });
    });

    describe("Purchasing Cards", async () => {
        beforeEach(async () => {
            // Set max supplies to low values to ensure we can purchase all cards
            await setCardMaxSupply(0, new BN(2));
            await setCardMaxSupply(1, new BN(3));
            await setCardMaxSupply(2, new BN(4));
            await setCardMaxSupply(3, new BN(5));

            // Set sale info for pink text/image and white text cards
            await setCardPrice(0, tokenUnits(2));
            await setCardPrice(1, tokenUnits(2));
            await setCardPrice(2, tokenUnits(2));

            // Create presale campaign
            startTime = await time.latest();
            startTime = startTime.add(time.duration.days(1));
            await createCampaign(owner, baseCommission, startTime);

            await setGeneralSaleActive();
        });

        // Failure case
        it("should fail when card ID is invalid", async () => {
            await expectRevert(purchaseCard(5), "Invalid card ID");
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
                purchaseCard(0, 0, 0, tokenUnits(1)),
                "Not enough ETH to cover cost"
            );
        });
        it("should fail when max supply is reached", async () => {
            // Purchase both available pink text cards
            const totalSupply = await rootSaleInstance.maxSupplyOf(0);
            for (let i = 0; i < totalSupply; i++) {
                await purchaseCard(0);
            }

            // Attempt to purchase another card
            await expectRevert(purchaseCard(), "Max supply reached");
        });
        it("should fail when campaign ID is invalid", async () => {
            await expectRevert(
                purchaseCard(0, 5, 1),
                "AffiliateMarketing: Campaign not active"
            );
        });
        it("should fail when campaign has not begun", async () => {
            await affiliateSignUp();

            await expectRevert(
                purchaseCard(0, 1, 1),
                "AffiliateMarketing: Campaign not active"
            );
        });
        it("should fail when affiliate ID not registered with campaign", async () => {
            await expectRevert(
                purchaseCard(0, 1, 5),
                "AffiliateMarketing: Campaign not active"
            );
        });

        // Passing case
        it("should pass when purchasing pink text cards", async () => {
            const price = await rootSaleInstance.getCardPrice(0);
            const receipt = await purchaseCard(0, 0, 0, price);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(0),
                purchaser: otherAccount,
            });

            // Ensure card was marked as sold
            await verifyCardMintedSupply(0, 1);
        });
        it("should pass when purchasing pink image cards", async () => {
            const price = await rootSaleInstance.getCardPrice(1);
            const receipt = await purchaseCard(1, 0, 0, price);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(1),
                purchaser: otherAccount,
            });
            // Ensure card was marked as sold
            await verifyCardMintedSupply(1, 1);
        });
        it("should pass when purchasing white text cards", async () => {
            const price = await rootSaleInstance.getCardPrice(2);
            const receipt = await purchaseCard(2, 0, 0, price);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(2),
                purchaser: otherAccount,
            });

            // Ensure card was marked as sold
            await verifyCardMintedSupply(2, 1);
        });
        it("should pass when referred by standard affiliate", async () => {
            await affiliateSignUp();

            time.increaseTo(startTime.add(time.duration.minutes(1)));

            const price = await rootSaleInstance.getCardPrice(0);
            const receipt = await purchaseCard(0, 1, 1, price);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(0),
                purchaser: otherAccount,
            });

            // Ensure card was marked as sold
            await verifyCardMintedSupply(0, 1);

            const expectedReward = price.mul(baseCommission).div(maxCommission);

            await verifyUnclaimedRewards(1, expectedReward);
        });

        it("should pass when referred by custom affiliate", async () => {
            await addCustomAffiliate();

            time.increaseTo(startTime.add(time.duration.minutes(1)));

            const price = await rootSaleInstance.getCardPrice(2);
            const receipt = await purchaseCard(2, 1, 1, price);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(2),
                purchaser: otherAccount,
            });

            // Ensure card was marked as sold
            await verifyCardMintedSupply(2, 1);

            const expectedReward = price
                .mul(customCommission)
                .div(maxCommission);

            await verifyUnclaimedRewards(1, expectedReward);
        });
    });

    describe("Withdrawing Affiliate Rewards", async () => {
        beforeEach(async () => {
            // Create campaign and add affiliate
            let startTime = await time.latest();
            startTime = startTime.add(time.duration.days(1));
            await createCampaign(owner, baseCommission, startTime);
            await affiliateSignUp();

            await setGeneralSaleActive();

            time.increaseTo(startTime.add(time.duration.minutes(1)));

            const price = tokenUnits(2);
            await setCardPrice(0, price);
            await purchaseCard(0, 1, 1, price);
        });

        // Failure case
        it("should fail when caller does not match affiliate account address", async () => {
            await expectRevert(
                withdrawAffiliateRewards(1, otherAccount),
                "Caller is not affiliate"
            );
        });

        it("should pass when caller does match affiliate account address", async () => {
            const expectedReward = tokenUnits(2)
                .mul(baseCommission)
                .div(maxCommission);

            await verifyUnclaimedRewards(1, expectedReward);

            await withdrawAffiliateRewards();

            await verifyUnclaimedRewards(1, 0);
        });
    });
});

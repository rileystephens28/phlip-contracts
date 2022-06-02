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

const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const { web3 } = require("@openzeppelin/test-helpers/src/setup");

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

    const whitelistedAddresses = accounts.slice(8);

    const baseSaleQty = new BN(2);
    const baseCardQty = [new BN(1), new BN(2), new BN(3), new BN(0)];
    const baseCommission = new BN(500); // 5%
    const customCommission = new BN(1000); // 10%
    const maxCommission = new BN(10000);

    /***********************************|
    |     SALE MANAGEMENT FUNCTIONS     |
    |__________________________________*/

    const createSale = async (
        cardLimit = 5,
        packageLimit = 5,
        merkleRoot = constants.ZERO_BYTES32,
        from = owner
    ) => {
        const gasEstimate = await rootSaleInstance.createSale.estimateGas(
            merkleRoot,
            new BN(cardLimit),
            new BN(packageLimit),
            { from: from }
        );
        return await rootSaleInstance.createSale(
            merkleRoot,
            new BN(cardLimit),
            new BN(packageLimit),
            {
                from: from,
                gas: gasEstimate,
            }
        );
    };

    const setWhitelist = async (
        saleID = 0,
        _merkleRoot = constants.ZERO_BYTES32,
        from = owner
    ) => {
        const gasEstimate = await rootSaleInstance.setWhitelist.estimateGas(
            saleID,
            _merkleRoot,
            { from: from }
        );
        return await rootSaleInstance.setWhitelist(saleID, _merkleRoot, {
            from: from,
            gas: gasEstimate,
        });
    };

    const setActiveSale = async (saleID = 1, from = owner) => {
        return await rootSaleInstance.setActiveSale(saleID, {
            from: from,
        });
    };

    /***********************************|
    | CARD/PACKAGE MANAGEMENT FUNCTIONS |
    |__________________________________*/

    const registerChildPackage = async (
        packageID = 0,
        weiPrice = tokenUnits(2),
        numForSale = baseSaleQty,
        numCards = baseCardQty,
        saleIds = [new BN(1)],
        from = owner
    ) => {
        const gasEstimate =
            await rootSaleInstance.registerChildPackage.estimateGas(
                packageID,
                weiPrice,
                new BN(numForSale),
                numCards,
                saleIds,
                {
                    from: from,
                }
            );
        return await rootSaleInstance.registerChildPackage(
            packageID,
            weiPrice,
            new BN(numForSale),
            numCards,
            saleIds,
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

    /***********************************|
    |        PURCHASE FUNCTIONS         |
    |__________________________________*/

    const purchaseCard = async (
        cardID = 0,
        campaignId = 0,
        affiliateId = 0,
        msgValue = tokenUnits(2),
        merkleProof = [],
        from = otherAccount
    ) => {
        const gasEstimate = await rootSaleInstance.purchaseCard.estimateGas(
            cardID,
            campaignId,
            affiliateId,
            merkleProof,
            { from: from, value: msgValue }
        );
        return await rootSaleInstance.purchaseCard(
            cardID,
            campaignId,
            affiliateId,
            merkleProof,
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
        merkleProof = [],
        from = otherAccount
    ) => {
        const gasEstimate = await rootSaleInstance.purchasePackage.estimateGas(
            packageID,
            campaignId,
            affiliateId,
            merkleProof,
            { from: from, value: msgValue }
        );
        return await rootSaleInstance.purchasePackage(
            packageID,
            campaignId,
            affiliateId,
            merkleProof,
            {
                from: from,
                value: msgValue,
                gas: gasEstimate,
            }
        );
    };

    /***********************************|
    |    AFFILIATE CAMPAIGN FUNCTIONS   |
    |__________________________________*/

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

    /***********************************|
    |       VALIDATION FUNCTIONS        |
    |__________________________________*/

    const verifyActiveSale = async (val) => {
        const activeSale = await rootSaleInstance.getActiveSale();
        activeSale.should.be.bignumber.equal(new BN(val));
    };

    const verifySaleInfo = async (
        saleId,
        cardLimit,
        packageLimit,
        merkleRootWhitelist
    ) => {
        merkleRootWhitelist = web3.utils.isHex(merkleRootWhitelist)
            ? merkleRootWhitelist
            : web3.utils.toHex(merkleRootWhitelist);
        const sale = await rootSaleInstance.getSaleInfo(saleId);
        sale["cardLimit"].should.be.bignumber.equal(new BN(cardLimit));
        sale["packageLimit"].should.be.bignumber.equal(new BN(packageLimit));
        sale["merkleRootWhitelist"].should.equal(merkleRootWhitelist);
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

    /***********************************|
    |         HELPER FUNCTIONS          |
    |__________________________________*/

    const getMerkleTree = (addresses) => {
        const leafNodes = addresses.map((addr) => keccak256(addr));
        return new MerkleTree(leafNodes, keccak256, {
            sortPairs: true,
        });
    };

    const getMerkleRoot = (addresses) => {
        const merkleTree = getMerkleTree(addresses);
        return merkleTree.getRoot();
    };

    const getMerkleProof = (addresses, claimingAddress) => {
        const merkleTree = getMerkleTree(addresses);

        const hashedAddress = keccak256(claimingAddress);
        return merkleTree.getHexProof(hashedAddress);
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

    describe("Creating Sales", async () => {
        const merkleRoot = getMerkleRoot(whitelistedAddresses);

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                createSale(5, 5, merkleRoot, otherAccount),
                "Ownable: caller is not the owner"
            );
        });

        // Passing case
        it("should pass when card limit is 0", async () => {
            await createSale(0, 5, merkleRoot);
            await verifySaleInfo(1, 0, 5, merkleRoot);
        });
        it("should pass when package limit is 0", async () => {
            await createSale(5, 0, merkleRoot);
            await verifySaleInfo(1, 5, 0, merkleRoot);
        });
        it("should pass when merkle root is not provided", async () => {
            await createSale(5, 5, constants.ZERO_BYTES32);
            await verifySaleInfo(1, 5, 5, constants.ZERO_BYTES32);
        });
    });

    describe("Setting Active Sale", async () => {
        beforeEach(async () => {
            await createSale();
        });

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setActiveSale(1, otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when sale ID is not valid", async () => {
            await expectRevert(setActiveSale(4), "Invalid sale ID");
        });

        // Passing case
        it("should pass when setting active sale from non-active (0) sale", async () => {
            await setActiveSale(1);
            await verifyActiveSale(1);
        });
        it("should pass when setting active sale to non-active (0) sale", async () => {
            await setActiveSale(1);
            await setActiveSale(0);
            await verifyActiveSale(0);
        });
        it("should pass when changing active sales", async () => {
            await createSale();

            await setActiveSale(1);
            await setActiveSale(2);
            await verifyActiveSale(2);
        });
    });

    describe("Setting Sale Whitelist", async () => {
        const baseWhitelistRoot = getMerkleRoot(whitelistedAddresses);

        beforeEach(async () => {
            await createSale();
        });

        // Failure case
        it("should fail when caller is not contract owner", async () => {
            await expectRevert(
                setWhitelist(1, baseWhitelistRoot, otherAccount),
                "Ownable: caller is not the owner"
            );
        });
        it("should fail when sale ID is not valid", async () => {
            await expectRevert(
                setWhitelist(4, baseWhitelistRoot),
                "Invalid sale ID"
            );
        });

        it("should fail when sale is currently active", async () => {
            await setActiveSale(1);
            await expectRevert(
                setWhitelist(1, baseWhitelistRoot),
                "Cannot update when sale is active"
            );
        });

        // Passing case
        it("should pass when whitelist was previously empty", async () => {
            await setWhitelist(1, baseWhitelistRoot);
            await verifySaleInfo(1, 5, 5, baseWhitelistRoot);
        });
        it("should pass when whitelist was previously populated", async () => {
            await createSale(5, 5, baseWhitelistRoot);

            const newWhitelist = [accounts[1], accounts[2]];
            const newWhitelistRoot = getMerkleRoot(newWhitelist);

            await setWhitelist(2, newWhitelistRoot);
            await verifySaleInfo(2, 5, 5, newWhitelistRoot);
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
        it("should fail when a sale is active", async () => {
            await createSale();
            await setActiveSale(1);
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
        beforeEach(async () => {
            await createSale();
        });

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
        it("should fail when no sale IDs are provided", async () => {
            await expectRevert(
                registerChildPackage(
                    0,
                    tokenUnits(2),
                    baseSaleQty,
                    baseCardQty,
                    []
                ),
                "No sale IDs provided"
            );
        });
        it("should fail when an invalid sale ID is provided", async () => {
            await expectRevert(
                registerChildPackage(
                    0,
                    tokenUnits(2),
                    baseSaleQty,
                    baseCardQty,
                    [new BN(5)]
                ),
                "Invalid sale ID"
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
        const packageLimit = 1;
        const whitelistRoot = getMerkleRoot(whitelistedAddresses);

        beforeEach(async () => {
            await createSale(2, packageLimit);

            await registerChildPackage();

            // Create presale campaign
            startTime = await time.latest();
            startTime = startTime.add(time.duration.days(1));
            await createCampaign(owner, baseCommission, startTime);

            await setActiveSale(1);
        });

        // Failure case
        it("should fail when package ID is not valid", async () => {
            await expectRevert(
                purchasePackage(2, tokenUnits(1)),
                "Package does not exist"
            );
        });
        it("should fail when sale is not active", async () => {
            await setActiveSale(0);
            await expectRevert(
                purchasePackage(),
                "Not available for current sale"
            );
        });
        it("should fail when package sold out", async () => {
            for (let i = 0; i < baseSaleQty.div(new BN(2)); i++) {
                await purchasePackage(0, 0, 0, tokenUnits(2), [], accounts[8]);
            }
            for (let i = 0; i < baseSaleQty.div(new BN(2)); i++) {
                await purchasePackage(0, 0, 0, tokenUnits(2), [], accounts[9]);
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
        it("should fail when sale package limit is reached", async () => {
            for (let i = 0; i < packageLimit; i++) {
                await purchasePackage();
            }
            await expectRevert(
                purchasePackage(),
                "Max package purchases reached"
            );
        });
        it("should fail when number of cards remaining is not enough to fulfill package", async () => {
            await setActiveSale(0);

            // Set max supplies to low values to ensure we can purchase all cards
            await setCardMaxSupply(0, new BN(4));
            await setCardMaxSupply(1, new BN(3));
            await setCardMaxSupply(2, new BN(3));
            await setCardMaxSupply(3, new BN(2));

            await setActiveSale(1);

            await purchasePackage(0, 0, 0, tokenUnits(2), [], accounts[8]);

            await expectRevert(purchasePackage(), "Not enough cards remaining");
        });
        it("should fail when buyer is not on sale whitelist", async () => {
            await setActiveSale(0);
            await setWhitelist(1, whitelistRoot);
            await setActiveSale(1);

            const proof = getMerkleProof(whitelistedAddresses, otherAccount);

            await expectRevert(
                purchasePackage(0, 0, 0, tokenUnits(2), proof),
                "Invalid proof"
            );
        });

        // Passing case
        it("should pass when buyer is on sale whitelist", async () => {
            await setActiveSale(0);
            await setWhitelist(1, whitelistRoot);
            await setActiveSale(1);

            // accounts[8] is on the whitelist
            const buyer = accounts[8];
            const proof = getMerkleProof(whitelistedAddresses, buyer);

            const receipt = await purchasePackage(
                0,
                0,
                0,
                tokenUnits(2),
                proof,
                buyer
            );
            expectEvent(receipt, "PurchasePackage", {
                id: new BN(0),
                purchaser: buyer,
            });

            // Ensure package was marked as sold
            await verifyRemainingForSale(0, baseSaleQty - 1);
        });
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
        const cardLimit = 1;
        const whitelistRoot = getMerkleRoot(whitelistedAddresses);

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

            await createSale(cardLimit);

            await setActiveSale(1);
        });

        // Failure case
        it("should fail when card ID is invalid", async () => {
            await expectRevert(purchaseCard(5), "Invalid card ID");
        });
        it("should fail when sale is not active", async () => {
            await setActiveSale(0);
            await expectRevert(purchaseCard(), "No active sale");
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

            for (let i = 0; i < totalSupply.div(new BN(2)); i++) {
                await purchaseCard(0, 0, 0, tokenUnits(2), [], accounts[8]);
            }
            for (let i = 0; i < totalSupply.div(new BN(2)); i++) {
                await purchaseCard(0, 0, 0, tokenUnits(2), [], accounts[9]);
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
        it("should fail when sale card limit is reached", async () => {
            for (let i = 0; i < cardLimit; i++) {
                await purchaseCard();
            }
            await expectRevert(purchaseCard(), "Max card purchases reached");
        });
        it("should fail when buyer is not on sale whitelist", async () => {
            await createSale(5, 5, whitelistRoot);
            await setActiveSale(2);

            const proof = getMerkleProof(whitelistedAddresses, otherAccount);

            await expectRevert(
                purchaseCard(0, 0, 0, tokenUnits(2), proof),
                "Invalid proof"
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
        it("should pass when buyer is on sale whitelist", async () => {
            await createSale(5, 5, whitelistRoot);
            await setActiveSale(2);

            // accounts[8] is on the whitelist
            const buyer = accounts[8];
            const proof = getMerkleProof(whitelistedAddresses, buyer);

            const price = await rootSaleInstance.getCardPrice(2);
            const receipt = await purchaseCard(0, 0, 0, price, proof, buyer);
            expectEvent(receipt, "PurchaseCard", {
                id: new BN(0),
                purchaser: buyer,
            });

            // Ensure card was marked as sold
            await verifyCardMintedSupply(0, 1);
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

            await createSale();
            await setActiveSale(1);

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

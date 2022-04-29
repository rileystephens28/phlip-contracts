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
    const baseDaoAmount = tokenUnits(1000);
    const baseP2eAmount = tokenUnits(2000);

    const baseUri = "https.ipfs.moralis.io/ipfs/";
    const baseMaxUriChanges = new BN(1);

    const createSingleCardPackage = async (
        packageID = 0,
        weiPrice = tokenUnits(1),
        numForSale = 1,
        numCards = 2,
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
        numForSale = 2,
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

        // Grant sale contract treasury & minter roles for pink & white cards
        await pinkCardInstance.grantRole(TREASURER_ROLE, saleInstance.address);
        await pinkCardInstance.grantRole(MINTER_ROLE, saleInstance.address);
        await whiteCardInstance.grantRole(TREASURER_ROLE, saleInstance.address);
        await whiteCardInstance.grantRole(MINTER_ROLE, saleInstance.address);

        // Approve sale contract to spend tokens on behalf of admin
        await daoInstance.approve(
            pinkCardInstance.address,
            constants.MAX_UINT256,
            {
                from: tokenWallet,
            }
        );

        await p2eInstance.approve(
            pinkCardInstance.address,
            constants.MAX_UINT256,
            {
                from: tokenWallet,
            }
        );
    });

    describe("Creating Single Card package", async () => {
        // Failure case
        // it("should fail when address has already been blacklisted", async () => {
        //     await addToBlacklist();
        //     await verifyBlacklisted(account2);
        //     await expectRevert(
        //         addToBlacklist(),
        //         "Blacklistable: Already blacklisted"
        //     );
        // });

        // Passing case
        it("should pass when params are valid", async () => {
            const receipt = await createSingleCardPackage();
            // await expectEvent(receipt, "AddToBlacklist", {
            //     account: account2,
            // });
            // await verifyBlacklisted(account2);
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
            await createSingleCardPackage();
        });

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

const AffiliateMarketingMock = artifacts.require("AffiliateMarketingMock");
const {
    expectRevert,
    constants,
    BN,
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();

const { tokenUnits } = require("../helpers");

contract("AffiliateMarketing", (accounts) => {
    let marketingInstance;
    const [
        deployer,
        campaignOwner,
        standardAffiliate,
        customAffiliate,
        otherAccount,
    ] = accounts;

    const baseUri = "campaign-uri.com";
    const testUri = "campaign-test.com";
    const baseCampaignReward = new BN(500); // 5%
    const baseCustomReward = new BN(1000); // 10%
    const baseSaleValue = tokenUnits(10);
    const rewardMax = new BN(10000);

    const createCampaign = async (
        owner = campaignOwner,
        uri = baseUri,
        reward = baseCampaignReward,
        startTime = null,
        endTime = null
    ) => {
        if (startTime === null) {
            startTime = await time.latest();
            startTime = startTime.add(time.duration.hours(1));
        }
        if (endTime === null) {
            endTime = startTime.add(time.duration.days(1));
        }
        return await marketingInstance.createCampaign(
            owner,
            uri,
            startTime,
            endTime,
            reward
        );
    };

    const updateCampaignMetadata = async (
        id = 0,
        uri = baseUri,
        owner = campaignOwner
    ) => {
        return await marketingInstance.updateCampaignMetadata(id, owner, uri);
    };

    const updateCampaignOwner = async (
        id = 0,
        owner = campaignOwner,
        newOwner = otherAccount
    ) => {
        return await marketingInstance.updateCampaignOwner(id, owner, newOwner);
    };

    const addStandardAffiliate = async (
        id = 0,
        affiliate = standardAffiliate
    ) => {
        return await marketingInstance.addStandardAffiliate(id, affiliate);
    };

    const addCustomAffiliate = async (
        id = 0,
        owner = campaignOwner,
        affiliate = customAffiliate,
        reward = baseCustomReward
    ) => {
        return await marketingInstance.addCustomAffiliate(
            id,
            owner,
            affiliate,
            reward
        );
    };

    const attributeSaleToAffiliate = async (
        id = 0,
        affiliate = standardAffiliate,
        saleValue = baseSaleValue
    ) => {
        saleValue = new BN(saleValue);

        // Send eth that matches sale value to contract to simulate sale
        await marketingInstance.send(saleValue);

        return await marketingInstance.attributeSaleToAffiliate(
            id,
            affiliate,
            saleValue
        );
    };

    const sendAffiliateReward = async (
        id = 0,
        affiliate = standardAffiliate
    ) => {
        return await marketingInstance.sendAffiliateReward(id, affiliate);
    };

    const verifyCampaignExists = async (id, bool) => {
        const exists = await marketingInstance.campaignExists(id);
        exists.should.be.equal(bool);
    };

    const verifyCampaignIsActive = async (id, bool) => {
        const active = await marketingInstance.campaignIsActive(id);
        active.should.be.equal(bool);
    };

    const verifyAffiliateRewardTotal = async (campaignId, affiliate, val) => {
        const rewardTotal = await marketingInstance.getAffiliateRewardTotal(
            campaignId,
            affiliate
        );
        rewardTotal.should.be.bignumber.equal(new BN(val));
    };

    const verifyAffiliateRewardEntitlement = async (
        campaignId,
        affiliate,
        val
    ) => {
        const rewardEntitlement =
            await marketingInstance.getAffiliateRewardEntitlement(
                campaignId,
                affiliate
            );
        rewardEntitlement.should.be.bignumber.equal(new BN(val));
    };

    beforeEach(async () => {
        marketingInstance = await AffiliateMarketingMock.new({
            from: deployer,
        });
    });

    describe("Creating Campaigns", async () => {
        // Failure case
        it("should fail when owner address is 0x0", async () => {
            await expectRevert(
                createCampaign(constants.ZERO_ADDRESS),
                "AffiliateMarketing: Owner cannot be the 0x0"
            );
        });
        it("should fail when start time is in the past", async () => {
            let startTime = await time.latest();
            startTime = startTime.sub(time.duration.days(1));
            await expectRevert(
                createCampaign(
                    campaignOwner,
                    baseUri,
                    baseCampaignReward,
                    startTime
                ),
                "AffiliateMarketing: Start time cannot be in the past"
            );
        });
        it("should fail when start time > end time", async () => {
            let startTime = await time.latest();
            startTime = startTime.add(time.duration.days(1));
            const endTime = startTime.sub(time.duration.hours(1));
            await expectRevert(
                createCampaign(
                    campaignOwner,
                    baseUri,
                    baseCampaignReward,
                    startTime,
                    endTime
                ),
                "AffiliateMarketing: Start time must be before end time"
            );
        });
        it("should fail when reward is 0%", async () => {
            await expectRevert(
                createCampaign(campaignOwner, baseUri, new BN(0)),
                "AffiliateMarketing: Reward is 0"
            );
        });
        it("should fail when reward is greater than 100%", async () => {
            await expectRevert(
                createCampaign(campaignOwner, baseUri, new BN(10001)),
                "AffiliateMarketing: Exceeded reward ceiling"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await createCampaign();

            // Should have a created campaign
            await verifyCampaignExists(0, true);

            // Should be inactive for another hour
            await verifyCampaignIsActive(0, false);

            // Increase time by 2 hours
            await time.increase(time.duration.hours(2));

            // Should be active now
            await verifyCampaignIsActive(0, true);
        });
    });

    describe("Updating Campaign URI", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                updateCampaignMetadata(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when URI is blank", async () => {
            await expectRevert(
                updateCampaignMetadata(0, ""),
                "AffiliateMarketing: URI cannot be empty"
            );
        });
        it("should fail when owner address does not match campaign owner", async () => {
            await expectRevert(
                updateCampaignMetadata(0, testUri, otherAccount),
                "AffiliateMarketing: Not campaign owner"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await updateCampaignMetadata();

            // Should have updated campaign URI
        });
    });

    describe("Updating Campaign Owner", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                updateCampaignOwner(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when owner address does not match campaign owner", async () => {
            await expectRevert(
                updateCampaignOwner(0, otherAccount),
                "AffiliateMarketing: Not campaign owner"
            );
        });
        it("should fail when new owner address is 0x0", async () => {
            await expectRevert(
                updateCampaignOwner(0, campaignOwner, constants.ZERO_ADDRESS),
                "AffiliateMarketing: Owner cannot be 0x0"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await updateCampaignOwner();

            // Should have updated campaign owner address
        });
    });

    describe("Adding Standard Affiliate", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                addStandardAffiliate(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when affiliate has already joined campaign", async () => {
            await addStandardAffiliate(0, standardAffiliate);
            await expectRevert(
                addStandardAffiliate(0, standardAffiliate),
                "AffiliateMarketing: Already joined campaign"
            );
        });
        it("should fail when new owner address is 0x0", async () => {
            await expectRevert(
                addStandardAffiliate(0, constants.ZERO_ADDRESS),
                "AffiliateMarketing: Affiliate cannot be 0x0"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await addStandardAffiliate();

            // Should have registered affiliate to campaign
        });
    });

    describe("Adding Custom Affiliate", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                addCustomAffiliate(3, constants.ZERO_ADDRESS),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when affiliate has already joined campaign", async () => {
            await addCustomAffiliate(0, campaignOwner, standardAffiliate);
            await expectRevert(
                addCustomAffiliate(0, campaignOwner, standardAffiliate),
                "AffiliateMarketing: Already joined campaign"
            );
        });
        it("should fail when new owner address is 0x0", async () => {
            await expectRevert(
                addCustomAffiliate(0, campaignOwner, constants.ZERO_ADDRESS),
                "AffiliateMarketing: Affiliate cannot be 0x0"
            );
        });
        it("should fail when owner address does not match campaign owner", async () => {
            await expectRevert(
                addCustomAffiliate(0, otherAccount),
                "AffiliateMarketing: Not campaign owner"
            );
        });
        it("should fail when reward is 0%", async () => {
            await expectRevert(
                addCustomAffiliate(
                    0,
                    campaignOwner,
                    standardAffiliate,
                    new BN(0)
                ),
                "AffiliateMarketing: Reward is 0"
            );
        });
        it("should fail when reward is greater than 100%", async () => {
            await expectRevert(
                addCustomAffiliate(
                    0,
                    campaignOwner,
                    standardAffiliate,
                    new BN(10001)
                ),
                "AffiliateMarketing: Exceeded reward ceiling"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await addCustomAffiliate();

            // Should have registered affiliate to campaign
        });
    });

    describe("Attributing Affiliate Sales", async () => {
        beforeEach(async () => {
            await createCampaign();
            await addStandardAffiliate();
            await addCustomAffiliate();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                attributeSaleToAffiliate(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when affiliate has not joined campaign", async () => {
            await expectRevert(
                attributeSaleToAffiliate(0, otherAccount),
                "AffiliateMarketing: Affiliate not registered"
            );
        });
        it("should fail when sale value is 0", async () => {
            await expectRevert(
                attributeSaleToAffiliate(0, standardAffiliate, 0),
                "AffiliateMarketing: Sale value is 0"
            );
        });

        it("should pass when attributing a valid sale to a standard affiliate", async () => {
            await attributeSaleToAffiliate(0, standardAffiliate, baseSaleValue);

            const expectedReward = baseSaleValue
                .mul(baseCampaignReward)
                .div(rewardMax);

            await verifyAffiliateRewardTotal(
                0,
                standardAffiliate,
                expectedReward
            );
            await verifyAffiliateRewardEntitlement(
                0,
                standardAffiliate,
                expectedReward
            );
        });
        it("should pass when attributing a valid sale to a custom affiliate", async () => {
            await attributeSaleToAffiliate(0, customAffiliate, baseSaleValue);

            const expectedReward = baseSaleValue
                .mul(baseCustomReward)
                .div(rewardMax);

            await verifyAffiliateRewardTotal(
                0,
                customAffiliate,
                expectedReward
            );
            await verifyAffiliateRewardEntitlement(
                0,
                customAffiliate,
                expectedReward
            );
        });
    });

    describe("Withdrawing Affiliate Rewards", async () => {
        beforeEach(async () => {
            await createCampaign();
            await addStandardAffiliate();
            await addCustomAffiliate();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                sendAffiliateReward(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });
        it("should fail when affiliate has not joined campaign", async () => {
            await expectRevert(
                sendAffiliateReward(0, otherAccount),
                "AffiliateMarketing: Affiliate not registered"
            );
        });
        it("should fail when reward owed is 0", async () => {
            await expectRevert(
                sendAffiliateReward(),
                "AffiliateMarketing: No reward"
            );
        });

        it("should pass when standard affiliate has never withdrawn reward", async () => {
            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, standardAffiliate, baseSaleValue);
            await sendAffiliateReward(0, standardAffiliate);

            const expectedReward = baseSaleValue
                .mul(baseCampaignReward)
                .div(rewardMax);

            // Reward owed should now be 0
            await verifyAffiliateRewardEntitlement(0, standardAffiliate, 0);
        });

        it("should pass when standard affiliate has withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(baseCampaignReward)
                .div(rewardMax);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, standardAffiliate, baseSaleValue);
            await sendAffiliateReward(0, standardAffiliate);

            // Reward owed should now be 0
            await verifyAffiliateRewardEntitlement(0, standardAffiliate, 0);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, standardAffiliate, baseSaleValue);

            // Should have more rewards to withdraw
            await verifyAffiliateRewardEntitlement(
                0,
                standardAffiliate,
                expectedReward
            );

            await sendAffiliateReward(0, standardAffiliate);

            // Reward owed should now be 0 again
            await verifyAffiliateRewardEntitlement(0, standardAffiliate, 0);

            // Reward should reflect both sales
            await verifyAffiliateRewardTotal(
                0,
                standardAffiliate,
                expectedReward.mul(new BN(2))
            );
        });

        it("should pass when custom affiliate has never withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(baseCustomReward)
                .div(rewardMax);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, customAffiliate, baseSaleValue);

            // Should have rewards to withdraw
            await verifyAffiliateRewardEntitlement(
                0,
                customAffiliate,
                expectedReward
            );

            await sendAffiliateReward(0, customAffiliate);

            // Should now have no rewards to withdraw
            await verifyAffiliateRewardEntitlement(0, customAffiliate, 0);
        });

        it("should pass when custom affiliate has withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(baseCustomReward)
                .div(rewardMax);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, customAffiliate, baseSaleValue);
            await sendAffiliateReward(0, customAffiliate);

            // Reward owed should now be 0
            await verifyAffiliateRewardEntitlement(0, customAffiliate, 0);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, customAffiliate, baseSaleValue);

            // Should have more rewards to withdraw
            await verifyAffiliateRewardEntitlement(
                0,
                customAffiliate,
                expectedReward
            );

            await sendAffiliateReward(0, customAffiliate);

            // Should now have no rewards to withdraw
            await verifyAffiliateRewardEntitlement(0, customAffiliate, 0);

            // Reward should reflect both sales
            await verifyAffiliateRewardTotal(
                0,
                customAffiliate,
                expectedReward.mul(new BN(2))
            );
        });
    });
});

const AffiliateMarketingMock = artifacts.require("AffiliateMarketingMock");
const {
    expectRevert,
    expectEvent,
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
    const baseCommission = new BN(500); // 5%
    const customCommission = new BN(1000); // 10%
    const baseSaleValue = tokenUnits(10);
    const maxCommission = new BN(10000);

    const createCampaign = async (
        owner = campaignOwner,
        uri = baseUri,
        commission = baseCommission,
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
            startTime,
            endTime,
            commission,
            uri
        );
    };

    const updateCampaignMetadata = async (
        campaignId = 0,
        uri = testUri,
        owner = campaignOwner
    ) => {
        return await marketingInstance.updateCampaignMetadata(
            campaignId,
            owner,
            uri
        );
    };

    const updateCampaignOwner = async (
        campaignId = 0,
        owner = campaignOwner,
        newOwner = otherAccount
    ) => {
        return await marketingInstance.updateCampaignOwner(
            campaignId,
            owner,
            newOwner
        );
    };

    const addStandardAffiliate = async (
        campaignId = 0,
        affiliate = standardAffiliate
    ) => {
        return await marketingInstance.addStandardAffiliate(
            campaignId,
            affiliate
        );
    };

    const addCustomAffiliate = async (
        campaignId = 0,
        affiliate = customAffiliate,
        commission = customCommission
    ) => {
        return await marketingInstance.addCustomAffiliate(
            campaignId,
            affiliate,
            commission
        );
    };

    const attributeSaleToAffiliate = async (
        campaignId = 0,
        affiliateId = 0,
        saleValue = baseSaleValue
    ) => {
        saleValue = new BN(saleValue);

        // Send eth that matches sale value to contract to simulate sale
        await marketingInstance.send(saleValue);

        return await marketingInstance.attributeSaleToAffiliate(
            campaignId,
            affiliateId,
            saleValue
        );
    };

    const sendRewardsToAffiliate = async (affiliateId = 0) => {
        return await marketingInstance.sendRewardsToAffiliate(affiliateId);
    };

    const verifyCampaignExists = async (id, bool) => {
        const exists = await marketingInstance.campaignExists(id);
        exists.should.be.equal(bool);
    };

    const verifyCampaignIsActive = async (id, bool) => {
        const active = await marketingInstance.campaignIsActive(id);
        active.should.be.equal(bool);
    };

    const verifyTotalRewards = async (affiliateId, val) => {
        const rewards = await marketingInstance.totalRewardsOf(affiliateId);
        rewards.should.be.bignumber.equal(new BN(val));
    };

    const verifyUnclaimedRewards = async (affiliateId, val) => {
        const rewards = await marketingInstance.unclaimedRewardsOf(affiliateId);
        rewards.should.be.bignumber.equal(new BN(val));
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
                    baseCommission,
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
                    baseCommission,
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
            let startTime = await time.latest();
            startTime = startTime.add(time.duration.hours(1));
            let endTime = startTime.add(time.duration.days(1));

            const receipt = await createCampaign(
                campaignOwner,
                baseUri,
                baseCommission,
                startTime,
                endTime
            );
            expectEvent(receipt, "CreateCampaign", {
                id: new BN(0),
                owner: campaignOwner,
                startTime: startTime,
                endTime: endTime,
                commission: baseCommission,
                uri: baseUri,
            });

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
            const receipt = await updateCampaignMetadata();
            expectEvent(receipt, "UpdateCampaignMetadata", {
                id: new BN(0),
                uri: testUri,
            });
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
            const receipt = await updateCampaignOwner();
            expectEvent(receipt, "UpdateCampaignOwner", {
                id: new BN(0),
                newOwner: otherAccount,
            });
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
            const receipt = await addStandardAffiliate();
            expectEvent(receipt, "AddAffiliate", {
                campaignId: new BN(0),
                affiliateId: new BN(0),
                affiliateAddress: standardAffiliate,
                commission: baseCommission,
            });
        });
    });

    describe("Adding Custom Affiliate", async () => {
        beforeEach(async () => {
            await createCampaign();
        });

        // Failure case
        it("should fail when campaign does not exist", async () => {
            await expectRevert(
                addCustomAffiliate(3),
                "AffiliateMarketing: Campaign does not exist"
            );
        });

        it("should fail when affiliate address is 0x0", async () => {
            await expectRevert(
                addCustomAffiliate(0, constants.ZERO_ADDRESS),
                "AffiliateMarketing: Affiliate cannot be 0x0"
            );
        });
        it("should fail when commission is 0%", async () => {
            await expectRevert(
                addCustomAffiliate(0, standardAffiliate, new BN(0)),
                "AffiliateMarketing: Reward is 0"
            );
        });
        it("should fail when commission is greater than 100%", async () => {
            await expectRevert(
                addCustomAffiliate(0, standardAffiliate, new BN(10001)),
                "AffiliateMarketing: Exceeded reward ceiling"
            );
        });
        it("should fail when affiliate has already joined campaign", async () => {
            await addCustomAffiliate();
            await expectRevert(
                addCustomAffiliate(),
                "AffiliateMarketing: Already joined campaign"
            );
        });

        // Passing case
        it("should pass when params are valid", async () => {
            const receipt = await addCustomAffiliate();
            expectEvent(receipt, "AddAffiliate", {
                campaignId: new BN(0),
                affiliateId: new BN(0),
                affiliateAddress: customAffiliate,
                commission: customCommission,
            });
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
                attributeSaleToAffiliate(0, 5),
                "AffiliateMarketing: Not registered with campaign"
            );
        });
        it("should fail when sale value is 0", async () => {
            await expectRevert(
                attributeSaleToAffiliate(0, 0, 0),
                "AffiliateMarketing: Sale value is 0"
            );
        });

        it("should pass when attributing a valid sale to a standard affiliate", async () => {
            const receipt = await attributeSaleToAffiliate(0, 0, baseSaleValue);
            expectEvent(receipt, "AttributeSale", {
                campaignId: new BN(0),
                affiliateId: new BN(0),
                saleValue: baseSaleValue,
            });

            const expectedReward = baseSaleValue
                .mul(baseCommission)
                .div(maxCommission);

            await verifyTotalRewards(0, expectedReward);
            await verifyUnclaimedRewards(0, expectedReward);
        });
        it("should pass when attributing a valid sale to a custom affiliate", async () => {
            const receipt = await attributeSaleToAffiliate(0, 1, baseSaleValue);
            expectEvent(receipt, "AttributeSale", {
                campaignId: new BN(0),
                affiliateId: new BN(1),
                saleValue: baseSaleValue,
            });

            const expectedReward = baseSaleValue
                .mul(customCommission)
                .div(maxCommission);

            await verifyTotalRewards(1, expectedReward);
            await verifyUnclaimedRewards(1, expectedReward);
        });
    });

    describe("Withdrawing Affiliate Rewards", async () => {
        beforeEach(async () => {
            await createCampaign();
            await addStandardAffiliate();
            await addCustomAffiliate();
        });

        // Failure case
        it("should fail when affiliate does not exist", async () => {
            await expectRevert(
                sendRewardsToAffiliate(5),
                "AffiliateMarketing: Affiliate does not exist"
            );
        });

        it("should fail when reward owed is 0", async () => {
            await expectRevert(
                sendRewardsToAffiliate(),
                "AffiliateMarketing: No reward"
            );
        });

        it("should pass when standard affiliate has never withdrawn reward", async () => {
            // Record sale and withdraw reward
            await attributeSaleToAffiliate();

            const expectedReward = baseSaleValue
                .mul(baseCommission)
                .div(maxCommission);

            await verifyUnclaimedRewards(0, expectedReward);

            const receipt = await sendRewardsToAffiliate();
            expectEvent(receipt, "SendRewards", {
                affiliateId: new BN(0),
                rewardValue: expectedReward,
            });

            // Reward owed should now be 0
            await verifyUnclaimedRewards(0, 0);
        });

        it("should pass when standard affiliate has withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(baseCommission)
                .div(maxCommission);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate();

            // Reward owed should = expectedReward
            await verifyUnclaimedRewards(0, expectedReward);

            await sendRewardsToAffiliate();

            // Reward owed should now be 0
            await verifyUnclaimedRewards(0, 0);

            // Record another sale
            await attributeSaleToAffiliate();

            // Should have more rewards to withdraw
            await verifyUnclaimedRewards(0, expectedReward);

            await sendRewardsToAffiliate();

            // Reward owed should now be 0 again
            await verifyUnclaimedRewards(0, 0);

            // Reward should reflect both sales
            await verifyTotalRewards(0, expectedReward.mul(new BN(2)));
        });

        it("should pass when custom affiliate has never withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(customCommission)
                .div(maxCommission);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, 1, baseSaleValue);

            // Should have rewards to withdraw
            await verifyUnclaimedRewards(1, expectedReward);

            const receipt = await sendRewardsToAffiliate(1);
            expectEvent(receipt, "SendRewards", {
                affiliateId: new BN(1),
                rewardValue: expectedReward,
            });

            // Should now have no rewards to withdraw
            await verifyUnclaimedRewards(1, 0);
        });

        it("should pass when custom affiliate has withdrawn reward", async () => {
            const expectedReward = baseSaleValue
                .mul(customCommission)
                .div(maxCommission);

            // Record sale and withdraw reward
            await attributeSaleToAffiliate(0, 1, baseSaleValue);

            // Should have rewards to withdraw
            await verifyUnclaimedRewards(1, expectedReward);

            await sendRewardsToAffiliate(1);

            // Reward owed should now be 0
            await verifyUnclaimedRewards(0, 0);

            // Record another sale
            await attributeSaleToAffiliate(0, 1, baseSaleValue);

            // Should have more rewards to withdraw
            await verifyUnclaimedRewards(1, expectedReward);

            await sendRewardsToAffiliate(1);

            // Should now have no rewards to withdraw
            await verifyUnclaimedRewards(1, 0);

            // Reward should reflect both sales
            await verifyTotalRewards(1, expectedReward.mul(new BN(2)));
        });
    });
});

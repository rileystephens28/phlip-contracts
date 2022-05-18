const AffiliateMarketingMock = artifacts.require("AffiliateMarketingMock");
const {
    expectRevert,
    constants,
    BN,
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("AffiliateMarketing", (accounts) => {
    let marketingInstance;
    const [deployer, campaignOwner, affiliate, otherAccount] = accounts;

    const baseUri = "campaign-uri.com";
    const testUri = "campaign-test.com";
    const baseCampaignReward = new BN(500); // 5%

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
        id = campaignOwner,
        uri = baseUri,
        owner = campaignOwner
    ) => {
        return await marketingInstance.updateCampaignMetadata(id, owner, uri);
    };

    const verifyCampaignExists = async (id, bool) => {
        const exists = await marketingInstance.campaignExists(id);
        exists.should.be.equal(bool);
    };

    const verifyCampaignIsActive = async (id, bool) => {
        const active = await marketingInstance.campaignIsActive(id);
        active.should.be.equal(bool);
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
});

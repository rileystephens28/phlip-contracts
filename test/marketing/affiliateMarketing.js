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
        }
        if (endTime === null) {
            endTime = startTime.add(time.duration.days(1));
        }
        return await marketingInstance.createCampaign(
            owner,
            uri,
            reward,
            startTime,
            endTime
        );
    };

    const verifyCampaignExists = async (id, bool) => {
        const exists = await marketingInstance.campaignExists(id);
        exists.should.be.equal(bool);
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
        it("should fail when URI is blank", async () => {});
        it("should fail when start time is in the past", async () => {});
        it("should fail when start time > end time", async () => {});
        it("should fail when reward is 0%", async () => {});
        it("should fail when reward is greater than 100%", async () => {});

        // Passing case
        it("should pass when params are valid", async () => {
            await createCampaign();

            // Should have a created campaign
            await verifyCampaignExists(0, true);
        });
    });
});

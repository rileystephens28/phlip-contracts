const PhlipProfile = artifacts.require("PhlipProfile");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    snapshot,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("PhlipProfile", (accounts) => {
    let beforeEachSnapshot;
    const [admin, accountWithProfile, otherAccount] = accounts;

    const profileUri = "uri123";
    const teamName = "team123";
    const context = {};

    const createProfile = async (uri = profileUri, from = otherAccount) => {
        return await context.profileInstance.createProfile(uri, { from });
    };

    const createTeam = async (name = teamName, from = accountWithProfile) => {
        return await context.profileInstance.createTeam(name, { from });
    };

    const verifyAddressHasProfile = async (address, bool = true) => {
        const hasProfile = await context.profileInstance.hasProfile(address);
        hasProfile.should.be.equal(bool);
    };

    before(async () => {
        context.profileInstance = await PhlipProfile.new({ from: admin });
        context.tokenInstance = await ERC20Mock.new({ from: admin });

        // Create base schedule and capsule with index 0 to be use throughout tests
        await createProfile(profileUri, accountWithProfile);
        await createTeam();
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Minting Profiles", async () => {
        // Failure cases
        it("should fail when msg.sender already has a profile", async () => {
            await expectRevert(
                createProfile(profileUri, accountWithProfile),
                "PhlipProfile: Address already has a profile."
            );
        });
        it("should fail when URI is blank ", async () => {
            await expectRevert(
                createProfile(""),
                "PhlipProfile: URI cannot be blank."
            );
        });

        // Passing cases
        it("should pass when msg.sender does not have profile and URI is not blank", async () => {
            await createProfile();
            await verifyAddressHasProfile(otherAccount);

            // Token ID is 1 because we created a profile with index 0 in before()
            const newProfile = await context.profileInstance.getProfile(1);

            // check that the new schedule has correct values
            newProfile["uri"].should.be.equal(profileUri);
            newProfile["currentTeam"].should.be.bignumber.equal(new BN(0));
            newProfile["numFriends"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe.skip("Creating Teams", async () => {
        // Failure cases
        it("should fail when team name is blank", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and team name is not blank", async () => {});
    });

    describe.skip("Joining Teams", async () => {
        // Failure cases
        it("should fail when team ID is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and team ID is valid", async () => {});
    });

    describe.skip("Adding Friends", async () => {
        // Failure cases
        it("should fail when friend ID is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and friend ID is valid", async () => {});
    });

    describe.skip("Removing Friends", async () => {
        // Failure cases
        it("should fail when friend index is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and friend index is valid", async () => {});
    });
});

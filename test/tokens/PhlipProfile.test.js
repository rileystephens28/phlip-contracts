const PhlipProfile = artifacts.require("PhlipProfile");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    snapshot,
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();

const RECORDER = web3.utils.soliditySha3("RECORDER_ROLE");

contract("PhlipProfile", (accounts) => {
    let profileInstance, beforeEachSnapshot;
    const [recorder, accountWithProfile, otherAccount] = accounts;

    const profileUri = "uri123";
    const teamName = "team123";

    const createProfile = async (uri = profileUri, from = otherAccount) => {
        return await profileInstance.createProfile(uri, { from });
    };

    const createTeam = async (name = teamName, from = accountWithProfile) => {
        return await profileInstance.createTeam(name, { from });
    };

    const verifyAddressHasProfile = async (address, bool = true) => {
        const hasProfile = await profileInstance.hasProfile(address);
        hasProfile.should.be.equal(bool);
    };

    before(async () => {
        profileInstance = await PhlipProfile.new({ from: recorder });

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
            const newProfile = await profileInstance.getProfile(1);

            // check that the new schedule has correct values
            newProfile["uri"].should.be.equal(profileUri);
            newProfile["gamesWon"].should.be.bignumber.equal(new BN(0));
            newProfile["gamesLost"].should.be.bignumber.equal(new BN(0));
            newProfile["totalGameWinnings"].should.be.bignumber.equal(
                new BN(0)
            );
            newProfile["currentTeam"].should.be.bignumber.equal(new BN(0));
            newProfile["mintedCards"].should.have.lengthOf(0);
            newProfile["friends"].should.have.lengthOf(0);
        });
    });

    describe("Creating Teams", async () => {
        // Failure cases
        it("should fail when team name is blank", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and team name is not blank", async () => {});
    });

    describe("Joining Teams", async () => {
        // Failure cases
        it("should fail when team ID is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and team ID is valid", async () => {});
    });

    describe("Adding Friends", async () => {
        // Failure cases
        it("should fail when friend ID is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and friend ID is valid", async () => {});
    });

    describe("Removing Friends", async () => {
        // Failure cases
        it("should fail when friend index is out of bounds", async () => {});
        it("should fail when msg.sender does not have a profile", async () => {});

        // Passing cases
        it("should pass when msg.sender has a profile and friend index is valid", async () => {});
    });

    describe("Recording Game Wins", async () => {
        // Failure cases
        it("should fail when profile ID is out of bounds", async () => {});
        it("should fail when msg.sender != recorder", async () => {});

        // Passing cases
        it("should pass when msg.sender is recorder and profile ID is valid", async () => {});
    });

    describe("Recording Game Losses", async () => {
        // Failure cases
        it("should fail when profile ID is out of bounds", async () => {});
        it("should fail when msg.sender != recorder", async () => {});

        // Passing cases
        it("should pass when msg.sender is recorder and profile ID is valid", async () => {});
    });
});

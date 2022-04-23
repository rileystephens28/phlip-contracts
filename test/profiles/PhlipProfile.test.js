const PhlipProfile = artifacts.require("PhlipProfile");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    snapshot,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("PhlipProfile", (accounts) => {
    let beforeEachSnapshot;
    const [admin, profileOwner, otherAccount] = accounts;

    const baseProfileUri = "uri123";
    const baseTeamName = "team123";

    const createProfile = async (uri = baseProfileUri, from = profileOwner) => {
        return await profileInstance.createProfile(uri, { from });
    };

    const createTeam = async (name = baseTeamName, from = profileOwner) => {
        return await profileInstance.createTeam(name, { from });
    };

    const joinTeam = async (profileId = 0, teamId = 1, from = profileOwner) => {
        return await profileInstance.joinTeam(profileId, teamId, {
            from,
        });
    };

    const addFriend = async (
        profileId = 0,
        friendId = 1,
        from = profileOwner
    ) => {
        return await profileInstance.addFriend(profileId, friendId, {
            from,
        });
    };

    const removeFriend = async (
        profileId = 0,
        friendIndex = 0,
        from = profileOwner
    ) => {
        return await profileInstance.removeFriend(profileId, friendIndex, {
            from,
        });
    };

    const verifyAddressHasProfile = async (address, bool = true) => {
        const hasProfile = await profileInstance.hasProfile(address);
        hasProfile.should.be.equal(bool);
    };

    const verifyCurrentTeam = async (profileId, teamId) => {
        const team = await profileInstance.teamOf(profileId);
        team.should.be.bignumber.equal(new BN(teamId));
    };

    before(async () => {
        profileInstance = await PhlipProfile.new({ from: admin });
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Minting Profiles", async () => {
        // Failure cases
        it("should fail when URI is blank ", async () => {
            await expectRevert(
                createProfile(""),
                "PhlipProfile: URI cannot be blank"
            );
        });
        it("should fail when caller already has a profile", async () => {
            await createProfile();
            await expectRevert(
                createProfile(),
                "PhlipProfile: Already has profile"
            );
        });

        // Passing cases
        it("should pass when caller does not have profile and URI is not blank", async () => {
            await createProfile();
            await verifyAddressHasProfile(profileOwner);

            // Ensure that the profile was created properly
            const newProfile = await profileInstance.getProfile(0);
            newProfile["uri"].should.be.equal(baseProfileUri);
            newProfile["currentTeam"].should.be.bignumber.equal(new BN(0));
            newProfile["numFriends"].should.be.bignumber.equal(new BN(0));
        });
    });

    //? All teams IDs will be >= 1 since 0 is reserved for no team
    describe("Creating Teams", async () => {
        beforeEach(async () => {
            await createProfile();
        });
        // Failure cases
        it("should fail when team name is blank", async () => {
            await expectRevert(
                createTeam(""),
                "PhlipProfile: Team name cannot be blank"
            );
        });
        it("should fail when caller does not have a profile", async () => {
            await expectRevert(
                createTeam(baseTeamName, otherAccount),
                "PhlipProfile: Does not have profile"
            );
        });

        // Passing cases
        it("should pass when caller has a profile and team name is not blank", async () => {
            await createTeam();

            // Ensure that the team was created properly
            const newTeam = await profileInstance.getTeamInfo(1);
            newTeam["name"].should.be.equal(baseTeamName);
            newTeam["founder"].should.be.equal(profileOwner);
            newTeam["numMembers"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Joining Teams", async () => {
        beforeEach(async () => {
            await createProfile();
            await createTeam();
        });
        // Failure cases
        it("should fail when team ID is out of bounds", async () => {
            await expectRevert(
                joinTeam(0, 2),
                "PhlipProfile: Team does not exist"
            );
        });
        it("should fail when caller is not profile owner", async () => {
            await expectRevert(
                joinTeam(0, 1, otherAccount),
                "PhlipProfile: Not profile owner"
            );
        });

        it("should fail when caller has already joined the team", async () => {
            await joinTeam();
            await expectRevert(
                joinTeam(),
                "PhlipProfile: Already joined this team"
            );
        });

        // Passing cases
        it("should pass when caller has a profile and team ID is valid", async () => {
            await joinTeam();
            await verifyCurrentTeam(0, 1);
        });
    });

    describe("Adding Friends", async () => {
        beforeEach(async () => {
            // Create 2 profiles to interact with
            await createProfile();
            await createProfile(baseProfileUri, otherAccount);
        });
        // Failure cases
        it("should fail when caller is not profile owner", async () => {
            await expectRevert(
                addFriend(0, 1, admin),
                "PhlipProfile: Not profile owner"
            );
        });
        it("should fail when team ID is out of bounds", async () => {
            await expectRevert(
                addFriend(0, 2),
                "PhlipProfile: Friend does not exist"
            );
        });

        // Passing cases
        it("should pass when params are valid and profile has no friends", async () => {
            await addFriend();
            const friends = await profileInstance.getFriends(1);
            console.log(friends);
        });
        it("should pass when params are valid and profile has existing friends", async () => {});
    });

    describe.skip("Removing Friends", async () => {
        // Failure cases
        it("should fail when friend index is out of bounds", async () => {});
        it("should fail when caller does not have a profile", async () => {});

        // Passing cases
        it("should pass when caller has a profile and friend index is valid", async () => {});
    });
});

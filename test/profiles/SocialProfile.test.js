const SocialProfile = artifacts.require("SocialProfile");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectRevert, // Assertions for transactions that should fail
    expectEvent,
    snapshot,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("SocialProfile", (accounts) => {
    let beforeEachSnapshot;
    const [admin, profileOwner, otherAccount] = accounts;

    const baseUri = "https.ipfs.moralis.io/ipfs/";
    const baseProfileUri = "uri123";
    const baseTeamName = "team123";

    const createProfile = async (uri = baseProfileUri, from = profileOwner) => {
        return await profileInstance.createProfile(uri, { from });
    };

    const createTeam = async (name = baseTeamName, from = profileOwner) => {
        return await profileInstance.createTeam(name, { from });
    };

    const joinTeam = async (teamId = 1, from = profileOwner) => {
        return await profileInstance.joinTeam(teamId, {
            from,
        });
    };

    const leaveTeam = async (from = profileOwner) => {
        return await profileInstance.leaveTeam({
            from,
        });
    };

    const requestFriend = async (friendId = 1, from = profileOwner) => {
        return await profileInstance.requestFriend(friendId, {
            from,
        });
    };

    const approveFriend = async (requesterId = 0, from = otherAccount) => {
        return await profileInstance.approveFriend(requesterId, {
            from,
        });
    };

    const removeFriend = async (friendId = 1, from = profileOwner) => {
        return await profileInstance.removeFriend(friendId, {
            from,
        });
    };

    const transfer = async (
        from = profileOwner,
        to = otherAccount,
        tokeneId = 0,
        caller
    ) => {
        const estimatedGas = await profileInstance.transferFrom.estimateGas(
            from,
            to,
            tokeneId,
            { from: caller || from }
        );
        return await profileInstance.transferFrom(from, to, tokeneId, {
            from: from,
            gas: estimatedGas,
        });
    };

    const verifyAddressHasProfile = async (address, bool = true) => {
        const balance = await profileInstance.balanceOf(address);
        if (bool) {
            balance.should.be.bignumber.equal(new BN(1));
        } else {
            balance.should.be.bignumber.equal(new BN(0));
        }
    };

    const verifyProfileURI = async (profileId, uri) => {
        const profileURI = await profileInstance.tokenURI(new BN(profileId));
        profileURI.should.be.equal(uri);
    };

    const verifyProfileOwner = async (profileId, address) => {
        const owner = await profileInstance.ownerOf(new BN(profileId));
        owner.should.be.equal(address);
    };

    const verifyCurrentTeam = async (profileId, teamId) => {
        const team = await profileInstance.teamOf(profileId);
        team.should.be.bignumber.equal(new BN(teamId));
    };

    const verifyFriendCount = async (profileId, val) => {
        const numFriends = await profileInstance.friendCountOf(profileId);
        numFriends.should.be.bignumber.equal(new BN(val));
    };

    const verifyFriendStatus = async (baseProfile, queryProfile, val) => {
        const status = await profileInstance.getFriendshipStatus(
            baseProfile,
            queryProfile
        );
        status.should.be.bignumber.equal(new BN(val));
    };

    const verifyTeamMemberCount = async (teamId, val) => {
        const team = await profileInstance.getTeamInfo(teamId);
        team.numMembers.should.be.bignumber.equal(new BN(val));
    };

    before(async () => {
        profileInstance = await SocialProfile.new(
            "Phlip Profile",
            "PFP",
            baseUri,
            {
                from: admin,
            }
        );
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Initializing", () => {
        it("should fail when base URI is blank", async function () {
            await expectRevert(
                SocialProfile.new("Phlip Profile", "PFP", "", {
                    from: admin,
                }),
                "SocialProfile: Base URI is blank"
            );
        });
    });

    describe("Minting Profiles", async () => {
        // Failure cases
        it("should fail when URI is blank", async () => {
            await expectRevert(
                createProfile(""),
                "SocialProfile: URI is blank"
            );
        });
        it("should fail when caller already has a profile", async () => {
            await createProfile();
            await expectRevert(
                createProfile(),
                "SocialProfile: Already has profile"
            );
        });

        // Passing cases
        it("should pass when caller does not have profile and URI is not blank", async () => {
            const receipt = await createProfile();
            expectEvent(receipt, "Transfer", {
                from: constants.ZERO_ADDRESS,
                to: profileOwner,
                tokenId: new BN(0),
            });

            // Ensure that the profile was created properly
            await verifyAddressHasProfile(profileOwner);
            await verifyProfileURI(0, baseUri + baseProfileUri);
            await verifyProfileOwner(0, profileOwner);
            await verifyFriendCount(0, 0);
            await verifyCurrentTeam(0, 0);
        });
    });

    describe("Transfering Profiles", async () => {
        beforeEach(async () => {
            await createProfile();
        });
        // Failure cases
        it("should fail when receiving address already has profile", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await expectRevert(
                transfer(),
                "SocialProfile: Already has profile"
            );
        });

        // Passing cases
        it("should pass when receiving address does not have profile", async () => {
            const receipt = await transfer();
            expectEvent(receipt, "Transfer", {
                from: profileOwner,
                to: otherAccount,
                tokenId: new BN(0),
            });

            // Ensure that the profile was transfered properly
            await verifyAddressHasProfile(profileOwner, false);
            await verifyAddressHasProfile(otherAccount, true);
            await verifyProfileOwner(0, otherAccount);
        });
    });

    //? All teams IDs will be >= 1 since 0 is reserved for no team
    describe("Creating Teams", async () => {
        beforeEach(async () => {
            await createProfile();
        });
        // Failure cases
        it("should fail when team name is blank", async () => {
            await expectRevert(createTeam(""), "SocialProfile: Name is blank");
        });
        it("should fail when team name > 64 characters", async () => {
            const longName = "x".repeat(65);
            await expectRevert(
                createTeam(longName),
                "SocialProfile: Name too long"
            );
        });
        it("should fail when caller does not have a profile", async () => {
            await expectRevert(
                createTeam(baseTeamName, otherAccount),
                "SocialProfile: Must have profile"
            );
        });

        // Passing cases
        it("should pass when team name is 1 character", async () => {
            const oneLetterName = "x";
            const receipt = await createTeam(oneLetterName);
            expectEvent(receipt, "CreateTeam", {
                _team: new BN(1),
                _founder: new BN(0),
                _name: oneLetterName,
            });

            // Ensure that the team was created properly
            const newTeam = await profileInstance.getTeamInfo(1);
            newTeam["name"].should.be.equal(oneLetterName);
            newTeam["founder"].should.be.bignumber.equal(new BN(0));
            newTeam["numMembers"].should.be.bignumber.equal(new BN(0));
        });
        it("should pass when team name is 32 characters", async () => {
            const regName = "A".repeat(32);
            const receipt = await createTeam(regName);
            expectEvent(receipt, "CreateTeam", {
                _team: new BN(1),
                _founder: new BN(0),
                _name: regName,
            });

            // Ensure that the team was created properly
            const newTeam = await profileInstance.getTeamInfo(1);
            newTeam["name"].should.be.equal(regName);
            newTeam["founder"].should.be.bignumber.equal(new BN(0));
            newTeam["numMembers"].should.be.bignumber.equal(new BN(0));
        });
        it("should pass when team name is 64 characters", async () => {
            const longName = "x".repeat(64);
            const receipt = await createTeam(longName);
            expectEvent(receipt, "CreateTeam", {
                _team: new BN(1),
                _founder: new BN(0),
                _name: longName,
            });

            // Ensure that the team was created properly
            const newTeam = await profileInstance.getTeamInfo(1);
            newTeam["name"].should.be.equal(longName);
            newTeam["founder"].should.be.bignumber.equal(new BN(0));
            newTeam["numMembers"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Joining Teams", async () => {
        beforeEach(async () => {
            await createProfile();
            await createTeam();
        });
        // Failure cases
        it("should fail when team ID is 0", async () => {
            await expectRevert(joinTeam(0), "SocialProfile: Invalid team ID");
        });
        it("should fail when team ID is out of bounds", async () => {
            await expectRevert(joinTeam(2), "SocialProfile: Invalid team ID");
        });
        it("should fail when caller is not profile owner", async () => {
            await expectRevert(
                joinTeam(1, otherAccount),
                "SocialProfile: Must have profile"
            );
        });
        it("should fail when caller has already joined the team", async () => {
            await joinTeam();
            await expectRevert(joinTeam(), "SocialProfile: Already on team");
        });

        // Passing cases
        it("should pass when caller is 1st team member", async () => {
            const receipt = await joinTeam();
            expectEvent(receipt, "JoinTeam", {
                _team: new BN(1),
                _profile: new BN(0),
                _numMembers: new BN(1),
            });

            await verifyCurrentTeam(0, 1);
            await verifyTeamMemberCount(1, 1);
        });
        it("should pass when caller is 2nd team member of team", async () => {
            const receipt1 = await joinTeam();
            expectEvent(receipt1, "JoinTeam", {
                _team: new BN(1),
                _profile: new BN(0),
                _numMembers: new BN(1),
            });

            await verifyCurrentTeam(0, 1);
            await verifyTeamMemberCount(1, 1);

            // Create a second profie and join the team
            await createProfile("testURI", otherAccount);
            const receipt2 = await joinTeam(1, otherAccount);
            expectEvent(receipt2, "JoinTeam", {
                _team: new BN(1),
                _profile: new BN(1),
                _numMembers: new BN(2),
            });

            await verifyCurrentTeam(1, 1);
            await verifyTeamMemberCount(1, 2);
        });
    });

    describe("Leaving Teams", async () => {
        // Failure cases
        it("should fail when caller does not have profile", async () => {
            await expectRevert(
                leaveTeam(otherAccount),
                "SocialProfile: Must have profile"
            );
        });
        it("should fail when caller is not on a team", async () => {
            await createProfile(baseProfileUri, otherAccount);

            await expectRevert(
                leaveTeam(otherAccount),
                "SocialProfile: Not on team"
            );
        });

        // Passing cases
        it("should pass when caller is only team member", async () => {
            await createProfile();
            await createTeam();
            await joinTeam();

            // Should have 1 member
            await verifyTeamMemberCount(1, 1);

            const receipt = await leaveTeam();
            expectEvent(receipt, "LeaveTeam", {
                _team: new BN(1),
                _profile: new BN(0),
                _numMembers: new BN(0),
            });

            // Profile should have no team
            await verifyCurrentTeam(0, 0);

            // Team should have no members
            await verifyTeamMemberCount(1, 0);
        });
        it("should pass when caller is not only team member", async () => {
            // Create 2 profiles
            await createProfile();
            await createProfile(baseProfileUri, otherAccount);

            await createTeam();

            // Both profiles should be on the team
            await joinTeam();
            await joinTeam(1, otherAccount);

            // Should have 2 members
            await verifyTeamMemberCount(1, 2);

            const receipt = await leaveTeam();
            expectEvent(receipt, "LeaveTeam", {
                _team: new BN(1),
                _profile: new BN(0),
                _numMembers: new BN(1),
            });

            // Profile should have no team
            await verifyCurrentTeam(0, 0);

            // Team should have 1 member
            await verifyTeamMemberCount(1, 1);
        });
    });

    describe("Sending Friend Requests", async () => {
        beforeEach(async () => {
            // Create 2 profiles to interact with
            await createProfile();
        });
        // Failure cases
        it("should fail when caller does not have profile", async () => {
            await expectRevert(
                requestFriend(0, otherAccount),
                "SocialProfile: Must have profile"
            );
        });
        it("should fail when friend ID is invalid", async () => {
            await expectRevert(
                requestFriend(2),
                "SocialProfile: Friend does not exist"
            );
        });
        it("should fail when request already sent", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await requestFriend();
            await expectRevert(
                requestFriend(),
                "SocialProfile: Already friends or requested"
            );
        });
        it("should fail when already friends", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await requestFriend();
            await approveFriend();

            await expectRevert(
                requestFriend(),
                "SocialProfile: Already friends or requested"
            );
        });

        // Passing cases
        it("should pass when both caller has profile and friend profile is valid", async () => {
            await createProfile(baseProfileUri, otherAccount);
            const receipt = await requestFriend();

            expectEvent(receipt, "SendFriendRequest", {
                _requester: new BN(0),
                _requested: new BN(1),
            });

            // otherAccount is a pending friend of profileOwner
            await verifyFriendStatus(0, 1, 1);

            // profileOwner is a stranger to otherAccount
            await verifyFriendStatus(1, 0, 0);
        });
    });

    describe("Accepting Friend Requests", async () => {
        beforeEach(async () => {
            // Create 2 profiles to interact with
            await createProfile();
        });
        // Failure cases
        it("should fail when caller does not have profile", async () => {
            await expectRevert(
                approveFriend(0, otherAccount),
                "SocialProfile: Must have profile"
            );
        });
        it("should fail when no request has been sent", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await expectRevert(
                approveFriend(),
                "SocialProfile: No pending request"
            );
        });
        it("should fail when already friends", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await requestFriend();
            await approveFriend();

            await expectRevert(
                approveFriend(),
                "SocialProfile: No pending request"
            );
        });

        // Passing cases
        it("should pass when caller received valid friend request", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await requestFriend();
            const receipt = await approveFriend();

            expectEvent(receipt, "ApproveFriendRequest", {
                _requester: new BN(0),
                _approver: new BN(1),
            });

            // Both profiles should be approved friends with each other
            await verifyFriendStatus(0, 1, 2);
            await verifyFriendStatus(1, 0, 2);

            // Profiles should have 1 friend each
            await verifyFriendCount(0, 1);
            await verifyFriendCount(1, 1);
        });
    });

    describe("Removing Friends", async () => {
        beforeEach(async () => {
            // Create 2 profiles to interact with
            await createProfile();
        });
        // Failure cases
        it("should fail when caller does not have profile", async () => {
            await expectRevert(
                removeFriend(0, otherAccount),
                "SocialProfile: Must have profile"
            );
        });
        it("should fail when no profiles are not friends", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await expectRevert(removeFriend(), "SocialProfile: Not friends");
        });

        // Passing cases
        it("should pass when caller is removing approved friend", async () => {
            await createProfile(baseProfileUri, otherAccount);
            await requestFriend();
            await approveFriend();

            const receipt = await removeFriend();

            expectEvent(receipt, "RemoveFriend", {
                _profile: new BN(0),
                _friend: new BN(1),
            });

            // Both profiles should be strangers
            await verifyFriendStatus(0, 1, 0);
            await verifyFriendStatus(1, 0, 0);

            // Profiles should have no friends
            await verifyFriendCount(0, 0);
            await verifyFriendCount(1, 0);
        });
    });
});

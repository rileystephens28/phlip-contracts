const BlacklistMock = artifacts.require("BlacklistMock");
const { expectRevert } = require("@openzeppelin/test-helpers");
require("chai").should();

contract("Blacklistable", (accounts) => {
    let blacklistInstance;
    const [account1, account2] = accounts;

    const addToBlacklist = async (account = account2, from = account1) => {
        return await blacklistInstance.addToBlacklist(account, {
            from: from,
        });
    };

    const removeFromBlacklist = async (account = account2, from = account1) => {
        return await blacklistInstance.removeFromBlacklist(account, {
            from: from,
        });
    };

    const _shouldBeBlacklisted = async (address, bool) => {
        const isBlacklisted = await blacklistInstance.isBlacklisted(address);
        isBlacklisted.should.be.equal(bool);
    };

    const verifyBlacklisted = async (address) => {
        await _shouldBeBlacklisted(address, true);
    };

    const verifyNotBlacklisted = async (address) => {
        await _shouldBeBlacklisted(address, false);
    };

    beforeEach(async () => {
        blacklistInstance = await BlacklistMock.new({ from: account1 });
    });

    describe("Adding To Blacklist", async () => {
        // Failure case
        it("should fail when address has already been blacklisted", async () => {
            await addToBlacklist();
            await verifyBlacklisted(account2);
            await expectRevert(
                addToBlacklist(),
                "Blacklistable: Address is already blacklisted"
            );
        });

        // Passing case
        it("should pass when address has not been blacklisted", async () => {
            await addToBlacklist();
            await verifyBlacklisted(account2);
        });
    });

    describe("Removing From Blacklist", async () => {
        // Failure case
        it("should fail when address has not been blacklisted", async () => {
            await expectRevert(
                removeFromBlacklist(),
                "Blacklistable: Address is not on the blacklist"
            );
        });

        // Passing case
        it("should pass when address has been blacklisted", async () => {
            await addToBlacklist();
            await verifyBlacklisted(account2);
            await removeFromBlacklist();
            await verifyNotBlacklisted(account2);
        });
    });

    describe("Modifier Protected Functions", async () => {
        // Failure case
        it("should fail when address is blacklisted", async () => {
            await addToBlacklist();
            await verifyBlacklisted(account2);
            await expectRevert(
                blacklistInstance.protectedAction({ from: account2 }),
                "Blacklistable: Blacklisted addresses are forbidden"
            );
            const didAction = await blacklistInstance.didProtectedAction();
            didAction.should.be.equal(false);
        });

        // Passing case
        it("should pass when address has not been blacklisted", async () => {
            await blacklistInstance.protectedAction({ from: account1 });
            const didAction = await blacklistInstance.didProtectedAction();
            didAction.should.be.equal(true);
        });
    });
});

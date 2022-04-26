const BlacklistMock = artifacts.require("BlacklistMock");
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
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
                "Blacklistable: Already blacklisted"
            );
        });

        // Passing case
        it("should pass when address has not been blacklisted", async () => {
            const receipt = await addToBlacklist();
            await expectEvent(receipt, "AddToBlacklist", {
                account: account2,
            });
            await verifyBlacklisted(account2);
        });
    });

    describe("Removing From Blacklist", async () => {
        // Failure case
        it("should fail when address has not been blacklisted", async () => {
            await expectRevert(
                removeFromBlacklist(),
                "Blacklistable: Not blacklisted"
            );
        });

        // Passing case
        it("should pass when address has been blacklisted", async () => {
            // Add to blacklist
            await addToBlacklist();
            await verifyBlacklisted(account2);

            // Remove from blacklist
            const receipt = await removeFromBlacklist();
            await expectEvent(receipt, "RemoveFromBlacklist", {
                account: account2,
            });
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
                "Blacklistable: On blacklist"
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

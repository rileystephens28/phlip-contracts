const WhitelistMock = artifacts.require("WhitelistMock");
const { expectRevert, expectEvent } = require("@openzeppelin/test-helpers");
require("chai").should();

contract("Whitelistable", (accounts) => {
    let whitelistInstance;
    const [account1, account2] = accounts;

    const addToWhitelist = async (account = account2, from = account1) => {
        return await whitelistInstance.addToWhitelist(account, {
            from: from,
        });
    };

    const removeFromWhitelist = async (account = account2, from = account1) => {
        return await whitelistInstance.removeFromWhitelist(account, {
            from: from,
        });
    };

    const _shouldBeWhitelisted = async (address, bool) => {
        const isWhitelisted = await whitelistInstance.isWhitelisted(address);
        isWhitelisted.should.be.equal(bool);
    };

    const verifyWhitelisted = async (address) => {
        await _shouldBeWhitelisted(address, true);
    };

    const verifyNotWhitelisted = async (address) => {
        await _shouldBeWhitelisted(address, false);
    };

    beforeEach(async () => {
        whitelistInstance = await WhitelistMock.new({ from: account1 });
    });

    describe("Adding To Whitelist", async () => {
        // Failure case
        it("should fail when address has already been whitelisted", async () => {
            await addToWhitelist();
            await verifyWhitelisted(account2);
            await expectRevert(
                addToWhitelist(),
                "Whitelistable: Already whitelisted"
            );
        });

        // Passing case
        it("should pass when address has not been whitelisted", async () => {
            const receipt = await addToWhitelist();
            await expectEvent(receipt, "AddToWhitelist", {
                account: account2,
            });
            await verifyWhitelisted(account2);
        });
    });

    describe("Removing From Whitelist", async () => {
        // Failure case
        it("should fail when address has not been whitelisted", async () => {
            await expectRevert(
                removeFromWhitelist(),
                "Whitelistable: Not whitelisted"
            );
        });

        // Passing case
        it("should pass when address has been whitelisted", async () => {
            // Add to whitelist
            await addToWhitelist();
            await verifyWhitelisted(account2);

            // Remove from whitelist
            const receipt = await removeFromWhitelist();
            await expectEvent(receipt, "RemoveFromWhitelist", {
                account: account2,
            });
            await verifyNotWhitelisted(account2);
        });
    });

    describe("Modifier Protected Functions", async () => {
        // Failure case
        it("should fail when address is not whitelisted", async () => {
            await expectRevert(
                whitelistInstance.protectedAction({ from: account1 }),
                "Whitelistable: Not whitelisted"
            );
            const didAction = await whitelistInstance.didProtectedAction();
            didAction.should.be.equal(false);
        });

        // Passing case
        it("should pass when address is whitelisted", async () => {
            await addToWhitelist();
            await verifyWhitelisted(account2);
            await whitelistInstance.protectedAction({ from: account2 });
            const didAction = await whitelistInstance.didProtectedAction();
            didAction.should.be.equal(true);
        });
    });
});

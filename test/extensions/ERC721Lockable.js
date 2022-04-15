const ERC721Lockable = artifacts.require("ERC721LockableMock");
const {
    expectRevert,
    snapshot,
    constants,
    BN,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("ERC721Lockable", (accounts) => {
    const [owner, account, lockOperator, otherAccount] = accounts;

    const lock = async (tokenId = 0, from = lockOperator) => {
        return await lockableInstance.lock(tokenId, {
            from: from,
        });
    };

    const unlock = async (tokenId = 0, from = lockOperator) => {
        return await lockableInstance.unlock(tokenId, {
            from: from,
        });
    };

    const initiateOperatorAgreement = async (
        tokenId = 0,
        prospectiveOperator = lockOperator,
        expiration = 0,
        from = account
    ) => {
        return await lockableInstance.initiateOperatorAgreement(
            tokenId,
            prospectiveOperator,
            new BN(expiration),
            {
                from: from,
            }
        );
    };

    const finalizeOperatorAgreement = async (
        tokenId = 0,
        from = lockOperator
    ) => {
        return await lockableInstance.finalizeOperatorAgreement(tokenId, {
            from: from,
        });
    };

    const initiateResignation = async (tokenId = 0, from = lockOperator) => {
        return await lockableInstance.initiateResignation(tokenId, {
            from: from,
        });
    };

    const finalizeResignation = async (tokenId = 0, from = account) => {
        return await lockableInstance.finalizeResignation(tokenId, {
            from: from,
        });
    };

    const verifyAgreementStatus = async (tokenId, status) => {
        const agreementStatus = await lockableInstance.agreementStatusOf(
            tokenId
        );
        agreementStatus.should.be.bignumber.equal(new BN(status));
    };

    const _shouldBeLocked = async (tokenId, bool) => {
        const isLocked = await lockableInstance.isLocked(tokenId);
        isLocked.should.be.equal(bool);
    };

    const verifyLocked = async (tokenId) => {
        await _shouldBeLocked(tokenId, true);
    };

    const verifyUnlocked = async (tokenId) => {
        await _shouldBeLocked(tokenId, false);
    };

    before(async () => {
        // Initialize contract state so tests have token to use for testing
        lockableInstance = await ERC721Lockable.new({ from: owner });

        // Mint a token to account
        await lockableInstance.mint(account, {
            from: owner,
        });
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    describe.only("Initiating Lock Operator Agreement", async () => {
        // Failure case
        it("should fail when token ID does not exist", async () => {
            await expectRevert(
                initiateOperatorAgreement(1),
                "Lockable: Token does not exist"
            );
        });
        it("should fail when prospective operator is 0x0", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, constants.ZERO_ADDRESS),
                "Lockable: Prospective operator cannot be 0x0"
            );
        });
        it("should fail when prospective operator is token owner", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, account),
                "Lockable: Prospective operator cannot be owner"
            );
        });
        it("should fail when 0 < expiration < current time", async () => {
            const currentTimeSeconds = new Date().getTime() / 1000;
            const tenSecondsAgo = currentTimeSeconds - 10;
            await expectRevert(
                initiateOperatorAgreement(0, lockOperator, tenSecondsAgo),
                "Lockable: Invalid expiration"
            );
        });
        it("should fail when caller is not token owner", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, lockOperator, 0, otherAccount),
                "Lockable: Owner must initiate operator agreement"
            );
        });
        it("should fail when token has an existing operator agreement", async () => {
            await initiateOperatorAgreement();
            await expectRevert(
                initiateOperatorAgreement(),
                "Lockable: Token has existing operator agreement"
            );
        });

        // Passing case
        it("should pass when params are valid and expiration is 0", async () => {
            await initiateOperatorAgreement();
            await verifyAgreementStatus(0, 1);
        });
        it("should pass when params are valid and expiration is in the future", async () => {
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            await initiateOperatorAgreement(0, lockOperator, oneWeekFromNow);
            await verifyAgreementStatus(0, 1);
        });
    });
});

const ERC721Lockable = artifacts.require("ERC721LockableMock");
const {
    expectRevert,
    expectEvent,
    snapshot,
    time,
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
        pendingOperator = lockOperator,
        expiration = 0,
        from = account
    ) => {
        return await lockableInstance.initiateOperatorAgreement(
            tokenId,
            pendingOperator,
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

    const verifyHasOperator = async (tokenId, bool) => {
        const hasOperator = await lockableInstance.hasLockOperator(tokenId);
        hasOperator.should.be.equal(bool);
    };

    const verifyOperatorAddress = async (tokenId, address) => {
        const operator = await lockableInstance.lockOperatorOf(tokenId);
        operator.should.be.equal(address);
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

    const verifyOwner = async (tokenId, address) => {
        const tokenOwner = await lockableInstance.ownerOf(tokenId);
        tokenOwner.should.be.equal(address);
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

    describe("Initiating Lock Operator Agreement", async () => {
        // Failure case
        it("should fail when token ID does not exist", async () => {
            await expectRevert(
                initiateOperatorAgreement(1),
                "ERC721Lockable: Token does not exist"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when pending operator is 0x0", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, constants.ZERO_ADDRESS),
                "ERC721Lockable: Operator cannot be 0x0"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when pending operator is token owner", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, account),
                "ERC721Lockable: Operator cannot be owner"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when 0 < expiration < current time", async () => {
            const currentTimeSeconds = new Date().getTime() / 1000;
            const tenSecondsAgo = currentTimeSeconds - 10;
            await expectRevert(
                initiateOperatorAgreement(0, lockOperator, tenSecondsAgo),
                "ERC721Lockable: Invalid expiration"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when caller is not token owner", async () => {
            await expectRevert(
                initiateOperatorAgreement(0, lockOperator, 0, otherAccount),
                "ERC721Lockable: Must be owner"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });

        // Passing case
        it("should pass when params are valid and expiration is 0", async () => {
            const receipt = await initiateOperatorAgreement();

            // Should emit a InitiateAgreement event
            expectEvent(receipt, "InitiateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(0),
            });

            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });
        it("should pass when params are valid and expiration is in the future", async () => {
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            const receipt = await initiateOperatorAgreement(
                0,
                lockOperator,
                oneWeekFromNow
            );

            // Should emit a InitiateAgreement event
            expectEvent(receipt, "InitiateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(oneWeekFromNow),
            });

            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });
        it("should pass when overriding pending operator agreement", async () => {
            // Create pending operator agreement
            const receipt1 = await initiateOperatorAgreement();

            // Should emit a InitiateAgreement event
            expectEvent(receipt1, "InitiateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(0),
            });

            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);

            // Override pending operator agreement
            const receipt2 = await initiateOperatorAgreement(0, otherAccount);

            // Should emit a InitiateAgreement event
            expectEvent(receipt2, "InitiateAgreement", {
                owner: account,
                operator: otherAccount,
                token: new BN(0),
                expiration: new BN(0),
            });

            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to other account
            await verifyOperatorAddress(0, otherAccount);
        });
        it("should pass when token has an existing expired operator agreement", async () => {
            // Create agreement that expires in one week
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            const receipt1 = await initiateOperatorAgreement(
                0,
                lockOperator,
                oneWeekFromNow
            );

            // Should emit a InitiateAgreement event
            expectEvent(receipt1, "InitiateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(oneWeekFromNow),
            });

            await finalizeOperatorAgreement();

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Increase time to one week from now
            await time.increase(oneWeekFromNow + 1);

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);

            // Initiate new agreement
            const receipt2 = await initiateOperatorAgreement();

            // Should emit a InitiateAgreement event
            expectEvent(receipt2, "InitiateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(0),
            });

            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });
    });

    describe("Finalizing Lock Operator Agreement", async () => {
        // Failure case
        it("should fail when token does not have pending agreement", async () => {
            await expectRevert(
                finalizeOperatorAgreement(),
                "ERC721Lockable: No pending agreement"
            );
            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when caller is not pending operator of agreement", async () => {
            await initiateOperatorAgreement();
            await expectRevert(
                finalizeOperatorAgreement(0, otherAccount),
                "ERC721Lockable: Not pending operator"
            );
            // Operator agreement status should be 1 (APPROVAL_PENDING)
            await verifyAgreementStatus(0, 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });

        // Passing case
        it("should pass when params are valid and caller is pending operator", async () => {
            // Create approved operator agreement
            await initiateOperatorAgreement();
            const receipt = await finalizeOperatorAgreement();

            expectEvent(receipt, "FinalizeAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
                expiration: new BN(0),
            });

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Token should have an operator
            await verifyHasOperator(0, true);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });
    });

    describe("Initiating Lock Operator Resignation", async () => {
        // Failure case
        it("should fail when token does not have approved operator", async () => {
            await expectRevert(
                initiateResignation(),
                "ERC721Lockable: No approved operator"
            );

            // Operator agreement status should be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
        it("should fail when caller is not approved operator of agreement", async () => {
            // Create approved operator agreement
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            await expectRevert(
                initiateResignation(0, otherAccount),
                "ERC721Lockable: Not approved operator"
            );

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Token should have an operator
            await verifyHasOperator(0, true);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });

        // Passing case
        it("should pass when params are valid and caller is approved operator", async () => {
            // Create approved operator agreement
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Initiate operator resignation
            await initiateResignation();

            // Operator agreement status should be 3 (RESIGNATION_PENDING)
            await verifyAgreementStatus(0, 3);

            // Token should have an operator
            await verifyHasOperator(0, true);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });
    });
    describe("Finalizing Lock Operator Resignation", async () => {
        // Failure case
        it("should fail when caller is not token owner", async () => {
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();
            await initiateResignation();
            await expectRevert(
                finalizeResignation(0, otherAccount),
                "ERC721Lockable: Must be owner"
            );

            // Operator agreement status should be 3 (RESIGNATION_PENDING)
            await verifyAgreementStatus(0, 3);

            // Token should have an operator
            await verifyHasOperator(0, true);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });

        it("should fail when token operator has not initiated resignation", async () => {
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();
            await expectRevert(
                finalizeResignation(),
                "ERC721Lockable: No pending resignation"
            );

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Token should have an operator
            await verifyHasOperator(0, true);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);
        });

        // Passing case
        it("should pass when params are valid and caller is approved operator", async () => {
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();
            await initiateResignation();

            const receipt = await finalizeResignation();

            expectEvent(receipt, "TerminateAgreement", {
                owner: account,
                operator: lockOperator,
                token: new BN(0),
            });

            // Operator agreement status should now be 0 (UNSET)
            await verifyAgreementStatus(0, 0);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Operator should be zero address
            await verifyOperatorAddress(0, constants.ZERO_ADDRESS);
        });
    });

    describe("Locking Token", async () => {
        // Failure case
        it("should fail when token ID does not exist", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();
            await expectRevert(lock(1), "ERC721Lockable: No approved operator");

            // Token should still be unlocked
            await verifyUnlocked(0);
        });

        it("should fail when token does not have approved operator", async () => {
            await expectRevert(lock(), "ERC721Lockable: No approved operator");
            // Token should still be unlocked
            await verifyUnlocked(0);
        });

        it("should fail when caller is not approved lock operator", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            await expectRevert(
                lock(0, otherAccount),
                "ERC721Lockable: Not approved operator"
            );
            // Token should still be unlocked
            await verifyUnlocked(0);
        });
        it("should fail when token is already locked", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Lock then verify token is locked
            await lock();
            await verifyLocked(0);

            await expectRevert(lock(), "ERC721Lockable: Already locked");
            // Token should still be unlocked
            await verifyLocked(0);
        });
        it("should fail when operator agreement has expired", async () => {
            // Create agreement that expires in one week
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            await initiateOperatorAgreement(0, lockOperator, oneWeekFromNow);
            await finalizeOperatorAgreement();

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Lock token while agreement is valid
            await lock();
            await verifyLocked(0);

            // Increase time past agreement expiration
            await time.increase(oneWeekFromNow + 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            await expectRevert(lock(), "ERC721Lockable: No approved operator");

            // Token should be unlocked since agreement has expired
            await verifyUnlocked(0);
        });

        // Passing case
        it("should pass when params are valid and caller is approved operator", async () => {
            // Create agreement and lock token
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            const receipt = await lock();
            expectEvent(receipt, "Lock", {
                operator: lockOperator,
                token: new BN(0),
            });

            // Token should be locked
            await verifyLocked(0);
        });
    });

    describe("Unlocking Token", async () => {
        // Failure case
        it("should fail when token ID does not exist", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Nonexistant token defaults to be unlocked
            await expectRevert(unlock(1), "ERC721Lockable: Already unlocked");

            // Token should still be unlocked
            await verifyUnlocked(0);
        });

        it("should fail when token does not have approved operator", async () => {
            // Token with no operator defaults to be unlocked
            await expectRevert(unlock(), "ERC721Lockable: Already unlocked");

            // Token should still be unlocked
            await verifyUnlocked(0);
        });

        it("should fail when caller is not approved lock operator", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Lock then verify token is locked
            await lock();
            await verifyLocked(0);

            await expectRevert(
                unlock(0, otherAccount),
                "ERC721Lockable: Not approved operator"
            );
            // Token should still be unlocked
            await verifyLocked(0);
        });
        it("should fail when token is already unlocked", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            await expectRevert(unlock(), "ERC721Lockable: Already unlocked");

            // Token should still be unlocked
            await verifyUnlocked(0);
        });
        it("should fail when operator agreement has expired", async () => {
            // Create agreement that expires in one week
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            await initiateOperatorAgreement(0, lockOperator, oneWeekFromNow);
            await finalizeOperatorAgreement();

            // Operator agreement status should be 2 (APPROVED)
            await verifyAgreementStatus(0, 2);

            // Operator should be set to lock operator
            await verifyOperatorAddress(0, lockOperator);

            // Lock token while agreement is valid
            await lock();
            await verifyLocked(0);

            // Increase time past agreement expiration
            await time.increase(oneWeekFromNow + 1);

            // Token should not have an operator
            await verifyHasOperator(0, false);

            // Token should be unlocked since agreement has expired
            await verifyUnlocked(0);

            await expectRevert(unlock(), "ERC721Lockable: Already unlocked");
        });

        // Passing case
        it("should pass when params are valid and caller is approved operator", async () => {
            // Create agreement and lock token
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Lock then verify token is locked
            await lock();
            await verifyLocked(0);

            // Unlock then verify token is unlocked
            const receipt = await unlock();
            expectEvent(receipt, "Unlock", {
                operator: lockOperator,
                token: new BN(0),
            });
            await verifyUnlocked(0);
        });
    });

    describe("Transfering Token", async () => {
        // Failure case
        it("should fail when token is locked", async () => {
            // Create agreement for token 0
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Lock then verify token is locked
            await lock();
            await verifyLocked(0);

            await expectRevert(
                lockableInstance.transferFrom(account, otherAccount, 0, {
                    from: account,
                }),
                "ERC721Lockable: Token is locked"
            );

            // Token should still be owned by account
            await verifyOwner(0, account);
        });

        // Passing case
        it("should pass when token has never been locked", async () => {
            // Create agreement and lock token
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Token should be owned by account
            await verifyOwner(0, account);

            await lockableInstance.transferFrom(account, otherAccount, 0, {
                from: account,
            });

            // Token should now be owned by other account
            await verifyOwner(0, otherAccount);
        });

        it("should pass when token has been locked then unlocked", async () => {
            // Create agreement and lock token
            await initiateOperatorAgreement();
            await finalizeOperatorAgreement();

            // Lock then verify token is locked
            await lock();
            await verifyLocked(0);

            // Unlock then verify token is unlocked
            await unlock();
            await verifyUnlocked(0);

            // Token should be owned by account
            await verifyOwner(0, account);

            await lockableInstance.transferFrom(account, otherAccount, 0, {
                from: account,
            });

            // Token should now be owned by other account
            await verifyOwner(0, otherAccount);
        });
        it("should pass when locked tokens operator agreement has expired", async () => {
            // Create agreement that expires in one week
            const currentTimeSeconds = new Date().getTime() / 1000;
            const oneWeekFromNow = currentTimeSeconds + 604800;
            await initiateOperatorAgreement(0, lockOperator, oneWeekFromNow);
            await finalizeOperatorAgreement();

            // Lock token while agreement is valid
            await lock();
            await verifyLocked(0);

            // Increase time past agreement expiration
            await time.increase(oneWeekFromNow + 1);

            // Token should be owned by account
            await verifyOwner(0, account);

            await lockableInstance.transferFrom(account, otherAccount, 0, {
                from: account,
            });

            // Token should now be owned by other account
            await verifyOwner(0, otherAccount);
        });
    });
});

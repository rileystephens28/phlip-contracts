const VestingCapsule = artifacts.require("VestingCapsuleMock");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    snapshot,
    time,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("VestingCapsule", (accounts) => {
    let capsuleInstance, tokenInstance1, tokenInstance2, beforeEachSnapshot;
    const [deployer, capsuleOwner, recipient, account, otherAccount] = accounts;

    const startTimeOffset = new BN(100);

    // 100 second cliff
    const baseCliff = new BN(100);

    // 1000 second vesting duration
    const baseDuration = new BN(1000);

    // 1 token unit per second
    const baseRate = new BN(1);

    const secondsUntil20PercVested = startTimeOffset.add(
        baseDuration.div(new BN(5))
    );

    const secondsUntil50PercVested = startTimeOffset.add(
        baseDuration.div(new BN(2))
    );

    const secondsUntilFullyVested = startTimeOffset.add(baseDuration);

    const fillReserves = async (
        scheduleId = 0,
        amount = new BN(1000),
        token = tokenInstance1,
        from = deployer,
        preApprove = true
    ) => {
        if (preApprove) {
            await token.approve(capsuleInstance.address, new BN(amount), {
                from: from,
            });
        }
        return await capsuleInstance.fillReserves(scheduleId, new BN(amount), {
            from: from,
        });
    };

    const createSchedule = async (
        token = tokenInstance1.address,
        cliff = baseCliff,
        duration = baseDuration,
        rate = baseRate,
        from = deployer
    ) => {
        return await capsuleInstance.createVestingSchedule(
            token,
            new BN(cliff),
            new BN(duration),
            new BN(rate),
            { from: from }
        );
    };

    const transfer = async (
        from = capsuleOwner,
        to = recipient,
        tokeneId = 0
    ) => {
        const estimatedGas = await capsuleInstance.transferFrom.estimateGas(
            from,
            to,
            tokeneId,
            { from: from }
        );
        return await capsuleInstance.transferFrom(from, to, tokeneId, {
            from: from,
            gas: estimatedGas,
        });
    };

    const mint = async (to = capsuleOwner, from = deployer) => {
        const estimatedGas = await capsuleInstance.mint.estimateGas(to);
        return await capsuleInstance.mint(to, {
            from: from,
            gas: estimatedGas,
        });
    };

    const burn = async (capsuleId = 0, from = capsuleOwner) => {
        return await capsuleInstance.burn(capsuleId, {
            from: from,
        });
    };

    const addVestingScheme = async (scheduleIds = [0, 1], from = deployer) => {
        return await capsuleInstance.addVestingScheme(
            scheduleIds[0],
            scheduleIds[1],
            {
                from: from,
            }
        );
    };

    const setVestingScheme = async (scheduleId = 0, from = deployer) => {
        return await capsuleInstance.setVestingScheme(scheduleId, {
            from: from,
        });
    };

    const withdrawFromCapsules = async (tokenId = 0, from = capsuleOwner) => {
        return await capsuleInstance.withdrawFromCapsules(tokenId, {
            from: from,
        });
    };

    const withdrawTokenLeftovers = async (
        tokenAddress = tokenInstance1.address,
        from = capsuleOwner
    ) => {
        return await capsuleInstance.withdrawFromCapsules(tokenAddress, {
            from: from,
        });
    };

    const verifyCurrentScheme = async (val) => {
        const scheme = await capsuleInstance.getCurrentVestingScheme();
        scheme.should.be.bignumber.equal(new BN(val));
    };

    const verifySchemeIsSet = async (bool) => {
        const isSet = await capsuleInstance.schemeIsSet();
        isSet.should.be.equal(bool);
    };

    const verifyCapsuleIsActive = async (capsuleId, bool) => {
        const isActive = await capsuleInstance.isCapsuleActive(capsuleId);
        isActive.should.be.equal(bool);
    };

    const verifyCapsuleOwner = async (capsuleId, address) => {
        const owner = await capsuleInstance.capsuleOwnerOf(capsuleId);
        owner.should.be.equal(address);
    };

    const verifyLeftoverBalance = async (account, token, val) => {
        const leftoverBalance = await capsuleInstance.leftoverBalanceOf(
            account,
            token
        );
        leftoverBalance.should.be.bignumber.equal(new BN(val));
    };

    const verifyTokenBalance = async (token, address, amount) => {
        const tokenBalance = await token.balanceOf(address);
        tokenBalance.should.be.bignumber.equal(new BN(amount));
    };

    const verifyTokenBalanceInRange = async (token, address, amount, range) => {
        const tokenBalance = await token.balanceOf(address);
        const min = new BN(amount).sub(new BN(range));
        const max = new BN(amount).add(new BN(range));
        tokenBalance.should.be.bignumber.gte(min);
        tokenBalance.should.be.bignumber.lte(max);
    };

    before(async () => {
        capsuleInstance = await VestingCapsule.new({ from: deployer });
        tokenInstance1 = await ERC20Mock.new({ from: deployer });
        tokenInstance2 = await ERC20Mock.new({ from: deployer });

        // fund the deployer account with 10,000 of tokens 1 & 2
        await tokenInstance1.mint(deployer, 10000, { from: deployer });
        await tokenInstance2.mint(deployer, 10000, { from: deployer });

        // Create vesting schedules for each token
        await createSchedule(tokenInstance1.address);
        await createSchedule(tokenInstance2.address);

        // Fill schedule reserves with tokens 1 & 2
        await fillReserves(0, 5000, tokenInstance1);
        await fillReserves(1, 5000, tokenInstance2);
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Adding Vesting Scheme", async () => {
        // Failure cases
        it("should fail when invalid schedule ID is included in scheme", async () => {
            await expectRevert(
                addVestingScheme([1, 2]),
                "VestingCapsule: Invalid schedule ID"
            );
        });

        // Passing cases
        it("should pass when schedule IDs are valid", async () => {
            await addVestingScheme([0, 1]);

            // check that the new scheme has correct values
            const newScheme = await capsuleInstance.getScheme(0);
            newScheme["schedule1"].should.be.bignumber.equal(new BN(0));
            newScheme["schedule2"].should.be.bignumber.equal(new BN(1));
        });
    });

    describe("Setting Vesting Scheme", async () => {
        beforeEach(async () => {
            // Create schedule with new token
            const newToken = await ERC20Mock.new({ from: deployer });
            await createSchedule(newToken.address);

            // Create 2 unique vesting schemes
            await addVestingScheme();
            await addVestingScheme([1, 2]);
        });

        // Failure cases
        it("should fail when scheme ID is invalid", async () => {
            await expectRevert(
                setVestingScheme(2),
                "VestingCapsule: Invalid scheme ID"
            );
        });

        // Passing cases
        it("should pass when scheme ID is valid", async () => {
            await setVestingScheme(1);
            await verifyCurrentScheme(1);
            await verifySchemeIsSet(true);
        });
    });

    describe("Minting Capsules", async () => {
        // Failure cases
        it("should fail when vesting scheme is not set", async () => {
            await verifySchemeIsSet(false);
            await expectRevert(
                mint(),
                "VestingCapsule: Vesting scheme not set"
            );
        });

        // Passing cases
        it("should pass when vesting scheme is set", async () => {
            // Add and set a vesting scheme
            await addVestingScheme();
            await setVestingScheme();
            await verifySchemeIsSet(true);

            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Verify the new capsule owner
            await verifyCapsuleOwner(0, capsuleOwner);
            await verifyCapsuleOwner(1, capsuleOwner);

            // Verify the new capsule was created correctly
            const newCapsuleBox = await capsuleInstance.getCapsuleBox(0);
            newCapsuleBox["scheme"].should.be.bignumber.equal(new BN(0));
            newCapsuleBox["capsule1"].should.be.bignumber.equal(new BN(0));
            newCapsuleBox["capsule2"].should.be.bignumber.equal(new BN(1));
        });
    });

    describe("Burning Capsules", async () => {
        // Passing cases
        it("should pass when both capsules are active", async () => {
            // Scheme 0 - equal schedule durations
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            await burn();

            // Verifiy new created capsules are not active
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Ensure capsule box reference was deleted
            const deletedCapsuleBox = await capsuleInstance.getCapsuleBox(0);
            deletedCapsuleBox["scheme"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule1"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule2"].should.be.bignumber.equal(new BN(0));
        });
        it("should pass when both capsules are not active", async () => {
            // Set vesting scheme and mint token
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(new BN(100)));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(tokenInstance1, capsuleOwner, 1000);
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 1000);

            // Burn token capsules
            await burn();

            // Ensure capsule box reference was deleted
            const deletedCapsuleBox = await capsuleInstance.getCapsuleBox(0);
            deletedCapsuleBox["scheme"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule1"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule2"].should.be.bignumber.equal(new BN(0));
        });
        it("should pass when one capsule is active and one is not", async () => {
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                baseDuration.sub(new BN(500))
            );
            await fillReserves(2, 5000, tokenInstance2);

            // Set vesting scheme and mint token
            await addVestingScheme([0, 2]);
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so seconds capsule is fully vested
            await time.increase(new BN(501));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyCapsuleIsActive(1, false);
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 500);

            // Burn token capsules
            await burn();

            // Verifiy other capsule is not active
            await verifyCapsuleIsActive(0, false);

            // Ensure capsule box reference was deleted
            const deletedCapsuleBox = await capsuleInstance.getCapsuleBox(0);
            deletedCapsuleBox["scheme"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule1"].should.be.bignumber.equal(new BN(0));
            deletedCapsuleBox["capsule2"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Transfering Capsules", async () => {
        // Passing cases
        it("should pass when both capsules are active", async () => {
            // Scheme 0 - equal schedule durations
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Transfer token
            await transfer();

            // Verifiy new owners
            await verifyCapsuleOwner(0, recipient);
            await verifyCapsuleOwner(1, recipient);

            // Verifiy capsules are still active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);
        });
        it("should pass when both capsules are not active", async () => {
            // Set vesting scheme and mint token
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(new BN(100)));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(tokenInstance1, capsuleOwner, 1000);
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 1000);

            // Transfer token
            await transfer();

            // Verifiy there are no capsule owners
            await verifyCapsuleOwner(0, constants.ZERO_ADDRESS);
            await verifyCapsuleOwner(1, constants.ZERO_ADDRESS);

            // Verifiy capsules are still inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);
        });
        it("should pass when one capsule is active and one is not", async () => {
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                baseDuration.sub(new BN(500))
            );
            await fillReserves(2, 5000, tokenInstance2);

            // Set vesting scheme and mint token
            await addVestingScheme([0, 2]);
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so seconds capsule is fully vested
            await time.increase(new BN(501));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, false);
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 500);

            // Transfer token capsules
            await transfer();

            // Verify capsule 1 is still active and that 2 is not
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, false);

            // Verify recipient got capsule 1 and that 2 has no owner
            await verifyCapsuleOwner(0, recipient);
            await verifyCapsuleOwner(1, constants.ZERO_ADDRESS);
        });
    });

    describe("Withdrawing Token Capsules", async () => {
        // Passing cases
        it("should pass when both capsules are active", async () => {
            // Scheme 0 - equal schedule durations
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Increase time so both capsules are half vested
            await time.increase(baseDuration.div(new BN(2)));

            // Withdraw tokens from both capsules
            await withdrawFromCapsules();

            // Owner should have balance of 500 (+-0) of tokens 1 & 2
            await verifyTokenBalanceInRange(
                tokenInstance1,
                capsuleOwner,
                500,
                1
            );
            await verifyTokenBalanceInRange(
                tokenInstance2,
                capsuleOwner,
                500,
                1
            );

            // Verifiy capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);
        });
        it("should pass when both capsules are not active", async () => {
            // Set vesting scheme and mint token
            await addVestingScheme();
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(new BN(100)));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(tokenInstance1, capsuleOwner, 1000);
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 1000);
        });
        it("should pass when one capsule is active and one is not", async () => {
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                baseDuration.sub(new BN(500))
            );
            await fillReserves(2, 5000, tokenInstance2);

            // Set vesting scheme and mint token
            await addVestingScheme([0, 2]);
            await setVestingScheme();
            await mint();

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Increase time so seconds capsule is fully vested
            await time.increase(new BN(501));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyTokenBalanceInRange(
                tokenInstance1,
                capsuleOwner,
                501,
                1
            );
            await verifyTokenBalance(tokenInstance2, capsuleOwner, 500);

            // Capsule 1 should be active & capsule 2 should be inactive
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, false);
        });
    });
});

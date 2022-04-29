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
const { tokenUnits } = require("../helpers");

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
    const baseRate = tokenUnits(1);
    const baseAmount = tokenUnits(1000);

    const fillReserves = async (
        scheduleId = 0,
        amount = baseAmount,
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
        amount = baseAmount,
        from = deployer
    ) => {
        return await capsuleInstance.createVestingSchedule(
            token,
            new BN(cliff),
            new BN(duration),
            new BN(amount),
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

    const mint = async (
        to = capsuleOwner,
        schedules = [new BN(0), new BN(1)],
        startTime = null,
        from = deployer
    ) => {
        if (!!!startTime) {
            startTime = await time.latest();
            startTime = startTime.add(startTimeOffset);
        }
        const estimatedGas = await capsuleInstance.mint.estimateGas(
            to,
            startTime,
            schedules
        );
        return await capsuleInstance.mint(to, startTime, schedules, {
            from: from,
            gas: estimatedGas,
        });
    };

    const burn = async (capsuleId = 0, from = capsuleOwner) => {
        return await capsuleInstance.burn(capsuleId, {
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
        await tokenInstance1.mint(deployer, tokenUnits(10000), {
            from: deployer,
        });
        await tokenInstance2.mint(deployer, tokenUnits(10000), {
            from: deployer,
        });

        // Create vesting schedules for each token
        await createSchedule(tokenInstance1.address);
        await createSchedule(tokenInstance2.address);

        // Fill schedule reserves with tokens 1 & 2
        await fillReserves(0, tokenUnits(5000), tokenInstance1);
        await fillReserves(1, tokenUnits(5000), tokenInstance2);
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Minting Tokens", async () => {
        // Failure cases
        it("should fail when start time in the past", async () => {
            let startTime = await time.latest();
            startTime = startTime.sub(new BN(1));
            await expectRevert(
                mint(capsuleOwner, [new BN(0), new BN(1)], startTime),
                "VestingCapsule: Start time in the past"
            );
        });

        // Passing cases
        it("should pass when token holds 1 capsule", async () => {
            // Add and set a vesting scheme
            await mint(capsuleOwner, [new BN(1)]);

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);

            // Verify the new capsule owner
            await verifyCapsuleOwner(0, capsuleOwner);

            // Verify the new capsule was created correctly
            const newCapsulePackage = await capsuleInstance.getCapsulePackage(
                0
            );
            newCapsulePackage["schedules"][0].should.be.bignumber.equal(
                new BN(1)
            );
            newCapsulePackage["capsules"][0].should.be.bignumber.equal(
                new BN(0)
            );
            newCapsulePackage["schedules"].length.should.be.equal(1);
            newCapsulePackage["capsules"].length.should.be.equal(1);
        });
        it("should pass when token holds 2 capsules", async () => {
            // Add and set a vesting scheme
            await mint(capsuleOwner, [new BN(0), new BN(1)]);

            // Verifiy new created capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);

            // Verify the new capsule owner
            await verifyCapsuleOwner(0, capsuleOwner);
            await verifyCapsuleOwner(1, capsuleOwner);

            // Verify the new capsule was created correctly
            const newCapsulePackage = await capsuleInstance.getCapsulePackage(
                0
            );
            newCapsulePackage["schedules"][0].should.be.bignumber.equal(
                new BN(0)
            );
            newCapsulePackage["schedules"][1].should.be.bignumber.equal(
                new BN(1)
            );
            newCapsulePackage["capsules"][0].should.be.bignumber.equal(
                new BN(0)
            );
            newCapsulePackage["capsules"][1].should.be.bignumber.equal(
                new BN(1)
            );
            newCapsulePackage["schedules"].length.should.be.equal(2);
            newCapsulePackage["capsules"].length.should.be.equal(2);
        });
        it("should pass when token holds 4 capsules", async () => {
            // Create an additional vesting schedules for each token
            await createSchedule(tokenInstance1.address);
            await createSchedule(tokenInstance2.address);

            // Fill schedule reserves 2 & 3
            await fillReserves(2, tokenUnits(5000), tokenInstance1);
            await fillReserves(3, tokenUnits(5000), tokenInstance2);

            // Add and set a vesting scheme
            await mint(capsuleOwner, [
                new BN(0),
                new BN(1),
                new BN(2),
                new BN(3),
            ]);

            // Verify the new capsule was created correctly
            const newPackage = await capsuleInstance.getCapsulePackage(0);

            newPackage["schedules"].length.should.be.equal(4);
            newPackage["capsules"].length.should.be.equal(4);

            // Verify capsules are active and owned by capsuleOwner
            for (let i = 0; i < 4; i++) {
                await verifyCapsuleIsActive(i, true);
                await verifyCapsuleOwner(i, capsuleOwner);
                newPackage["schedules"][i].should.be.bignumber.equal(new BN(i));
                newPackage["capsules"][i].should.be.bignumber.equal(new BN(i));
            }
        });
    });

    describe("Burning Tokens", async () => {
        // Passing cases
        it("should pass when token holds 2 active capsules", async () => {
            // Mint token with 2 capsules
            await mint();

            await burn();

            // Verifiy new created capsules are not active
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Verify the capsule package was deleted correctly
            const deletedPackage = await capsuleInstance.getCapsulePackage(0);
            deletedPackage["schedules"].length.should.be.equal(0);
            deletedPackage["capsules"].length.should.be.equal(0);
        });
        it("should pass when token holds 2 inactive capsules", async () => {
            // Mint token with 2 capsules
            await mint();

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(startTimeOffset));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                tokenUnits(1000)
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(1000)
            );

            // Burn token capsules
            await burn();

            // Verify the capsule package was deleted correctly
            const deletedPackage = await capsuleInstance.getCapsulePackage(0);
            deletedPackage["schedules"].length.should.be.equal(0);
            deletedPackage["capsules"].length.should.be.equal(0);
        });
        it("should pass when token holds 1 active & 1 inactive capsule", async () => {
            const shorterDuration = new BN(500);
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                shorterDuration,
                baseAmount.div(new BN(2))
            );
            await fillReserves(2, tokenUnits(5000), tokenInstance2);

            // Mint token with 2 capsules that have different durations
            await mint(capsuleOwner, [new BN(0), new BN(2)]);

            // Increase time so seconds capsule is fully vested
            await time.increase(shorterDuration.add(startTimeOffset));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyCapsuleIsActive(1, false);
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(500)
            );

            // Burn token capsules
            await burn();

            // Verifiy other capsule is not active
            await verifyCapsuleIsActive(0, false);

            // Verify the capsule package was deleted correctly
            const deletedPackage = await capsuleInstance.getCapsulePackage(0);
            deletedPackage["schedules"].length.should.be.equal(0);
            deletedPackage["capsules"].length.should.be.equal(0);
        });
    });

    describe("Transfering Tokens", async () => {
        //? NOTE - Need to test transfering called from an approved account
        // Passing cases
        it("should pass when token holds 2 active capsules", async () => {
            // Scheme 0 - equal schedule durations
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
        it("should pass when token holds 2 inactive capsules", async () => {
            // Set vesting scheme and mint token
            await mint();

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(new BN(100)));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                tokenUnits(1000)
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(1000)
            );

            // Transfer token
            await transfer();

            // Verifiy there are no capsule owners
            await verifyCapsuleOwner(0, constants.ZERO_ADDRESS);
            await verifyCapsuleOwner(1, constants.ZERO_ADDRESS);

            // Verifiy capsules are still inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);
        });
        it("should pass when token holds 1 active & 1 inactive capsule", async () => {
            const shorterDuration = new BN(500);
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                shorterDuration,
                baseAmount.div(new BN(2))
            );
            await fillReserves(2, tokenUnits(5000), tokenInstance2);

            // Mint token with 2 capsules that have different durations
            await mint(capsuleOwner, [new BN(0), new BN(2)]);

            // Increase time so seconds capsule is fully vested
            await time.increase(shorterDuration.add(startTimeOffset));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, false);
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(500)
            );

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
        it("should pass when token holds 2 active capsules", async () => {
            // Scheme 0 - equal schedule durations
            await mint();

            // Increase time so both capsules are half vested
            await time.increase(
                baseDuration.div(new BN(2)).add(startTimeOffset)
            );

            // Withdraw tokens from both capsules
            await withdrawFromCapsules();

            // Owner should have balance of 500 (+-10) of tokens 1 & 2
            await verifyTokenBalanceInRange(
                tokenInstance1,
                capsuleOwner,
                tokenUnits(500),
                tokenUnits(10)
            );
            await verifyTokenBalanceInRange(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(500),
                tokenUnits(10)
            );

            // Verifiy capsules are active
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, true);
        });
        it("should pass when token holds 2 inactive capsules", async () => {
            // Set vesting scheme and mint token
            await mint();

            // Increase time so both capsules are fully vested
            await time.increase(baseDuration.add(startTimeOffset));

            // This withdraw all tokens from both capsules
            await withdrawFromCapsules();

            // Capsules should be inactive
            await verifyCapsuleIsActive(0, false);
            await verifyCapsuleIsActive(1, false);

            // Owner should have balance of 1000 for tokens 1 & 2
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                tokenUnits(1000)
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(1000)
            );
        });
        it("should pass when token holds 1 active & 1 inactive capsule", async () => {
            const shorterDuration = new BN(500);
            // Create schedule and fill reserves
            await createSchedule(
                tokenInstance2.address,
                baseCliff,
                shorterDuration,
                baseAmount.div(new BN(2))
            );
            await fillReserves(2, tokenUnits(5000), tokenInstance2);

            // Mint token with 2 capsules that have different durations
            await mint(capsuleOwner, [new BN(0), new BN(2)]);

            // Increase time so seconds capsule is fully vested
            await time.increase(shorterDuration.add(startTimeOffset));

            // This should withdraw all tokens from the
            // second capsule and about half from the first
            await withdrawFromCapsules();

            // Capsule should be inactive owner should have token balance of 500
            await verifyTokenBalanceInRange(
                tokenInstance1,
                capsuleOwner,
                tokenUnits(500),
                tokenUnits(1)
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                tokenUnits(500)
            );

            // Capsule 1 should be active & capsule 2 should be inactive
            await verifyCapsuleIsActive(0, true);
            await verifyCapsuleIsActive(1, false);
        });
    });
});

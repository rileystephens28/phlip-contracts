const VestingVault = artifacts.require("VestingVaultMock");
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

contract("VestingVault", (accounts) => {
    let vaultInstance, tokenInstance1, tokenInstance2, beforeEachSnapshot;
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
            await token.approve(vaultInstance.address, new BN(amount), {
                from: from,
            });
        }
        return await vaultInstance.fillReserves(scheduleId, new BN(amount), {
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
        return await vaultInstance.createVestingSchedule(
            token,
            new BN(cliff),
            new BN(duration),
            new BN(rate),
            { from: from }
        );
    };

    const createSingleCapsule = async (
        owner = capsuleOwner,
        scheduleId = 0,
        startTime = 0,
        from = deployer
    ) => {
        if (startTime === 0) {
            startTime = await time.latest();
            startTime = startTime.add(startTimeOffset);
        }
        return await vaultInstance.createSingleCapsule(
            owner,
            scheduleId,
            new BN(startTime),
            { from: from }
        );
    };

    const createMultiCapsule = async (
        owner = capsuleOwner,
        scheduleIds = [0, 1],
        startTime = 0,
        from = deployer
    ) => {
        if (startTime === 0) {
            startTime = await time.latest();
            startTime = startTime.add(startTimeOffset);
        }
        const gasEstimate = await vaultInstance.createMultiCapsule.estimateGas(
            owner,
            scheduleIds,
            new BN(startTime)
        );
        return await vaultInstance.createMultiCapsule(
            owner,
            scheduleIds,
            new BN(startTime),
            { from: from, gas: gasEstimate }
        );
    };

    const destroySingleCapsule = async (capsuleId = 0, from = capsuleOwner) => {
        return await vaultInstance.destroySingleCapsule(capsuleId, {
            from: from,
        });
    };

    const destroyMultiCapsule = async (
        capsuleIds = [0, 1],
        from = capsuleOwner
    ) => {
        return await vaultInstance.destroyMultiCapsule(capsuleIds, {
            from: from,
        });
    };

    const transferSingleCapsule = async (
        capsuleId = 0,
        to = recipient,
        from = capsuleOwner
    ) => {
        return await vaultInstance.transferSingleCapsule(capsuleId, to, {
            from: from,
        });
    };

    const transferMultiCapsule = async (
        capsuleIds = [0, 1],
        to = recipient,
        from = capsuleOwner
    ) => {
        return await vaultInstance.transferMultiCapsule(capsuleIds, to, {
            from: from,
        });
    };

    const withdrawSingleCapsule = async (
        capsuleId = 0,
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawSingleCapsule(capsuleId, {
            from: from,
        });
    };

    const withdrawMultiCapsule = async (
        capsuleIds = [0, 1],
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawMultiCapsule(capsuleIds, {
            from: from,
        });
    };

    const withdrawSingleTokenLeftovers = async (
        capsuleId = 0,
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawSingleTokenLeftovers(capsuleId, {
            from: from,
        });
    };

    const withdrawMultiTokenLeftovers = async (
        capsuleIds = [0, 1],
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawMultiTokenLeftovers(capsuleIds, {
            from: from,
        });
    };

    const verifyCapsuleExists = async (capsuleId, bool) => {
        const exists = await vaultInstance.scheduleExists(capsuleId);
        exists.should.be.equal(bool);
    };

    const verifyTotalReserves = async (scheduleId, val) => {
        const reserves = await vaultInstance.totalReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyAvailableReserves = async (scheduleId, val) => {
        const reserves = await vaultInstance.availableReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyLockedReserves = async (scheduleId, val) => {
        const reserves = await vaultInstance.lockedReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyCapsuleIsActive = async (capsuleId, bool) => {
        const isActive = await vaultInstance.isCapsuleActive(capsuleId);
        isActive.should.be.equal(bool);
    };

    const verifyCapsuleOwner = async (capsuleId, address) => {
        const owner = await vaultInstance.capsuleOwnerOf(capsuleId);
        owner.should.be.equal(address);
    };

    const verifyVestedBalance = async (capsuleId, val) => {
        const vestedBalance = await vaultInstance.vestedBalanceOf(capsuleId);
        vestedBalance.should.be.bignumber.equal(new BN(val));
    };

    const verifyLeftoverBalance = async (account, token, val) => {
        const leftoverBalance = await vaultInstance.leftoverBalanceOf(
            account,
            token
        );
        leftoverBalance.should.be.bignumber.equal(new BN(val));
    };

    const verifyCapsuleCliffNotReached = async (
        capsuleId,
        cliff = baseCliff
    ) => {
        const capDetails = await vaultInstance.getCapsule(capsuleId);
        const currentTime = await time.latest();

        // Cliff seconds + start time
        const cliffTime = cliff.add(new BN(capDetails["startTime"]));
        currentTime.should.be.bignumber.lessThan(cliffTime);
    };

    const verifyCapsuleFullyVested = async (capsuleId) => {
        const capsuleDetails = await vaultInstance.getCapsule(capsuleId);
        const currentTime = await time.latest();
        capsuleDetails["endTime"].should.be.bignumber.lessThan(currentTime);
    };

    const verifyTokenBalance = async (token, address, amount) => {
        const tokenBalance = await token.balanceOf(address);
        tokenBalance.should.be.bignumber.equal(amount);
    };

    before(async () => {
        vaultInstance = await VestingVault.new({ from: deployer });
        tokenInstance1 = await ERC20Mock.new({ from: deployer });
        tokenInstance2 = await ERC20Mock.new({ from: deployer });

        // fund the deployer account with 10,000 of tokens 1 & 2
        await tokenInstance1.mint(deployer, 10000, { from: deployer });
        await tokenInstance2.mint(deployer, 10000, { from: deployer });

        // Create vesting schedules for each token
        await createSchedule(tokenInstance1.address);
        await createSchedule(tokenInstance2.address);

        // Fill schedule reserves with tokens 1 & 2
        await fillReserves(0, 1000, tokenInstance1);
        await fillReserves(1, 2000, tokenInstance2);
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Creating Vesting Schedules", async () => {
        // Failure cases
        it("should fail when token address is 0x0 ", async () => {
            await expectRevert(
                createSchedule(constants.ZERO_ADDRESS),
                "VestingVault: Token address cannot be 0x0"
            );
        });
        it("should fail when durationSeconds is 0 ", async () => {
            await expectRevert(
                createSchedule(tokenInstance1.address, baseCliff, 0),
                "VestingVault: Duration must be greater than 0"
            );
        });
        it("should fail when tokenRatePerSecond is 0 ", async () => {
            await expectRevert(
                createSchedule(
                    tokenInstance1.address,
                    baseCliff,
                    baseDuration,
                    0
                ),
                "VestingVault: Token release rate must be greater than 0"
            );
        });
        it("should fail when cliffSeconds >= durationSeconds ", async () => {
            await expectRevert(
                createSchedule(tokenInstance1.address, 2000),
                "VestingVault: Cliff must be less than duration"
            );
        });

        // Passing cases
        it("should pass when parmas are valid", async () => {
            await createSchedule();

            const newSchedule = await vaultInstance.getSchedule(0);

            // check that the new schedule has correct values
            newSchedule["token"].should.be.equal(tokenInstance1.address);
            newSchedule["rate"].should.be.bignumber.equal(baseRate);
            newSchedule["cliff"].should.be.bignumber.equal(baseCliff);
            newSchedule["duration"].should.be.bignumber.equal(baseDuration);
            newSchedule["amount"].should.be.bignumber.equal(
                baseRate.mul(baseDuration)
            );
        });
    });

    describe("Filling Schedule Reserves", async () => {
        // Failure cases
        it("should fail when schedule ID is invalid", async () => {
            await expectRevert(
                fillReserves(2),
                "VestingVault: Schedule does not exist"
            );
        });
        it("should fail when fill amount is 0 ", async () => {
            await expectRevert(
                fillReserves(0, new BN(0)),
                "VestingVault: Fill amount must be greater than 0"
            );
        });
        it("should fail when caller has not approved ERC20 spending", async () => {
            await expectRevert(
                fillReserves(0, new BN(1000), tokenInstance1, deployer, false),
                "ERC20: insufficient allowance"
            );
        });
        // Passing cases
        it("should pass when parmas are valid and ERC20 control is approved", async () => {
            // Should have 1000 tokens in total
            await verifyTotalReserves(0, 1000);

            // Should have 1000 tokens available for capsules
            await verifyAvailableReserves(0, 1000);

            await fillReserves();

            // Total reserves should now have 2000 tokens
            await verifyTotalReserves(0, 2000);

            // Available reserves should now have 2000 tokens
            await verifyAvailableReserves(0, 2000);
        });
    });

    describe("Creating Single Capsules", async () => {
        // Failure cases
        it("should fail when owner is 0x0 ", async () => {
            await expectRevert(
                createSingleCapsule(constants.ZERO_ADDRESS),
                "VestingVault: Owner cannot be 0x0"
            );
        });
        it("should fail when schedule ID is invalid", async () => {
            await expectRevert(
                createSingleCapsule(capsuleOwner, 2),
                "VestingVault: Invalid schedule ID"
            );
        });
        it("should fail when startTime < block.timestamp", async () => {
            let startTime = await time.latest();
            startTime = startTime.sub(new BN(100));
            await expectRevert(
                createSingleCapsule(capsuleOwner, 0, startTime),
                "VestingVault: Start time cannot be in the past"
            );
        });
        it("should fail when schedules available reserves < schedule amount", async () => {
            // Create a schedule that vests 1000 tokens per second for 1000 seconds
            await createSchedule(
                tokenInstance1.address,
                baseCliff,
                baseDuration,
                new BN(1000)
            );

            await expectRevert(
                createSingleCapsule(capsuleOwner, 2),
                "VestingVault: Insufficient token reserves"
            );
        });

        // Passing cases
        it("should pass when parmas are valid", async () => {
            // Should have 1000 tokens available for capsules
            await verifyAvailableReserves(0, 1000);

            // Should have 0 tokens locked in capsules
            await verifyLockedReserves(0, 0);

            let startTime = await time.latest();
            startTime = startTime.add(new BN(100));

            // Create capsule
            await createSingleCapsule(capsuleOwner, 0, startTime);

            // Should have 0 tokens available for capsules
            await verifyAvailableReserves(0, 0);

            // Reserves should now have 1000 tokens locked
            await verifyLockedReserves(0, 1000);

            await verifyCapsuleOwner(0, capsuleOwner);

            const newCapsule = await vaultInstance.getCapsule(0);
            // check that the new schedule has correct values
            newCapsule["scheduleId"].should.be.bignumber.equal(new BN(0));
            newCapsule["startTime"].should.be.bignumber.equal(startTime);
            newCapsule["endTime"].should.be.bignumber.equal(
                startTime.add(baseDuration)
            );
            newCapsule["claimedAmount"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Creating Multi Capsules", async () => {
        // Failure cases
        it("should fail when owner is 0x0 ", async () => {
            await expectRevert(
                createMultiCapsule(constants.ZERO_ADDRESS),
                "VestingVault: Owner cannot be 0x0"
            );
        });
        it("should fail when startTime < block.timestamp", async () => {
            let startTime = await time.latest();
            startTime = startTime.sub(new BN(100));
            await expectRevert(
                createMultiCapsule(capsuleOwner, [0, 1], startTime),
                "VestingVault: Start time cannot be in the past"
            );
        });
        it("should fail when schedule IDs array is empty", async () => {
            await expectRevert(
                createMultiCapsule(capsuleOwner, []),
                "VestingVault: No vesting schedule IDs provided"
            );
        });
        it("should fail when schedule ID in array is invalid", async () => {
            await expectRevert(
                createMultiCapsule(capsuleOwner, [0, 3]),
                "VestingVault: Invalid schedule ID"
            );
        });
        it("should fail when schedules available reserves < schedule amount", async () => {
            // Create a schedule that vests 1000 tokens per second for 1000 seconds
            await createSchedule(
                tokenInstance1.address,
                baseCliff,
                baseDuration,
                new BN(1000)
            );

            await expectRevert(
                createMultiCapsule(capsuleOwner, [0, 2]),
                "VestingVault: Insufficient token reserves"
            );
        });

        // Passing cases
        it("should pass when parmas are valid", async () => {
            // Schedule 0 should have 1000 tokens available for capsules
            await verifyAvailableReserves(0, 1000);

            // Schedule 0 should have 0 tokens locked in capsules
            await verifyLockedReserves(0, 0);

            // Schedule 1 should have 2000 tokens available for capsules
            await verifyAvailableReserves(1, 2000);

            // Schedule 1 should have 0 tokens locked in capsules
            await verifyLockedReserves(1, 0);

            let startTime = await time.latest();
            startTime = startTime.add(new BN(100));

            // Create capsule
            await createMultiCapsule(capsuleOwner, [0, 1], startTime);

            // Schedule 0 should have 0 tokens available for capsules
            await verifyAvailableReserves(0, 0);

            // Schedule 1000 should have 0 tokens locked in capsules
            await verifyLockedReserves(0, 1000);

            // Schedule 1000 should have 2000 tokens available for capsules
            await verifyAvailableReserves(1, 1000);

            // Schedule 1000 should have 0 tokens locked in capsules
            await verifyLockedReserves(1, 1000);

            await verifyCapsuleOwner(0, capsuleOwner);
            await verifyCapsuleOwner(1, capsuleOwner);

            const newCapsule1 = await vaultInstance.getCapsule(0);
            // check that the new schedule has correct values
            newCapsule1["scheduleId"].should.be.bignumber.equal(new BN(0));
            newCapsule1["startTime"].should.be.bignumber.equal(startTime);
            newCapsule1["endTime"].should.be.bignumber.equal(
                startTime.add(baseDuration)
            );
            newCapsule1["claimedAmount"].should.be.bignumber.equal(new BN(0));

            const newCapsule2 = await vaultInstance.getCapsule(1);
            // check that the new schedule has correct values
            newCapsule2["scheduleId"].should.be.bignumber.equal(new BN(1));
            newCapsule2["startTime"].should.be.bignumber.equal(startTime);
            newCapsule2["endTime"].should.be.bignumber.equal(
                startTime.add(baseDuration)
            );
            newCapsule2["claimedAmount"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Transfering Single Capsule", async () => {
        beforeEach(async () => {
            await createSingleCapsule();
        });

        // Failure cases
        it("should fail when recipient is 0x0 ", async () => {
            await expectRevert(
                transferSingleCapsule(0, constants.ZERO_ADDRESS),
                "VestingVault: Cannot transfer capsule to 0x0"
            );
        });
        it("should fail when recipient is self", async () => {
            await expectRevert(
                transferSingleCapsule(0, capsuleOwner),
                "VestingVault: Cannot transfer capsule to self"
            );
        });
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                transferSingleCapsule(1),
                "VestingVault: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                transferSingleCapsule(0, account, otherAccount),
                "VestingVault: Caller is not capsule owner"
            );
        });
        it("should fail when capsule is fully vested", async () => {
            // Increase time to the end of the vesting period
            await time.increase(secondsUntilFullyVested);

            // Ensure capsule is fully vested
            await verifyCapsuleFullyVested(0);

            await expectRevert(
                transferSingleCapsule(),
                "VestingVault: Capsule is fully vested"
            );
        });

        // Passing cases
        it("should pass when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);

            await transferSingleCapsule();

            // Check that capsule owner is now recipient
            await verifyCapsuleOwner(0, recipient);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Previous owner should have no leftover balance
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance1.address,
                0
            );
        });
        it("should pass when capsule has partially vested", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance = await vaultInstance.vestedBalanceOf(0);

            // Transfer capsule to recipient
            await transferSingleCapsule();

            // Check that capsule owner is now recipient
            await verifyCapsuleOwner(0, recipient);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Previous owner should have ~20% of total capsules tokens leftover
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance1.address,
                vestedBalance
            );
        });
    });

    describe("Transfering Multi Capsule", async () => {
        beforeEach(async () => {
            await createMultiCapsule();
        });

        // Failure cases
        it("should fail when recipient is 0x0 ", async () => {
            await expectRevert(
                transferMultiCapsule([0, 1], constants.ZERO_ADDRESS),
                "VestingVault: Cannot transfer capsule to 0x0"
            );
        });
        it("should fail when recipient is self", async () => {
            await expectRevert(
                transferMultiCapsule([0, 1], capsuleOwner),
                "VestingVault: Cannot transfer capsule to self"
            );
        });
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                transferMultiCapsule([1, 2]),
                "VestingVault: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                transferMultiCapsule([0, 1], account, otherAccount),
                "VestingVault: Caller is not capsule owner"
            );
        });
        it("should fail when capsule is fully vested", async () => {
            // Increase time to the end of the vesting period
            await time.increase(secondsUntilFullyVested);

            // Ensure capsule is fully vested
            await verifyCapsuleFullyVested(0);
            await verifyCapsuleFullyVested(1);

            await expectRevert(
                transferMultiCapsule(),
                "VestingVault: Capsule is fully vested"
            );
        });

        // Passing cases
        it("should pass when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);
            await verifyCapsuleCliffNotReached(1);

            await transferMultiCapsule();

            // Check that capsule owner is now recipient
            await verifyCapsuleOwner(0, recipient);
            await verifyCapsuleOwner(1, recipient);

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Previous owner should have no tokens leftover
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance1.address,
                0
            );
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance2.address,
                0
            );
        });
        it("should pass when capsule has partially vested", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            const vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            // Transfer capsule to recipient
            await transferMultiCapsule();

            // Check that capsule owner is now recipient
            await verifyCapsuleOwner(0, recipient);
            await verifyCapsuleOwner(1, recipient);

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Previous owner should have ~20% of total capsules tokens leftover
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance1.address,
                vestedBalance1
            );
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance2.address,
                vestedBalance2
            );
        });
    });

    describe("Withdrawing Single Capsule Balance", async () => {
        beforeEach(async () => {
            await createSingleCapsule();
        });

        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                withdrawSingleCapsule(1),
                "VestingVault: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                withdrawSingleCapsule(0, otherAccount),
                "VestingVault: Caller is not capsule owner"
            );
        });
        it("should fail when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);

            await expectRevert(
                withdrawSingleCapsule(),
                "VestingVault: No tokens to withdraw"
            );
        });
        it("should fail when 100% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);

            // Get balance of capsule before claiming
            const vestedBalance = await vaultInstance.vestedBalanceOf(0);
            await withdrawSingleCapsule();

            // Capsule should have been emptied and then deleted, so the capsuleOwner is no longer the owner
            await expectRevert(
                withdrawSingleCapsule(),
                "VestingVault: Caller is not capsule owner"
            );

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance
            );
        });

        // Passing cases
        it("should pass when 0% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance = await vaultInstance.vestedBalanceOf(0);

            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance
            );
        });
        it("should pass when 50% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );

            // Increase time 20% again so capsule is half of vested tokens have been claimed
            await time.increase(secondsUntil20PercVested);

            const vestedBalance2 = await vaultInstance.vestedBalanceOf(0);

            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that owner token balance = sum of the two claim amounts
            const totalClaimAmount = vestedBalance1.add(vestedBalance2);
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                totalClaimAmount
            );
        });
        it("should pass when 0% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);
            const balance = await vaultInstance.vestedBalanceOf(0);
            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Schedule amount should equal vested balance
            const schedule = await vaultInstance.getSchedule(0);
            balance.should.be.bignumber.equal(schedule["amount"]);

            // Ensure withdrawn amount is equal to vested balance
            await verifyTokenBalance(tokenInstance1, capsuleOwner, balance);
        });
        it("should pass when 50% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 50% vested
            await time.increase(secondsUntil50PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );

            // Increase time 50% again so capsule is fully vested and half claimed
            await time.increase(secondsUntil50PercVested);

            // Get balance of capsule before claiming again
            const vestedBalance2 = await vaultInstance.vestedBalanceOf(0);
            await withdrawSingleCapsule(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that owner token balance and schedule amount = sum of the two withdraw amounts
            const totalClaimAmount = vestedBalance1.add(vestedBalance2);
            const schedule = await vaultInstance.getSchedule(0);
            totalClaimAmount.should.be.bignumber.equal(schedule["amount"]);

            // Ensure withdrawn amount is equal total schedule amount
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                totalClaimAmount
            );
        });
    });

    describe("Withdrawing Multi Capsule Balance", async () => {
        beforeEach(async () => {
            await createMultiCapsule();
        });

        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                withdrawMultiCapsule([2, 3]),
                "VestingVault: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                withdrawMultiCapsule([0, 1], otherAccount),
                "VestingVault: Caller is not capsule owner"
            );
        });
        it("should fail when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);
            await verifyCapsuleCliffNotReached(1);

            await expectRevert(
                withdrawMultiCapsule(),
                "VestingVault: No tokens to withdraw"
            );
        });
        it("should fail when 100% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            const vestedBalance2 = await vaultInstance.vestedBalanceOf(1);
            await withdrawMultiCapsule();

            // Capsule should have been emptied and then deleted, so the capsuleOwner is no longer the owner
            await expectRevert(
                withdrawMultiCapsule(),
                "VestingVault: Caller is not capsule owner"
            );

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                vestedBalance2
            );
        });

        // Passing cases
        it("should pass when 0% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            const vestedBalance2 = await vaultInstance.vestedBalanceOf(1);
            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                vestedBalance2
            );
        });
        it("should pass when 50% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            let vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            let vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            let totalWithdrawn1 = vestedBalance1;
            let totalWithdrawn2 = vestedBalance2;

            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                vestedBalance2
            );

            // Increase time 20% again so capsule is half of vested tokens have been claimed
            await time.increase(secondsUntil20PercVested);

            vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            // Update total token balance withdrawn
            totalWithdrawn1 = totalWithdrawn1.add(vestedBalance1);
            totalWithdrawn2 = totalWithdrawn2.add(vestedBalance2);

            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                totalWithdrawn1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                totalWithdrawn2
            );
        });
        it("should pass when 0% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);

            // Get balance of capsule before claiming
            let vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            let vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                vestedBalance2
            );

            // Schedule amounts should equal vested balances
            const schedule1 = await vaultInstance.getSchedule(0);
            vestedBalance1.should.be.bignumber.equal(schedule1["amount"]);

            const schedule2 = await vaultInstance.getSchedule(1);
            vestedBalance2.should.be.bignumber.equal(schedule2["amount"]);
        });
        it.only("should pass when 50% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 50% vested
            await time.increase(secondsUntil50PercVested);

            // Get balance of capsule before claiming
            let vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            let vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            let totalWithdrawn1 = vestedBalance1;
            let totalWithdrawn2 = vestedBalance2;

            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                vestedBalance1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                vestedBalance2
            );

            // Increase time 50% again so capsule is fully vested and half claimed
            await time.increase(secondsUntil50PercVested);

            vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            vestedBalance2 = await vaultInstance.vestedBalanceOf(1);

            // Update total token balance withdrawn
            totalWithdrawn1 = totalWithdrawn1.add(vestedBalance1);
            totalWithdrawn2 = totalWithdrawn2.add(vestedBalance2);

            await withdrawMultiCapsule();

            // Capsules should have no claimable balance
            await verifyVestedBalance(0, 0);
            await verifyVestedBalance(1, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance1,
                capsuleOwner,
                totalWithdrawn1
            );
            await verifyTokenBalance(
                tokenInstance2,
                capsuleOwner,
                totalWithdrawn2
            );

            // Schedule amounts should equal vested balances
            const schedule1 = await vaultInstance.getSchedule(0);
            totalWithdrawn1.should.be.bignumber.equal(schedule1["amount"]);

            const schedule2 = await vaultInstance.getSchedule(1);
            totalWithdrawn2.should.be.bignumber.equal(schedule2["amount"]);
        });
    });
});

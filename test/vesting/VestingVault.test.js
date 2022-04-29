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

const { tokenUnits } = require("../helpers");

require("chai").should();

contract("VestingVault", (accounts) => {
    let vaultInstance, tokenInstance, tokenInstance2, beforeEachSnapshot;
    const [deployer, capsuleOwner, recipient, account, otherAccount] = accounts;

    const startTimeOffset = new BN(100);

    // 100 second cliff
    const baseCliff = new BN(100);

    // 1000 second vesting duration
    const baseDuration = new BN(1000);

    // 1 token unit per second
    const baseRate = tokenUnits(1);
    const baseAmount = tokenUnits(1000);

    const secondsUntil20PercVested = startTimeOffset.add(
        baseDuration.div(new BN(5))
    );

    const secondsUntil50PercVested = startTimeOffset.add(
        baseDuration.div(new BN(2))
    );

    const secondsUntilFullyVested = startTimeOffset.add(baseDuration);

    const fillReserves = async (
        scheduleId = 0,
        amount = baseAmount,
        token = tokenInstance,
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
        token = tokenInstance.address,
        cliff = baseCliff,
        duration = baseDuration,
        amount = baseAmount,
        from = deployer
    ) => {
        return await vaultInstance.createVestingSchedule(
            token,
            new BN(cliff),
            new BN(duration),
            new BN(amount),
            { from: from }
        );
    };

    const createCapsule = async (
        owner = capsuleOwner,
        scheduleId = 0,
        startTime = 0,
        from = deployer
    ) => {
        if (startTime === 0) {
            startTime = await time.latest();
            startTime = startTime.add(startTimeOffset);
        }
        return await vaultInstance.createCapsule(
            owner,
            scheduleId,
            new BN(startTime),
            { from: from }
        );
    };

    const safeCreateCapsule = async (
        owner = capsuleOwner,
        scheduleId = 0,
        startTime = 0,
        from = deployer
    ) => {
        if (startTime === 0) {
            startTime = await time.latest();
            startTime = startTime.add(startTimeOffset);
        }
        return await vaultInstance.safeCreateCapsule(
            owner,
            scheduleId,
            new BN(startTime),
            { from: from }
        );
    };

    const transferCapsule = async (
        capsuleId = 0,
        to = recipient,
        from = capsuleOwner
    ) => {
        return await vaultInstance.transferCapsule(capsuleId, to, {
            from: from,
        });
    };

    const safeTransferCapsule = async (
        capsuleId = 0,
        to = recipient,
        from = capsuleOwner
    ) => {
        return await vaultInstance.safeTransferCapsule(capsuleId, to, {
            from: from,
        });
    };

    const destroyCapsule = async (capsuleId = 0, from = capsuleOwner) => {
        return await vaultInstance.destroyCapsule(capsuleId, {
            from: from,
        });
    };

    const safeDestroyCapsule = async (capsuleId = 0, from = capsuleOwner) => {
        return await vaultInstance.safeDestroyCapsule(capsuleId, {
            from: from,
        });
    };

    const withdrawCapsuleBalance = async (
        capsuleId = 0,
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawCapsuleBalance(capsuleId, {
            from: from,
        });
    };

    const withdrawTokenLeftovers = async (
        tokenAddress = tokenInstance.address,
        from = capsuleOwner
    ) => {
        return await vaultInstance.withdrawTokenLeftovers(tokenAddress, {
            from: from,
        });
    };

    const verifyScheduleExists = async (capsuleId, bool) => {
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
        tokenBalance.should.be.bignumber.equal(new BN(amount));
    };

    before(async () => {
        vaultInstance = await VestingVault.new({ from: deployer });
        tokenInstance = await ERC20Mock.new({ from: deployer });

        // fund the deployer account with 10,000 mock ERC20 tokens
        await tokenInstance.mint(deployer, tokenUnits(10000), {
            from: deployer,
        });

        // Create vesting schedules for each token
        await createSchedule(tokenInstance.address);

        // Fill schedule 0 reserves
        await fillReserves(0, tokenUnits(1000), tokenInstance);
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
                "VestingVault: Token cannot be 0x0"
            );
        });
        it("should fail when duration is 0 ", async () => {
            await expectRevert(
                createSchedule(tokenInstance.address, baseCliff, 0),
                "VestingVault: Duration cannot be 0"
            );
        });
        it("should fail when amount is 0 ", async () => {
            await expectRevert(
                createSchedule(
                    tokenInstance.address,
                    baseCliff,
                    baseDuration,
                    0
                ),
                "VestingVault: Amount cannot be 0"
            );
        });
        it("should fail when cliff >= duration ", async () => {
            await expectRevert(
                createSchedule(tokenInstance.address, 2000),
                "VestingVault: Cliff must be less than duration"
            );
        });

        // Passing cases
        it("should pass when parmas are valid", async () => {
            await createSchedule();

            const newSchedule = await vaultInstance.getSchedule(0);

            // check that the new schedule has correct values
            newSchedule["token"].should.be.equal(tokenInstance.address);
            newSchedule["rate"].should.be.bignumber.equal(baseRate);
            newSchedule["cliff"].should.be.bignumber.equal(baseCliff);
            newSchedule["duration"].should.be.bignumber.equal(baseDuration);
            newSchedule["amount"].should.be.bignumber.equal(baseAmount);
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
                fillReserves(
                    0,
                    tokenUnits(1000),
                    tokenInstance,
                    deployer,
                    false
                ),
                "ERC20: insufficient allowance"
            );
        });
        // Passing cases
        it("should pass when parmas are valid and ERC20 control is approved", async () => {
            // Should have 1000 tokens in total
            await verifyTotalReserves(0, tokenUnits(1000));

            // Should have 1000 tokens available for capsules
            await verifyAvailableReserves(0, tokenUnits(1000));

            await fillReserves();

            // Total reserves should now have 2000 tokens
            await verifyTotalReserves(0, tokenUnits(1000).mul(new BN(2)));

            // Available reserves should now have 2000 tokens
            await verifyAvailableReserves(0, tokenUnits(1000).mul(new BN(2)));
        });
    });

    describe("Creating Capsules", async () => {
        context("With Base Create", async () => {
            // Failure cases
            it("should fail when schedule ID is invalid", async () => {
                await expectRevert(
                    createCapsule(capsuleOwner, 2),
                    "VestingVault: Invalid schedule ID"
                );
            });

            it("should fail when schedules available reserves < schedule amount", async () => {
                // Create a schedule that vests 1000 tokens per second for 1000 seconds
                await createSchedule();

                await expectRevert(
                    createCapsule(capsuleOwner, 1),
                    "VestingVault: Insufficient token reserves"
                );
            });

            // Passing cases
            it("should pass when parmas are valid", async () => {
                // Should have 1000 tokens available for capsules
                await verifyAvailableReserves(0, tokenUnits(1000));

                // Should have 0 tokens locked in capsules
                await verifyLockedReserves(0, 0);

                let startTime = await time.latest();
                startTime = startTime.add(new BN(100));

                // Create capsule
                await createCapsule(capsuleOwner, 0, startTime);

                // Should have 0 tokens available for capsules
                await verifyAvailableReserves(0, 0);

                // Reserves should now have 1000 tokens locked
                await verifyLockedReserves(0, tokenUnits(1000));

                await verifyCapsuleOwner(0, capsuleOwner);

                const newCapsule = await vaultInstance.getCapsule(0);
                // check that the new schedule has correct values
                newCapsule["scheduleId"].should.be.bignumber.equal(new BN(0));
                newCapsule["startTime"].should.be.bignumber.equal(startTime);
                newCapsule["endTime"].should.be.bignumber.equal(
                    startTime.add(baseDuration)
                );
                newCapsule["claimedAmount"].should.be.bignumber.equal(
                    new BN(0)
                );
            });
        });
        context("With Safe Create", async () => {
            // Failure cases
            it("should fail when owner is 0x0 ", async () => {
                await expectRevert(
                    safeCreateCapsule(constants.ZERO_ADDRESS),
                    "VestingVault: Owner cannot be 0x0"
                );
            });
            it("should fail when startTime < block.timestamp", async () => {
                let startTime = await time.latest();
                startTime = startTime.sub(new BN(100));
                await expectRevert(
                    safeCreateCapsule(capsuleOwner, 0, startTime),
                    "VestingVault: Start time cannot be in the past"
                );
            });
            // Passing cases
            it("should pass when owner is not 0x0 & start time is not in the past", async () => {
                // Should have 1000 tokens available for capsules
                await verifyAvailableReserves(0, tokenUnits(1000));

                // Should have 0 tokens locked in capsules
                await verifyLockedReserves(0, 0);

                let startTime = await time.latest();
                startTime = startTime.add(new BN(100));

                // Create capsule
                await safeCreateCapsule(capsuleOwner, 0, startTime);

                // Should have 0 tokens available for capsules
                await verifyAvailableReserves(0, 0);

                // Reserves should now have 1000 tokens locked
                await verifyLockedReserves(0, tokenUnits(1000));

                await verifyCapsuleOwner(0, capsuleOwner);

                const newCapsule = await vaultInstance.getCapsule(0);
                // check that the new schedule has correct values
                newCapsule["scheduleId"].should.be.bignumber.equal(new BN(0));
                newCapsule["startTime"].should.be.bignumber.equal(startTime);
                newCapsule["endTime"].should.be.bignumber.equal(
                    startTime.add(baseDuration)
                );
                newCapsule["claimedAmount"].should.be.bignumber.equal(
                    new BN(0)
                );
            });
        });
    });

    describe("Transfering Capsules", async () => {
        beforeEach(async () => {
            await createCapsule();
        });

        context("With Base Transfer", async () => {
            // Failure cases
            it("should fail when capsule ID is out of bounds", async () => {
                await expectRevert(
                    transferCapsule(1),
                    "VestingVault: Invalid capsule ID"
                );
            });
            it("should fail when msg.sender is not capsule owner", async () => {
                await expectRevert(
                    transferCapsule(0, account, otherAccount),
                    "VestingVault: Caller is not capsule owner"
                );
            });

            // Passing cases
            it("should pass when cliff has not been reached", async () => {
                // Ensure capsule cliff has not been reached
                await verifyCapsuleCliffNotReached(0);

                await transferCapsule();

                // Check that capsule owner is now recipient
                await verifyCapsuleOwner(0, recipient);

                // Capsule should have no claimable balance
                await verifyVestedBalance(0, 0);

                // Previous owner should have no leftover balance
                await verifyLeftoverBalance(
                    capsuleOwner,
                    tokenInstance.address,
                    0
                );
            });
            it("should pass when capsule has partially vested", async () => {
                // Increase time so capsule is 20% vested
                await time.increase(secondsUntil20PercVested);

                // Get balance of capsule before claiming
                const vestedBalance = await vaultInstance.vestedBalanceOf(0);

                // Transfer capsule to recipient
                await transferCapsule();

                // Check that capsule owner is now recipient
                await verifyCapsuleOwner(0, recipient);

                // Capsule should have no claimable balance
                await verifyVestedBalance(0, 0);

                // Previous owner should have ~20% of total capsules tokens leftover
                await verifyLeftoverBalance(
                    capsuleOwner,
                    tokenInstance.address,
                    vestedBalance
                );
            });
        });
        context("With Safe Transfer", async () => {
            // Failure cases
            it("should fail when recipient is 0x0", async () => {
                await expectRevert(
                    safeTransferCapsule(0, constants.ZERO_ADDRESS),
                    "VestingVault: Cannot transfer capsule to 0x0"
                );
            });
            it("should fail when recipient is self", async () => {
                await expectRevert(
                    safeTransferCapsule(0, capsuleOwner),
                    "VestingVault: Cannot transfer capsule to self"
                );
            });
            it("should fail when capsule is fully vested", async () => {
                // Increase time to the end of the vesting period
                await time.increase(secondsUntilFullyVested);

                // Ensure capsule is fully vested
                await verifyCapsuleFullyVested(0);

                await expectRevert(
                    safeTransferCapsule(),
                    "VestingVault: Capsule is fully vested"
                );
            });

            // Passing cases
            it("should pass when cliff has not been reached", async () => {
                // Ensure capsule cliff has not been reached
                await verifyCapsuleCliffNotReached(0);

                await safeTransferCapsule();

                // Check that capsule owner is now recipient
                await verifyCapsuleOwner(0, recipient);

                // Capsule should have no claimable balance
                await verifyVestedBalance(0, 0);

                // Previous owner should have no leftover balance
                await verifyLeftoverBalance(
                    capsuleOwner,
                    tokenInstance.address,
                    0
                );
            });
            it("should pass when capsule has partially vested", async () => {
                // Increase time so capsule is 20% vested
                await time.increase(secondsUntil20PercVested);

                // Get balance of capsule before claiming
                const vestedBalance = await vaultInstance.vestedBalanceOf(0);

                // Transfer capsule to recipient
                await safeTransferCapsule();

                // Check that capsule owner is now recipient
                await verifyCapsuleOwner(0, recipient);

                // Capsule should have no claimable balance
                await verifyVestedBalance(0, 0);

                // Previous owner should have ~20% of total capsules tokens leftover
                await verifyLeftoverBalance(
                    capsuleOwner,
                    tokenInstance.address,
                    vestedBalance
                );
            });
        });
    });

    describe("Destroying Capsules", async () => {
        beforeEach(async () => {
            await createCapsule();
        });
        context("With Base Destroy", async () => {
            // Failure cases
            it("should fail when caller is not capsule owner", async () => {
                await expectRevert(
                    destroyCapsule(0, otherAccount),
                    "VestingVault: Caller is not capsule owner"
                );
            });

            // Passing cases
            it("should pass when capsule has never been withdrawn from", async () => {
                // Should be active
                await verifyCapsuleIsActive(0, true);

                // Should have 0 tokens available (beforeEach created capsule)
                await verifyAvailableReserves(0, 0);

                await destroyCapsule();

                // Should no longer be active
                await verifyCapsuleIsActive(0, false);

                // Should have 1000 tokens available
                await verifyAvailableReserves(0, tokenUnits(1000));
            });
            it("should pass when capsule has been withdrawn from before", async () => {
                // Increase time so capsule is 20% vested
                await time.increase(secondsUntil20PercVested);

                // Should be active
                await verifyCapsuleIsActive(0, true);

                // Should have 0 tokens available (beforeEach created capsule)
                await verifyAvailableReserves(0, 0);

                const vestedBalance = await vaultInstance.vestedBalanceOf(0);

                // Should withdraw ~20% of total tokens
                await withdrawCapsuleBalance(0);

                // Destroy and release remaining tokens
                await destroyCapsule();

                // Should no longer be active
                await verifyCapsuleIsActive(0, false);

                // Should have 1000 tokens available
                await verifyAvailableReserves(
                    0,
                    tokenUnits(1000).sub(vestedBalance)
                );
            });
        });
        context("With Safe Destroy", async () => {
            // Failure cases
            it("should fail when capsule ID is invalid", async () => {
                await expectRevert(
                    safeDestroyCapsule(2),
                    "VestingVault: Capsule is not active"
                );
            });
            it("should fail when capsule has already been destroyed", async () => {
                await safeDestroyCapsule();
                await expectRevert(
                    safeDestroyCapsule(),
                    "VestingVault: Capsule is not active"
                );
            });

            // Passing cases
            it("should pass when capsule has never been withdrawn from", async () => {
                // Should be active
                await verifyCapsuleIsActive(0, true);

                // Should have 0 tokens available (beforeEach created capsule)
                await verifyAvailableReserves(0, 0);

                await safeDestroyCapsule();

                // Should no longer be active
                await verifyCapsuleIsActive(0, false);

                // Should have 1000 tokens available
                await verifyAvailableReserves(0, tokenUnits(1000));
            });
            it("should pass when capsule has been withdrawn from before", async () => {
                // Increase time so capsule is 20% vested
                await time.increase(secondsUntil20PercVested);

                // Should be active
                await verifyCapsuleIsActive(0, true);

                // Should have 0 tokens available (beforeEach created capsule)
                await verifyAvailableReserves(0, 0);

                const vestedBalance = await vaultInstance.vestedBalanceOf(0);

                // Should withdraw ~20% of total tokens
                await withdrawCapsuleBalance(0);

                // Destroy and release remaining tokens
                await safeDestroyCapsule();

                // Should no longer be active
                await verifyCapsuleIsActive(0, false);

                // Should have 1000 tokens available
                await verifyAvailableReserves(
                    0,
                    tokenUnits(1000).sub(vestedBalance)
                );
            });
        });
    });

    describe("Withdrawing Capsule Balance", async () => {
        beforeEach(async () => {
            await createCapsule();
        });

        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                withdrawCapsuleBalance(1),
                "VestingVault: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                withdrawCapsuleBalance(0, otherAccount),
                "VestingVault: Caller is not capsule owner"
            );
        });

        it("should fail when 100% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);

            // Get balance of capsule before claiming
            const vestedBalance = await vaultInstance.vestedBalanceOf(0);
            await withdrawCapsuleBalance();

            // Capsule should have been emptied and then deleted, so the capsuleOwner is no longer the owner
            await expectRevert(
                withdrawCapsuleBalance(),
                "VestingVault: Caller is not capsule owner"
            );

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                vestedBalance
            );
        });

        // Passing cases
        it("should pass with no-op when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);

            // Capsule should have no vested balance
            await verifyVestedBalance(0, 0);

            // Will withdraw no tokens, but will not revert
            await withdrawCapsuleBalance();

            // Should have no token balance from wihdrawal
            await verifyTokenBalance(tokenInstance, capsuleOwner, 0);
        });
        it("should pass when none of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance = await vaultInstance.vestedBalanceOf(0);

            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                vestedBalance
            );
        });
        it("should pass when half of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                vestedBalance1
            );

            // Increase time 20% again so capsule is half of vested tokens have been claimed
            await time.increase(secondsUntil20PercVested);

            const vestedBalance2 = await vaultInstance.vestedBalanceOf(0);

            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that owner token balance = sum of the two claim amounts
            const totalClaimAmount = vestedBalance1.add(vestedBalance2);
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                totalClaimAmount
            );
        });
        it("should pass when none of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);
            const balance = await vaultInstance.vestedBalanceOf(0);
            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Schedule amount should equal vested balance
            const schedule = await vaultInstance.getSchedule(0);
            balance.should.be.bignumber.equal(schedule["amount"]);

            // Ensure withdrawn amount is equal to vested balance
            await verifyTokenBalance(tokenInstance, capsuleOwner, balance);
        });
        it("should pass when half of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 50% vested
            await time.increase(secondsUntil50PercVested);

            // Get balance of capsule before claiming
            const vestedBalance1 = await vaultInstance.vestedBalanceOf(0);
            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                vestedBalance1
            );

            // Increase time 50% again so capsule is fully vested and half claimed
            await time.increase(secondsUntil50PercVested);

            // Get balance of capsule before claiming again
            const vestedBalance2 = await vaultInstance.vestedBalanceOf(0);
            await withdrawCapsuleBalance(0);

            // Capsule should have no claimable balance
            await verifyVestedBalance(0, 0);

            // Check that owner token balance and schedule amount = sum of the two withdraw amounts
            const totalClaimAmount = vestedBalance1.add(vestedBalance2);
            const schedule = await vaultInstance.getSchedule(0);
            totalClaimAmount.should.be.bignumber.equal(schedule["amount"]);

            // Ensure withdrawn amount is equal total schedule amount
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                totalClaimAmount
            );
        });
    });

    describe("Withdrawing Leftover Token Balance", async () => {
        beforeEach(async () => {
            await createCapsule();
        });
        // Failure cases
        it("should fail when token address does not match any schedules", async () => {
            const newToken = await ERC20Mock.new({ from: deployer });
            await expectRevert(
                withdrawTokenLeftovers(newToken.address),
                "VestingVault: No leftover tokens to withdraw"
            );
        });
        it("should fail when caller has never owned/transfered a capsule", async () => {
            await expectRevert(
                withdrawTokenLeftovers(tokenInstance.address, otherAccount),
                "VestingVault: No leftover tokens to withdraw"
            );
        });
        it("should fail when caller has already withdrawn tokens", async () => {
            // Increase time to 50% vested then transfer
            await time.increase(secondsUntil50PercVested);
            await transferCapsule();

            // Withdraw tokens
            await withdrawTokenLeftovers();
            await expectRevert(
                withdrawTokenLeftovers(),
                "VestingVault: No leftover tokens to withdraw"
            );
        });

        // Passing cases
        it("should pass when caller has leftover token balance", async () => {
            // Increase time so capsule is 50% vested
            await time.increase(secondsUntil50PercVested);

            const vestedBalance = await vaultInstance.vestedBalanceOf(0);
            await transferCapsule();

            // Should have leftover balance = vested balance
            await verifyLeftoverBalance(
                capsuleOwner,
                tokenInstance.address,
                vestedBalance
            );

            // Withdraw tokens
            await withdrawTokenLeftovers();

            // Should now have leftover balance = 0
            await verifyLeftoverBalance(capsuleOwner, tokenInstance.address, 0);

            // Should now have token balance = vested balance
            await verifyTokenBalance(
                tokenInstance,
                capsuleOwner,
                vestedBalance
            );
        });
        it("should pass when capsule has been withdrawn from before", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Should be active
            await verifyCapsuleIsActive(0, true);

            // Should have 0 tokens available (beforeEach created capsule)
            await verifyAvailableReserves(0, 0);

            const vestedBalance = await vaultInstance.vestedBalanceOf(0);

            // Should withdraw ~20% of total tokens
            await withdrawCapsuleBalance(0);

            // Destroy and release remaining tokens
            await destroyCapsule();

            // Should no longer be active
            await verifyCapsuleIsActive(0, false);

            // Should have 1000 tokens available
            await verifyAvailableReserves(
                0,
                tokenUnits(1000).sub(vestedBalance)
            );
        });
    });
});

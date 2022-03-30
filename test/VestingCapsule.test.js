const VestingCapsule = artifacts.require("VestingCapsule");
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
    let capsuleInstance,
        tokenInstance,
        treasurer_role,
        beforeSnapshot,
        beforeEachSnapshot;
    const [treasurer, no_role_account, sender, recipient, account] = accounts;

    const startTimeOffset = new BN(100);

    let baseSchedule = {
        token: constants.ZERO_ADDRESS, // replace this with mock token address
        cliff: new BN(100),
        duration: new BN(1000),
        rate: new BN(1),
    };

    let baseCapsule = {
        beneficiary: sender,
        scheduleId: new BN(0),
    };

    let baseTransfer = {
        capsuleId: new BN(0),
        to: recipient,
    };

    const secondsUntil20PercVested = startTimeOffset.add(
        baseSchedule.duration.div(new BN(5))
    );

    const secondsUntil50PercVested = startTimeOffset.add(
        baseSchedule.duration.div(new BN(2))
    );

    const secondsUntilFullyVested = startTimeOffset.add(baseSchedule.duration);

    const fundContract = async (amount, from = treasurer) => {
        return await tokenInstance.transfer(
            capsuleInstance.address,
            new BN(amount),
            { from: treasurer }
        );
    };

    const createSchedule = async (scheduleDetails = null, from = treasurer) => {
        if (scheduleDetails === null) {
            scheduleDetails = baseSchedule;
        }
        return await capsuleInstance.createVestingSchedule(
            scheduleDetails.token,
            scheduleDetails.cliff,
            scheduleDetails.duration,
            scheduleDetails.rate,
            { from: from }
        );
    };

    const createCapsule = async (capsuleDetails = null, from = treasurer) => {
        if (capsuleDetails === null) {
            capsuleDetails = baseCapsule;
        }
        if (!!!capsuleDetails.startTime) {
            capsuleDetails.startTime = await time.latest();
            capsuleDetails.startTime =
                capsuleDetails.startTime.add(startTimeOffset);
        }
        return await capsuleInstance.createCapsule(
            capsuleDetails.beneficiary,
            capsuleDetails.scheduleId,
            capsuleDetails.startTime,
            { from: from }
        );
    };

    const transferCapsule = async (transferDetails = null, from = sender) => {
        if (transferDetails === null) {
            transferDetails = baseTransfer;
        }
        return await capsuleInstance.transferCapsule(
            transferDetails.capsuleId,
            transferDetails.to,
            { from: from }
        );
    };

    const claimActiveCapsule = async (capsuleId, from = sender) => {
        return await capsuleInstance.claimActiveCapsule(new BN(capsuleId), {
            from: from,
        });
    };

    const claimDormantCapsule = async (capsuleId, from = sender) => {
        return await capsuleInstance.claimDormantCapsule(new BN(capsuleId), {
            from: from,
        });
    };

    const verifyCapsuleCliffNotReached = async (
        capsuleId,
        cliff = baseSchedule.cliff
    ) => {
        const capDetails = await capsuleInstance.getCapsuleDetails(capsuleId);
        const currentTime = await time.latest();

        // Cliff seconds + start time
        const cliffTime = cliff.add(new BN(capDetails["startTime"]));
        currentTime.should.be.bignumber.lessThan(cliffTime);
    };

    const verifyCapsuleFullyVested = async (capsuleId) => {
        const capsuleDetails = await capsuleInstance.getCapsuleDetails(
            capsuleId
        );
        const currentTime = await time.latest();
        capsuleDetails["endTime"].should.be.bignumber.lessThan(currentTime);
    };

    const verifyActiveCapsuleOwner = async (capsuleId, address) => {
        const owner = await capsuleInstance.getActiveCapsuleOwner(capsuleId);
        owner.should.be.equal(address);
    };

    const verifyDormantCapsuleOwner = async (capsuleId, address) => {
        const owner = await capsuleInstance.getDormantCapsuleOwner(capsuleId);
        owner.should.be.equal(address);
    };

    const verifyTokenBalance = async (address, amount) => {
        const tokenBalance = await tokenInstance.balanceOf(address);
        tokenBalance.should.be.bignumber.equal(amount);
    };

    before(async () => {
        capsuleInstance = await VestingCapsule.new({ from: treasurer });
        tokenInstance = await ERC20Mock.new({ from: treasurer });
        baseSchedule.token = tokenInstance.address;

        // fund the treasurer account with 10,000 tokens
        await tokenInstance.mint(treasurer, 10000, { from: treasurer });

        // fund the capsule contract with 1,0000 tokens
        await fundContract(1000);

        // Create base schedule and capsule with index 0 to be use throughout tests
        await createSchedule();
        await createCapsule();

        treasurer_role = await capsuleInstance.TREASURER_ROLE();
        beforeSnapshot = await snapshot();
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Creating Vesting Schedules", async () => {
        let schedule;

        beforeEach(async () => {
            // reset the schedule
            schedule = { ...baseSchedule };
        });

        // Failure cases
        it("should fail when msg.sender = no_role_account", async () => {
            const revertReason =
                "AccessControl: account " +
                no_role_account.toLowerCase() +
                " is missing role " +
                treasurer_role +
                ".";
            await expectRevert(
                createSchedule(schedule, no_role_account),
                revertReason
            );
        });
        it("should fail when token address is 0x0 ", async () => {
            schedule.token = constants.ZERO_ADDRESS;
            await expectRevert(
                createSchedule(schedule),
                "VestingCapsule: Token address cannot be 0x0"
            );
        });
        it("should fail when durationSeconds is 0 ", async () => {
            schedule.duration = new BN(0);
            await expectRevert(
                createSchedule(schedule),
                "VestingCapsule: Duration must be greater than 0"
            );
        });
        it("should fail when tokenRatePerSecond is 0 ", async () => {
            schedule.rate = new BN(0);
            await expectRevert(
                createSchedule(schedule),
                "VestingCapsule: Token release rate must be greater than 0"
            );
        });
        it("should fail when cliffSeconds >= durationSeconds ", async () => {
            schedule.cliff = new BN(schedule.duration + 1);
            await expectRevert(
                createSchedule(schedule),
                "VestingCapsule: Cliff must be less than duration"
            );
        });

        // Passing cases
        it("should pass when msg.sender = treasurer and parmas are valid", async () => {
            await createSchedule(schedule);

            const newSchedule = await capsuleInstance.getScheduleDetails(0);

            // check that the new schedule has correct values
            newSchedule["token"].should.be.equal(schedule.token);
            newSchedule["rate"].should.be.bignumber.equal(schedule.rate);
            newSchedule["cliff"].should.be.bignumber.equal(schedule.cliff);
            newSchedule["duration"].should.be.bignumber.equal(
                schedule.duration
            );
            newSchedule["amount"].should.be.bignumber.equal(
                schedule.rate.mul(schedule.duration)
            );
        });
    });

    describe("Creating Active Capsules", async () => {
        let capsule;

        beforeEach(async () => {
            capsule = { ...baseCapsule };
        });
        // Failure cases
        it("should fail when msg.sender = no_role_account", async () => {
            const revertReason =
                "AccessControl: account " +
                no_role_account.toLowerCase() +
                " is missing role " +
                treasurer_role +
                ".";
            await expectRevert(
                createCapsule(capsule, no_role_account),
                revertReason
            );
        });
        it("should fail when beneficiary is 0x0 ", async () => {
            capsule.beneficiary = constants.ZERO_ADDRESS;
            await expectRevert(
                createCapsule(capsule),
                "VestingCapsule: Beneficiary cannot be 0x0"
            );
        });
        it("should fail when schedule ID is invalid", async () => {
            capsule.scheduleId = new BN(2);
            await expectRevert(
                createCapsule(capsule),
                "VestingCapsule: Invalid scheduleId"
            );
        });
        it("should fail when startTime < block.timestamp", async () => {
            capsule.startTime = capsule.startTime.sub(new BN(1000));
            await expectRevert(
                createCapsule(capsule),
                "VestingCapsule: Capsule startTime cannot be in the past."
            );
        });
        it("should fail when contract's token balance < schedule amount", async () => {
            // Index 1 - create a schedule that vests 2000 tokens in 1000 seconds
            const sched = {
                ...baseSchedule,
                rate: new BN(2000),
            };
            await createSchedule(sched);

            capsule.scheduleId = new BN(1);
            await expectRevert(
                createCapsule(capsule),
                "VestingCapsule: Contract does not hold enough tokens to create a new capsule."
            );
        });

        // Passing cases
        it("should pass when msg.sender = treasurer and parmas are valid", async () => {
            // fund contract again so capsule can be created
            await fundContract(1000);
            await createCapsule(capsule);

            const newCapsule = await capsuleInstance.getCapsuleDetails(
                new BN(1)
            );
            // check that the new schedule has correct values
            newCapsule["scheduleId"].should.be.bignumber.equal(
                capsule.scheduleId
            );
            newCapsule["startTime"].should.be.bignumber.equal(
                capsule.startTime
            );
            newCapsule["endTime"].should.be.bignumber.equal(
                capsule.startTime.add(baseSchedule.duration)
            );
            newCapsule["claimedAmount"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Transfering Active Capsules", async () => {
        let transfer;

        beforeEach(async () => {
            transfer = { ...baseTransfer };
        });

        // Failure cases
        it("should fail when recipient is 0x0 ", async () => {
            transfer.to = constants.ZERO_ADDRESS;
            await expectRevert(
                transferCapsule(transfer),
                "VestingCapsule: Cannot transfer capsule to 0x0."
            );
        });
        it("should fail when recipient is self", async () => {
            transfer.to = sender;
            await expectRevert(
                transferCapsule(transfer),
                "VestingCapsule: Cannot transfer capsule to self."
            );
        });
        it("should fail when capsule ID is out of bounds", async () => {
            transfer.capsuleId = new BN(1);
            await expectRevert(
                transferCapsule(transfer),
                "VestingCapsule: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                transferCapsule(transfer, account),
                "VestingCapsule: Cannot transfer capsule because msg.sender is not the owner."
            );
        });
        it("should fail when capsule is fully vested", async () => {
            // Increase time to the end of the vesting period
            await time.increase(secondsUntilFullyVested);

            // Ensure capsule is fully vested
            await verifyCapsuleFullyVested(0);

            await expectRevert(
                transferCapsule(transfer),
                "VestingCapsule: Cannot transfer capsule because it has already been fully vested."
            );
        });

        // Passing cases
        it("should pass when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);

            await transferCapsule(transfer);

            // Check that active capsule owner is now recipient
            await verifyActiveCapsuleOwner(0, transfer.to);
        });
        it("should pass when capsule has partially vested", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const aCapBalance = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );

            // Transfer capsule to recipient
            await transferCapsule(transfer);

            // Check that active capsule owner is now recipient
            await verifyActiveCapsuleOwner(0, transfer.to);

            // Check that dormant capsule owner is now sender
            await verifyDormantCapsuleOwner(0, sender);

            // Check that dormant capsule has been created with ~20% of total capsules tokens
            const dCapBalance = await capsuleInstance.dormantCapsuleBalance(
                sender,
                0
            );
            dCapBalance.should.be.bignumber.equal(aCapBalance);
        });
    });

    describe("Claiming Active Capsules", async () => {
        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                claimActiveCapsule(1),
                "VestingCapsule: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                claimActiveCapsule(0, recipient),
                "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
            );
        });
        it("should fail when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            await verifyCapsuleCliffNotReached(0);

            await expectRevert(
                claimActiveCapsule(0),
                "VestingCapsule: Capsule has no tokens to claim."
            );
        });
        it("should fail when 100% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);

            // Get balance of capsule before claiming
            const aCapBalance = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );
            await claimActiveCapsule(0);

            // Capsule should have been emptied and then deleted, so the sender is no longer the owner
            await expectRevert(
                claimActiveCapsule(0),
                "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
            );

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, aCapBalance);
        });

        // Passing cases
        it("should pass when 0% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const aCapBalance = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );

            await claimActiveCapsule(0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, aCapBalance);
        });
        it("should pass when 50% of partially vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Get balance of capsule before claiming
            const aCapBalance1 = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );
            await claimActiveCapsule(0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, aCapBalance1);

            // Increase time 20% again so capsule is half of vested tokens have been claimed
            await time.increase(secondsUntil20PercVested);

            const aCapBalance2 = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );

            await claimActiveCapsule(0);

            // Check that owner token balance = sum of the two claim amounts
            const totalClaimAmount = aCapBalance1.add(aCapBalance2);
            await verifyTokenBalance(sender, totalClaimAmount);
        });
        it("should pass when 0% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is fully vested
            await time.increase(secondsUntilFullyVested);
            const capBalance = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );
            await claimActiveCapsule(0);

            // Check that owner token balance and schedule amount = balance before claiming
            const schedule = await capsuleInstance.getScheduleDetails(0);
            capBalance.should.be.bignumber.equal(schedule["amount"]);
            await verifyTokenBalance(sender, capBalance);
        });
        it("should pass when 50% of fully vested capsule tokens have been claimed", async () => {
            // Increase time so capsule is 50% vested
            await time.increase(secondsUntil50PercVested);
            const aCapBalance1 = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );
            await claimActiveCapsule(0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, aCapBalance1);

            // Increase time 50% again so capsule is fully vested and half claimed
            await time.increase(secondsUntil50PercVested);

            const aCapBalance2 = await capsuleInstance.activeCapsuleBalance(
                sender,
                0
            );

            await claimActiveCapsule(0);

            // Check that owner token balance and schedule amount = sum of the two claim amounts
            const totalClaimAmount = aCapBalance1.add(aCapBalance2);
            const schedule = await capsuleInstance.getScheduleDetails(0);
            totalClaimAmount.should.be.bignumber.equal(schedule["amount"]);
            await verifyTokenBalance(sender, totalClaimAmount);
        });
    });

    describe("Claiming Dormant Capsules", async () => {
        beforeEach(async () => {
            // Increase time so capsule is 20% vested
            await time.increase(secondsUntil20PercVested);

            // Transfer capsule to recipient
            await transferCapsule();
        });
        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {
            await expectRevert(
                claimDormantCapsule(1),
                "VestingCapsule: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                claimDormantCapsule(0, account),
                "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
            );
        });
        it("should fail when capsule tokens have already been claimed", async () => {
            const balance = await capsuleInstance.dormantCapsuleBalance(
                sender,
                0
            );
            await claimDormantCapsule(0);

            // Capsule should have been emptied and then deleted, so the sender is no longer the owner
            await expectRevert(
                claimDormantCapsule(0),
                "VestingCapsule: Cannot claim capsule because msg.sender is not the owner."
            );
            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, balance);
        });

        // Passing cases
        it("should pass when claimable amount > 0 and tokens have not been claimed", async () => {
            const balance = await capsuleInstance.dormantCapsuleBalance(
                sender,
                0
            );
            await claimDormantCapsule(0);

            // Check that capsule owner has been credited with the correct amount of tokens
            await verifyTokenBalance(sender, balance);
        });
    });
});

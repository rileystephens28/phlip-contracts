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
    const [treasurer, no_role_account, sender, recipient, account] = accounts;

    before(async () => {
        this.capsule = await VestingCapsule.new({ from: treasurer });
        this.token = await ERC20Mock.new({ from: treasurer });

        this.baseSchedule = {
            token: this.token.address,
            cliff: new BN(100),
            duration: new BN(1000),
            rate: new BN(1),
        };

        // fund the treasurer account with some tokens
        await this.token.mint(treasurer, 10000, { from: treasurer });

        this.treasurer_role = await this.capsule.TREASURER_ROLE();
    });

    beforeEach(async () => {
        this.snapshot = await snapshot();
    });

    afterEach(async () => {
        await this.snapshot.restore();
    });

    describe("Creating Vesting Schedules", async () => {
        let schedule;

        beforeEach(async () => {
            // reset the schedule
            schedule = { ...this.baseSchedule };
        });

        // Failure cases
        it("should fail when msg.sender = no_role_account", async () => {
            const revertReason =
                "AccessControl: account " +
                no_role_account.toLowerCase() +
                " is missing role " +
                this.treasurer_role +
                ".";
            await expectRevert(
                this.capsule.createVestingSchedule(
                    schedule.token,
                    schedule.cliff,
                    schedule.duration,
                    schedule.rate,
                    { from: no_role_account }
                ),
                revertReason
            );
        });
        it("should fail when token address is 0x0 ", async () => {
            schedule.token = constants.ZERO_ADDRESS;
            await expectRevert(
                this.capsule.createVestingSchedule(
                    schedule.token,
                    schedule.cliff,
                    schedule.duration,
                    schedule.rate,
                    { from: treasurer }
                ),
                "VestingCapsule: Token address cannot be 0x0"
            );
        });
        it("should fail when durationSeconds is 0 ", async () => {
            schedule.duration = new BN(0);
            await expectRevert(
                this.capsule.createVestingSchedule(
                    schedule.token,
                    schedule.cliff,
                    schedule.duration,
                    schedule.rate,
                    { from: treasurer }
                ),
                "VestingCapsule: Duration must be greater than 0"
            );
        });
        it("should fail when tokenRatePerSecond is 0 ", async () => {
            schedule.rate = new BN(0);
            await expectRevert(
                this.capsule.createVestingSchedule(
                    schedule.token,
                    schedule.cliff,
                    schedule.duration,
                    schedule.rate,
                    { from: treasurer }
                ),
                "VestingCapsule: Token release rate must be greater than 0"
            );
        });
        it("should fail when cliffSeconds >= durationSeconds ", async () => {
            schedule.cliff = new BN(schedule.duration + 1);
            await expectRevert(
                this.capsule.createVestingSchedule(
                    schedule.token,
                    schedule.cliff,
                    schedule.duration,
                    schedule.rate,
                    { from: treasurer }
                ),
                "VestingCapsule: Cliff must be less than duration"
            );
        });

        // Passing cases
        it("should pass when msg.sender = treasurer and parmas are valid", async () => {
            await this.capsule.createVestingSchedule(
                schedule.token,
                schedule.cliff,
                schedule.duration,
                schedule.rate,
                { from: treasurer }
            );

            const newSchedule = await this.capsule.getScheduleDetails(0);

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
            // Index 0 - create a schedule that vests 1000 tokens in 1000 seconds
            await this.capsule.createVestingSchedule(
                this.baseSchedule.token,
                this.baseSchedule.cliff,
                this.baseSchedule.duration,
                this.baseSchedule.rate,
                { from: treasurer }
            );

            // tranfer 1000 tokens to capsule contract
            await this.token.transfer(this.capsule.address, 1000, {
                from: treasurer,
            });

            const currentTime = await time.latest();

            capsule = {
                beneficiary: account,
                scheduleId: new BN(0),
                startTime: currentTime.add(new BN(100)),
            };
        });
        // Failure cases
        it("should fail when msg.sender = no_role_account", async () => {
            const revertReason =
                "AccessControl: account " +
                no_role_account.toLowerCase() +
                " is missing role " +
                this.treasurer_role +
                ".";
            await expectRevert(
                this.capsule.createCapsule(
                    capsule.beneficiary,
                    capsule.scheduleId,
                    capsule.startTime,
                    { from: no_role_account }
                ),
                revertReason
            );
        });
        it("should fail when beneficiary is 0x0 ", async () => {
            capsule.beneficiary = constants.ZERO_ADDRESS;
            await expectRevert(
                this.capsule.createCapsule(
                    capsule.beneficiary,
                    capsule.scheduleId,
                    capsule.startTime,
                    { from: treasurer }
                ),
                "VestingCapsule: Beneficiary cannot be 0x0"
            );
        });
        it("should fail when schedule ID is invalid", async () => {
            capsule.scheduleId = new BN(2);
            await expectRevert(
                this.capsule.createCapsule(
                    capsule.beneficiary,
                    capsule.scheduleId,
                    capsule.startTime,
                    { from: treasurer }
                ),
                "VestingCapsule: Invalid scheduleId"
            );
        });
        it("should fail when startTime < block.timestamp", async () => {
            capsule.startTime = capsule.startTime.sub(new BN(1000));
            await expectRevert(
                this.capsule.createCapsule(
                    capsule.beneficiary,
                    capsule.scheduleId,
                    capsule.startTime,
                    { from: treasurer }
                ),
                "VestingCapsule: Capsule startTime cannot be in the past."
            );
        });
        it("should fail when contract's token balance < schedule amount", async () => {
            // Index 1 - create a schedule that vests 2000 tokens in 1000 seconds
            await this.capsule.createVestingSchedule(
                this.baseSchedule.token,
                this.baseSchedule.cliff,
                this.baseSchedule.duration,
                this.baseSchedule.rate.mul(new BN(2)),
                { from: treasurer }
            );

            capsule.scheduleId = new BN(1);
            await expectRevert(
                this.capsule.createCapsule(
                    capsule.beneficiary,
                    capsule.scheduleId,
                    capsule.startTime,
                    { from: treasurer }
                ),
                "VestingCapsule: Contract does not hold enough tokens to create a new capsule."
            );
        });

        // Passing cases
        it("should pass when msg.sender = treasurer and parmas are valid", async () => {
            await this.capsule.createCapsule(
                capsule.beneficiary,
                capsule.scheduleId,
                capsule.startTime,
                { from: treasurer }
            );

            const newCapsule = await this.capsule.getCapsuleDetails(new BN(0), {
                from: treasurer,
            });
            // check that the new schedule has correct values
            newCapsule["scheduleId"].should.be.bignumber.equal(
                capsule.scheduleId
            );
            newCapsule["startTime"].should.be.bignumber.equal(
                capsule.startTime
            );
            newCapsule["endTime"].should.be.bignumber.equal(
                capsule.startTime.add(this.baseSchedule.duration)
            );
            newCapsule["claimedAmount"].should.be.bignumber.equal(new BN(0));
        });
    });

    describe("Transfering Active Capsules", async () => {
        let transfer;
        const startTimeOffset = new BN(100);
        before(async () => {
            // Index 0 - create a schedule that vests 1000 tokens in 1000 seconds
            await this.capsule.createVestingSchedule(
                this.baseSchedule.token,
                this.baseSchedule.cliff,
                this.baseSchedule.duration,
                this.baseSchedule.rate,
                { from: treasurer }
            );

            // tranfer 1000 tokens to capsule contract
            await this.token.transfer(this.capsule.address, 1000, {
                from: treasurer,
            });
        });

        beforeEach(async () => {
            // Index 0 - create a capsule that vests 1000 tokens in 1000 seconds starting in 100 seconds
            const currentTime = await time.latest();
            await this.capsule.createCapsule(
                sender,
                new BN(0),
                currentTime.add(startTimeOffset),
                { from: treasurer }
            );

            transfer = {
                capsuleId: new BN(0),
                to: recipient,
            };
        });

        // Failure cases
        it("should fail when recipient is 0x0 ", async () => {
            transfer.to = constants.ZERO_ADDRESS;
            await expectRevert(
                this.capsule.transferCapsule(transfer.capsuleId, transfer.to, {
                    from: sender,
                }),
                "VestingCapsule: Cannot transfer capsule to 0x0."
            );
        });
        it("should fail when recipient is self", async () => {
            transfer.to = sender;
            await expectRevert(
                this.capsule.transferCapsule(transfer.capsuleId, transfer.to, {
                    from: sender,
                }),
                "VestingCapsule: Cannot transfer capsule to self."
            );
        });
        it("should fail when capsule ID is out of bounds", async () => {
            transfer.capsuleId = new BN(1);
            await expectRevert(
                this.capsule.transferCapsule(transfer.capsuleId, transfer.to, {
                    from: sender,
                }),
                "VestingCapsule: Invalid capsule ID"
            );
        });
        it("should fail when msg.sender is not capsule owner", async () => {
            await expectRevert(
                this.capsule.transferCapsule(transfer.capsuleId, transfer.to, {
                    from: account,
                }),
                "VestingCapsule: Cannot transfer capsule because msg.sender is not the owner."
            );
        });
        it("should fail when capsule is fully vested", async () => {
            // Increase time to the end of the vesting period
            const secondsUntilFullyVested = startTimeOffset.add(
                this.baseSchedule.duration
            );
            await time.increase(secondsUntilFullyVested);

            // Ensure capsule is fully vested
            const capsuleDetails = await this.capsule.getCapsuleDetails(0);
            const futureTime = await time.latest();
            capsuleDetails["endTime"].should.be.bignumber.lessThan(futureTime);

            await expectRevert(
                this.capsule.transferCapsule(transfer.capsuleId, transfer.to, {
                    from: sender,
                }),
                "VestingCapsule: Cannot transfer capsule because it has already been fully vested."
            );
        });

        // Passing cases
        it("should pass when cliff has not been reached", async () => {
            // Ensure capsule cliff has not been reached
            const capsuleDetails = await this.capsule.getCapsuleDetails(0);
            const currentTime = await time.latest();

            // Cliff seconds + start time
            const cliffTime = this.baseSchedule.cliff.add(
                new BN(capsuleDetails["startTime"])
            );
            currentTime.should.be.bignumber.lessThan(cliffTime);

            await this.capsule.transferCapsule(
                transfer.capsuleId,
                transfer.to,
                { from: sender }
            );
            const newOwnerAddress = await this.capsule.getActiveCapsuleOwner(0);
            newOwnerAddress.should.be.equal(transfer.to);
        });
        it("should pass when capsule has partially vested", async () => {
            // Increase time so capsule is 20% vested
            const secondsUntil20PercVested = startTimeOffset.add(
                this.baseSchedule.duration.div(new BN(5))
            );
            await time.increase(secondsUntil20PercVested);

            const activeCapsuleBalance =
                await this.capsule.activeCapsuleBalance(sender, 0);

            // Transfer capsule to recipient
            await this.capsule.transferCapsule(
                transfer.capsuleId,
                transfer.to,
                { from: sender }
            );

            // Check that active capsule owner is now recipient
            const activeCapOwner = await this.capsule.getActiveCapsuleOwner(0);
            activeCapOwner.should.be.equal(transfer.to);

            // Check that dormant capsule owner is now sender
            const dormantCapOwner = await this.capsule.getDormantCapsuleOwner(
                0
            );
            dormantCapOwner.should.be.equal(sender);

            // Check that dormant capsule has been created with ~20% of total capsules tokens
            const dormantCapsuleBalance =
                await this.capsule.dormantCapsuleBalance(dormantCapOwner, 0);
            dormantCapsuleBalance.should.be.bignumber.equal(
                activeCapsuleBalance
            );
        });
    });

    describe.skip("Claiming Active Capsules", async () => {
        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {});
        it("should fail when msg.sender is not capsule owner", async () => {});
        it("should fail when cliff has not been reached", async () => {});
        it("should fail when 100% of partially vested capsule tokens have been claimed", async () => {});
        it("should fail when 100% of fully vested capsule tokens have been claimed", async () => {});

        // Passing cases
        it("should pass when 0% of partially vested capsule tokens have been claimed", async () => {});
        it("should pass when 50% of partially vested capsule tokens have been claimed", async () => {});
        it("should pass when 0% of fully vested capsule tokens have been claimed", async () => {});
        it("should pass when 50% of fully vested capsule tokens have been claimed", async () => {});
    });

    describe.skip("Claiming Dormant Capsules", async () => {
        // Failure cases
        it("should fail when capsule ID is out of bounds", async () => {});
        it("should fail when msg.sender is not capsule owner", async () => {});
        it("should fail when capsule tokens have already been claimed", async () => {});

        // Passing cases
        it("should pass when claimable amount > 0 and tokens have not been claimed", async () => {});
    });
});

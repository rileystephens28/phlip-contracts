const VestingCapsule = artifacts.require("VestingCapsule");
const ERC20Mock = artifacts.require("ERC20Mock");
const {
    BN, // Big Number support
    constants, // Common constants, like the zero address and largest integers
    expectEvent, // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
    snapshot,
} = require("@openzeppelin/test-helpers");
require("chai").should();

contract("VestingCapsule", (accounts) => {
    const [treasurer, no_role_account, account] = accounts;

    before(async () => {
        this.capsule = await VestingCapsule.new({ from: treasurer });
        this.token = await ERC20Mock.new({ from: treasurer });

        // fund the treasurer account with some tokens
        await this.token.mint(treasurer, 1000, { from: treasurer });

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
            // 1000 tokens vested in 1000 seconds
            schedule = {
                token: this.token.address,
                cliff: new BN(100),
                duration: new BN(1000),
                rate: new BN(1),
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
            // create schedule
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

    describe.skip("Creating Active Capsules", async () => {
        // Failure cases
        it("should fail when msg.sender = no_role_account", async () => {});
        it("should fail when beneficiary is 0x0 ", async () => {});
        it("should fail when schedule ID is invalid", async () => {});
        it("should fail when startTime < block.timestamp", async () => {});
        it("should fail when contract's token balance < schedule amount", async () => {});

        // Passing cases
        it("should pass when msg.sender = treasurer and parmas are valid", async () => {});
    });

    describe.skip("Transfering Active Capsules", async () => {
        // Failure cases
        it("should fail when recipient is 0x0 ", async () => {});
        it("should fail when recipient is self", async () => {});
        it("should fail when capsule ID is out of bounds", async () => {});
        it("should fail when msg.sender is not capsule owner", async () => {});
        it("should fail when capsule is fully vested", async () => {});

        // Passing cases
        it("should pass when cliff has not been reached", async () => {});
        it("should pass when 0% of partially vested capsule tokens have been claimed", async () => {});
        it("should pass when 50% of partially vested capsule tokens have been claimed", async () => {});
        it("should pass when 100% of partially vested capsule tokens have been claimed", async () => {});
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

const VestingCapsule = artifacts.require("VestingVaultMock");
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
        capsuleId = 0,
        caller = capsuleOwner
    ) => {
        return await capsuleInstance.transferFrom(capsuleId, to, {
            from: from,
        });
    };

    const mint = async (to = capsuleOwner, from = deployer) => {
        return await capsuleInstance.mint(to, {
            from: from,
        });
    };

    const burn = async (capsuleId = 0, from = capsuleOwner) => {
        return await capsuleInstance.burn(to, {
            from: from,
        });
    };

    const setVestingScheme = async (scheduleIds = [0, 1], from = deployer) => {
        return await capsuleInstance.setVestingScheme(scheduleIds, {
            from: from,
        });
    };

    const verifyScheduleExists = async (capsuleId, bool) => {
        const exists = await capsuleInstance.scheduleExists(capsuleId);
        exists.should.be.equal(bool);
    };

    const verifyTotalReserves = async (scheduleId, val) => {
        const reserves = await capsuleInstance.totalReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyAvailableReserves = async (scheduleId, val) => {
        const reserves = await capsuleInstance.availableReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyLockedReserves = async (scheduleId, val) => {
        const reserves = await capsuleInstance.lockedReservesOf(scheduleId);
        reserves.should.be.bignumber.equal(new BN(val));
    };

    const verifyCapsuleIsActive = async (capsuleId, bool) => {
        const isActive = await capsuleInstance.isCapsuleActive(capsuleId);
        isActive.should.be.equal(bool);
    };

    const verifyCapsuleOwner = async (capsuleId, address) => {
        const owner = await capsuleInstance.capsuleOwnerOf(capsuleId);
        owner.should.be.equal(address);
    };

    const verifyVestedBalance = async (capsuleId, val) => {
        const vestedBalance = await capsuleInstance.vestedBalanceOf(capsuleId);
        vestedBalance.should.be.bignumber.equal(new BN(val));
    };

    const verifyLeftoverBalance = async (account, token, val) => {
        const leftoverBalance = await capsuleInstance.leftoverBalanceOf(
            account,
            token
        );
        leftoverBalance.should.be.bignumber.equal(new BN(val));
    };

    const verifyCapsuleCliffNotReached = async (
        capsuleId,
        cliff = baseCliff
    ) => {
        const capDetails = await capsuleInstance.getCapsule(capsuleId);
        const currentTime = await time.latest();

        // Cliff seconds + start time
        const cliffTime = cliff.add(new BN(capDetails["startTime"]));
        currentTime.should.be.bignumber.lessThan(cliffTime);
    };

    const verifyCapsuleFullyVested = async (capsuleId) => {
        const capsuleDetails = await capsuleInstance.getCapsule(capsuleId);
        const currentTime = await time.latest();
        capsuleDetails["endTime"].should.be.bignumber.lessThan(currentTime);
    };

    const verifyTokenBalance = async (token, address, amount) => {
        const tokenBalance = await token.balanceOf(address);
        tokenBalance.should.be.bignumber.equal(amount);
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

        await setVestingScheme([
            tokenInstance1.address,
            tokenInstance2.address,
        ]);
    });

    beforeEach(async () => {
        beforeEachSnapshot = await snapshot();
    });

    afterEach(async () => {
        await beforeEachSnapshot.restore();
    });

    describe("Setting Vesting Scheme", async () => {
        // Failure cases
        it("should fail when invalid schedule ID is included in scheme", async () => {
            const newToken = await ERC20Mock.new({ from: deployer });
            await expectRevert(
                setVestingScheme([tokenInstance1.address, newToken.address]),
                "VestingCapsule: Invalid schedule ID"
            );
        });

        // Passing cases
        it("should pass when schedule IDs are valid", async () => {
            await setVestingScheme([
                tokenInstance1.address,
                tokenInstance2.address,
            ]);
        });
    });

    describe.skip("Minting Capsules", async () => {
        // Failure cases
        it("should fail when vesting scheme is not set", async () => {});

        // Passing cases
        it("should pass when vesting scheme is set", async () => {});
    });

    describe.skip("Burning Capsules", async () => {
        // Failure cases
        it("should fail when vesting scheme is not set", async () => {});

        // Passing cases
        it("should pass when vesting scheme is set", async () => {});
    });

    describe.skip("Transfering Capsules", async () => {
        // Failure cases
        it("should fail when vesting scheme is not set", async () => {});

        // Passing cases
        it("should pass when vesting scheme is set", async () => {});
    });
});

const VestingCapsule = artifacts.require("VestingCapsule");
const timeMachine = require("ganache-time-traveler");
require("chai").should();

contract("VestingCapsule", (accounts) => {
    const TREASURER_ACCOUNT = accounts[0];
    const NO_ROLL_ACCOUNT = accounts[1];
    const account = accounts[2];

    beforeEach(async () => {
        this.capsule = await VestingCapsule.new({ from: TREASURER_ACCOUNT });
    });

    describe("Access-Control", async () => {
        it("should allow TREASURER to create a schedule", async () => {});
        it("should allow TREASURER to create a capsule", async () => {});
        it("should prevent NO_ROLE_ACCOUNT from creating a schedule", async () => {});
        it("should prevent NO_ROLE_ACCOUNT from creating a capsule", async () => {});
    });

    describe("Using Invalid Params", async () => {
        describe("When Creating Schedules", async () => {
            it("should fail when token address is 0x0 ", async () => {});
            it("should fail when durationSeconds is 0 ", async () => {});
            it("should fail when tokenRatePerSecond is 0 ", async () => {});
            it("should fail when cliffSeconds >= durationSeconds ", async () => {});
        });
        describe("When Creating Capsules", async () => {
            it("should fail when beneficiary is 0x0 ", async () => {});
            it("should fail when schedule ID is invalid", async () => {});
            it("should fail when startTime < block.timestamp", async () => {});
            it("should fail when contract's token balance < schedule amount", async () => {});
        });
        describe("When Transfering Capsules", async () => {
            it("should fail when recipient is 0x0 ", async () => {});
            it("should fail when recipient is self", async () => {});
            it("should fail when capsule ID is out of bounds", async () => {});
            it("should fail when capsule ID is owned by another address", async () => {});
        });
    });

    describe("Capsule Life Cycle", () => {
        // Balance checks are done throughout the life cycle
        let snapshotId;
        beforeEach(async () => {
            let snapshot = await timeMachine.takeSnapshot();
            snapshotId = snapshot["result"];
        });

        afterEach(async () => {
            await timeMachine.revertToSnapshot(snapshotId);
        });

        describe("Has Not Reached Cliff", async () => {
            // Balance Check
            it("should have 0 claimable balance", async () => {});

            // Transfering
            it("should allow CAPSULE_OWNER to transfer", async () => {});

            // Claiming
            it("should prevent CAPSULE_OWNER from claiming", async () => {});
        });

        describe("Has Partially Vested", async () => {
            // Transfering
            it("should allow CAPSULE_OWNER to transfer capsule that is 0% claimed", async () => {});
            it("should allow CAPSULE_OWNER to transfer capsule that is 50% claimed", async () => {});
            it("should allow CAPSULE_OWNER to transfer capsule that is 100% claimed", async () => {});

            // Claiming Active Capsules
            it("should allow CAPSULE_OWNER to claim capsule that is 0% claimed", async () => {});
            it("should allow CAPSULE_OWNER to claim capsule that is 50% claimed", async () => {});
            it("should prevent CAPSULE_OWNER to claim capsule that is 100% claimed", async () => {});

            // Claiming Dormant Capsules
            it("should allow previous CAPSULE_OWNER to claim DormantCapsule when amount > 0", async () => {});
            it("should prevent previous CAPSULE_OWNER from claiming DormantCapsule when amount = 0", async () => {});
            it("should prevent previous CAPSULE_OWNER from claiming DormantCapsule when it has already been claimed", async () => {});
        });

        describe("Has Fully Vested", async () => {
            // Transfering
            it("should prevent CAPSULE_OWNER from transfering capsule", async () => {});

            // Claiming
            it("should allow CAPSULE_OWNER to claim capsule that is 0% claimed", async () => {});
            it("should allow CAPSULE_OWNER to claim capsule that is 50% claimed", async () => {});
            it("should prevent CAPSULE_OWNER to claim capsule that is 100% claimed", async () => {});
        });
    });
});

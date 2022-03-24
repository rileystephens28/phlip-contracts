const VestingCapsule = artifacts.require("VestingCapsule");

require("chai").should();
const utils = require("./utils.js");

contract("VestingCapsule", (accounts) => {
    const TREASURER_ACCOUNT = accounts[0];
    const NO_ROLL_ACCOUNT = accounts[1];
    const account = accounts[2];

    beforeEach(async () => {
        this.token = await VestingCapsule.new({ from: TREASURER_ACCOUNT });
    });

    describe("Creating Vesting Schedules", () => {
        it("should allow TREASURER to create a schedule", async () => {});
        it("should prevent TREASURER from creating a schedule when token address is 0x0 ", async () => {});
        it("should prevent TREASURER from creating a schedule when durationSeconds is 0 ", async () => {});
        it("should prevent TREASURER from creating a schedule when tokenRatePerSecond is 0 ", async () => {});
        it("should prevent TREASURER from creating a schedule when cliffSeconds >= durationSeconds ", async () => {});
        it("should prevent NO_ROLE_ACCOUNT from creating a schedule", async () => {});
    });
    describe("Creating Capsules", () => {
        it("should allow TREASURER to create a capsule", async () => {});
        it("should prevent TREASURER from creating a capsule when beneficiary is 0x0 ", async () => {});
        it("should prevent TREASURER from creating a capsule when schedule ID is invalid", async () => {});
        it("should prevent TREASURER from creating a capsule when startTime < block.timestamp", async () => {});
        it("should prevent TREASURER from creating a capsule when contract's token balance < schedule amount", async () => {});
        it("should prevent NO_ROLE_ACCOUNT from creating a capsule", async () => {});
    });

    describe("Transfering Capsules", () => {
        it("should allow CAPSULE_OWNER to transfer capsule that has not reached its cliff", async () => {});
        it("should allow CAPSULE_OWNER to transfer partially vested capsule that has never been claimed", async () => {});
        it("should allow CAPSULE_OWNER to transfer partially vested capsule that has been fully claimed", async () => {});
        it("should prevent CAPSULE_OWNER from tranfering when recipient is CAPSULE_OWNER", async () => {});
        it("should prevent CAPSULE_OWNER from tranfering when recipient is 0x0", async () => {});
        it("should prevent CAPSULE_OWNER from tranfering when capsule is fully vested", async () => {});
        it("should prevent non_CAPSULE_OWNER from tranfering a capsule they do not own", async () => {});
    });

    describe("Claiming Capsules", () => {
        it("should allow CAPSULE_OWNER to claim partially vested ActiveCapsule", async () => {});
        it("should allow CAPSULE_OWNER to claim fully vested ActiveCapsule", async () => {});
        it("should allow CAPSULE_OWNER to claim DormantCapsule", async () => {});
        it("should prevent CAPSULE_OWNER from claiming ActiveCapsule when vested amount has already been fully claimed", async () => {});
        it("should prevent CAPSULE_OWNER from claiming DormantCapsule when capsule has already been fuuly claimed", async () => {});
        it("should prevent non_CAPSULE_OWNER from claiming ActiveCapsule", async () => {});
        it("should prevent non_CAPSULE_OWNER from claiming DormantCapsule", async () => {});
    });
});

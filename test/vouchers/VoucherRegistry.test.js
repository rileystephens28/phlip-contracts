const VoucherRegistryMock = artifacts.require("VoucherRegistryMock");
const { expectRevert, constants, BN } = require("@openzeppelin/test-helpers");
require("chai").should();

contract("VoucherRegistry", (accounts) => {
    let registryInstance;
    const [issuer, receiver, otherAccount] = accounts;

    const issueVoucher = async (to = receiver, id = 0, from = issuer) => {
        return await registryInstance.issueVoucher(to, id, {
            from: from,
        });
    };

    const redeemVoucher = async (id = 0, from = receiver) => {
        return await registryInstance.redeemVoucher(id, {
            from: from,
        });
    };

    const _shouldHaveVoucher = async (address, bool) => {
        const hasVoucher = await registryInstance.hasVoucher(address);
        hasVoucher.should.be.equal(bool);
    };

    const verifyDoesHaveVoucher = async (address) => {
        await _shouldHaveVoucher(address, true);
    };

    const verifyDoesNotHaveVoucher = async (address) => {
        await _shouldHaveVoucher(address, false);
    };

    const verifyVoucherHolder = async (id, address) => {
        const holder = await registryInstance.voucherHolderOf(id);
        holder.should.be.equal(address);
    };

    const verifyRemainingVouchers = async (address, amount) => {
        const remaining = await registryInstance.remainingVouchers(address);
        remaining.should.be.bignumber.equal(new BN(amount));
    };

    beforeEach(async () => {
        registryInstance = await VoucherRegistryMock.new({
            from: issuer,
        });
    });

    describe("Issuing Vouchers", async () => {
        // Failure case
        it("should fail when recipient address is 0x0", async () => {
            await expectRevert(
                issueVoucher(constants.ZERO_ADDRESS),
                "VoucherRegistry: Cannot issue voucher to 0x0"
            );

            // Zero address should not have a voucher
            await verifyDoesNotHaveVoucher(constants.ZERO_ADDRESS);
        });
        it("should fail when voucher has already been created with ID", async () => {
            // Issue voucher with ID 0
            await issueVoucher(receiver, 0);

            // Should have a voucher was correctly issued
            await verifyDoesHaveVoucher(receiver);
            await verifyVoucherHolder(0, receiver);
            await verifyRemainingVouchers(receiver, 1);

            // Attempt to issue a voucher with ID 0 again
            await expectRevert(
                issueVoucher(receiver, 0),
                "VoucherRegistry: Voucher already exists"
            );

            // Should still have 1 voucher
            await verifyRemainingVouchers(receiver, 1);
        });

        // Passing case
        it("should pass when params are valid", async () => {
            await issueVoucher();

            // Should have a voucher was correctly issued
            await verifyDoesHaveVoucher(receiver);
            await verifyVoucherHolder(0, receiver);
            await verifyRemainingVouchers(receiver, 1);
        });
    });

    describe("Redeeming Vouchers", async () => {
        // Failure case
        it("should fail when caller is not voucher holder", async () => {
            // Issue voucher with ID 0
            await issueVoucher();

            // Should have a voucher was correctly issued
            await verifyRemainingVouchers(receiver, 1);

            // Attempt to redeem voucher for other account
            await expectRevert(
                redeemVoucher(0, otherAccount),
                "VoucherRegistry: Not voucher holder"
            );

            // Should still have 1 voucher
            await verifyRemainingVouchers(receiver, 1);
        });

        // Passing case
        it("should pass when caller is voucher holder", async () => {
            await issueVoucher();

            // Should have a voucher was correctly issued
            await verifyDoesHaveVoucher(receiver);
            await verifyVoucherHolder(0, receiver);
            await verifyRemainingVouchers(receiver, 1);

            await redeemVoucher();

            // Should no longer have a voucher
            await verifyDoesNotHaveVoucher(receiver);
            await verifyRemainingVouchers(receiver, 0);
        });
    });

    describe("Modifier Protected Functions", async () => {
        // Failure case
        it("should fail when caller has no vouchers", async () => {
            await expectRevert(
                registryInstance.protectedAction({ from: otherAccount }),
                "VoucherRegistry: No vouchers"
            );
            const didAction = await registryInstance.didProtectedAction();
            didAction.should.be.equal(false);
        });

        // Passing case
        it("should pass when caller has >= 1 vouchers", async () => {
            await issueVoucher();

            // Should have a voucher was correctly issued
            await verifyDoesHaveVoucher(receiver);
            await verifyVoucherHolder(0, receiver);
            await verifyRemainingVouchers(receiver, 1);

            // Do protected action
            await registryInstance.protectedAction({ from: receiver });

            // Should have performed protected action
            const didAction = await registryInstance.didProtectedAction();
            didAction.should.be.equal(true);
        });
    });
});

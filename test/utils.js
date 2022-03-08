require("chai").should();

exports.tokenBalanceCheck = async (token, account, expectedVal) => {
    accountBalance = await token.balanceOf(account);
    accountBalance.toString().should.equal(expectedVal.toString());
};

exports.tokenPausedCheck = async (token, expectedVal) => {
    let isPaused = await token.paused();
    isPaused.should.equal(expectedVal);
};

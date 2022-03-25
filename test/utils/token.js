require("chai").should();

exports.tokenPausedCheck = async (token, expectedVal) => {
    let isPaused = await token.paused();
    isPaused.should.equal(expectedVal);
};

exports.tokenVarEqualCheck = async (token, varName, expectedVal) => {
    const bool = await token[varName].call();
    bool.should.equal(expectedVal);
};

exports.tokenNumEqualCheck = async (token, varName, expectedVal) => {
    const num = await token[varName].call();
    num.toString().should.equal(expectedVal.toString());
};

exports.tokenFnEqualCheck = async (token, fnName, expectedVal) => {
    const val = await token[fnName]();
    val.should.equal(expectedVal);
};

exports.tokenNumFnCheck = async (token, fnName, expectedVal) => {
    const num = await token[fnName]();
    num.toString().should.equal(expectedVal.toString());
};

exports.tokenBalanceCheck = async (token, account, expectedVal) => {
    accountBalance = await token.balanceOf(account);
    accountBalance.toString().should.equal(expectedVal.toString());
};

exports.tokenHasClaimCheck = async (token, account, expectedVal) => {
    let hasClaim = await token.hasClaim(account);
    hasClaim.should.equal(expectedVal);
};

exports.tokenRemainingClaimCheck = async (token, account, expectedVal) => {
    remainingClaims = await token.remainingClaims(account);
    remainingClaims.toString().should.equal(expectedVal.toString());
};

const { BN } = require("@openzeppelin/test-helpers");

const tokenDecimals = new BN(18);

const tokenbits = new BN(10).pow(tokenDecimals);

const tokenUnits = (val) => {
    return new BN(val).mul(tokenbits);
};

module.exports = {
    tokenUnits,
};

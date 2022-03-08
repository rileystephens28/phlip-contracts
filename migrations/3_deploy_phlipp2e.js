const PhlipP2E = artifacts.require("PhlipP2E.sol");

module.exports = function (deployer) {
    const _name = "PhlipP2E Token";
    const _symbol = "PGEN";
    deployer.deploy(PhlipP2E, _name, _symbol);
};

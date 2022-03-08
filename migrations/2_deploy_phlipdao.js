const PhlipDAO = artifacts.require("PhlipDAO.sol");

module.exports = function (deployer) {
    const _name = "PhlipDAO Token";
    const _symbol = "PHLIP";
    deployer.deploy(PhlipDAO, _name, _symbol);
};

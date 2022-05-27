const PhlipDAO = artifacts.require("PhlipDAO.sol");
const PhlipP2E = artifacts.require("PhlipP2E.sol");

require("dotenv").config();

const daoTokenInfo = {
    name: "PhlipDAO Token",
    symbol: "PHLIP",
};

const p2eTokenInfo = {
    name: "PhlipP2E",
    symbol: "PGEN",
};

module.exports = async function (deployer) {
    await deployer.deploy(PhlipDAO, daoTokenInfo.name, daoTokenInfo.symbol);
    await deployer.deploy(PhlipP2E, p2eTokenInfo.name, p2eTokenInfo.symbol);
};

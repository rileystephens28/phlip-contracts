const FxSaleChildTunnel = artifacts.require("FxSaleChildTunnel.sol");
const PhlipDAO = artifacts.require("PhlipDAO.sol");
const PhlipP2E = artifacts.require("PhlipP2E.sol");
const PinkCard = artifacts.require("PinkCard.sol");
const WhiteCard = artifacts.require("WhiteCard.sol");

const { constants } = require("@openzeppelin/test-helpers");

require("dotenv").config();

const stateSynce = {
    mumbai: {
        fxChild: "0xCf73231F28B7331BBe3124B907840A94851f9f11",
    },
    mainnet: {
        fxChild: "0x8397259c983751DAf40400790063935a11afa28a",
    },
};

const vestingCliff = 2628000; // 1 month
const vestingDuration = 2628000000; // 1 year

module.exports = async function (deployer, network, accounts) {
    let fxChild;

    if (network === "polygon_mumbai") {
        fxChild = stateSynce.mumbai.fxChild;
    } else if (network === "polygon_mainnet") {
        fxChild = stateSynce.mainnet.fxChild;
    } else if (network === "ganache") {
        fxChild = constants.ZERO_ADDRESS;
    } else {
        throw new Error("Unknown network");
    }

    const daoToken = await PhlipDAO.deployed();
    const p2eToken = await PhlipP2E.deployed();
    const pinkCard = await PinkCard.deployed();
    const whiteCard = await WhiteCard.deployed();

    // This assumes accounts[0] is the deployer of DAO and P2E
    await deployer.deploy(
        FxSaleChildTunnel,
        pinkCard.address,
        whiteCard.address,
        daoToken.address,
        p2eToken.address,
        accounts[0],
        accounts[0],
        vestingCliff,
        vestingDuration,
        fxChild
    );
};

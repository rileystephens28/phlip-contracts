const FxSaleRootTunnel = artifacts.require("FxSaleRootTunnel.sol");
const FxRoot = artifacts.require("FxRootMock");
const { constants } = require("@openzeppelin/test-helpers");

require("dotenv").config();

const stateSynce = {
    goerli: {
        checkpointManager: "0x2890bA17EfE978480615e330ecB65333b880928e",
        fxRoot: "0x3d1d3E34f7fB6D26245E6640E1c50710eFFf15bA",
    },
    mainnet: {
        checkpointManager: "0x86e4dc95c7fbdbf52e33d563bbdb00823894c287",
        fxRoot: "0xfe5e5D361b2ad62c541bAb87C45a0B9B018389a2",
    },
};

module.exports = async function (deployer, network) {
    let checkpointManager;
    let fxRoot;

    if (network === "goerli" || network === "goerli-fork") {
        checkpointManager = stateSynce.goerli.checkpointManager;
        fxRoot = stateSynce.goerli.fxRoot;
    } else if (network === "mainnet" || network === "mainnet-fork") {
        checkpointManager = stateSynce.mainnet.checkpointManager;
        fxRoot = stateSynce.mainnet.fxRoot;
    } else if (network === "ganache" || network === "development") {
        // If we're on ganache, we must deploy the FxRootMock contract
        // or else sending messages to child will revert.
        checkpointManager = constants.ZERO_ADDRESS;
        await deployer.deploy(FxRoot);
        fxRoot = FxRoot.address;
    } else {
        throw new Error("Unknown network");
    }
    await deployer.deploy(
        FxSaleRootTunnel,
        checkpointManager,
        fxRoot,
        process.env.TEAM_WALLET
    );
};

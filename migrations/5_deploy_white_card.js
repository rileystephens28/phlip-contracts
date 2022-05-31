const WhiteCard = artifacts.require("WhiteCard.sol");
require("dotenv").config();

const whiteCardInfo = {
    baseUri: "https.ipfs.moralis.io/ipfs/",
    devWallet: process.env.TEAM_WALLET,
    freeUriChanges: 4,
};

module.exports = async function (deployer) {
    await deployer.deploy(
        WhiteCard,
        whiteCardInfo.baseUri,
        whiteCardInfo.devWallet,
        whiteCardInfo.freeUriChanges
    );
};

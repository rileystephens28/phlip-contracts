const PinkCard = artifacts.require("PinkCard.sol");
require("dotenv").config();

const pinkCardInfo = {
    baseUri: "https.ipfs.moralis.io/ipfs/",
    devWallet: process.env.TEAM_WALLET,
    freeUriChanges: 4,
};

module.exports = async function (deployer) {
    await deployer.deploy(
        PinkCard,
        pinkCardInfo.baseUri,
        pinkCardInfo.devWallet,
        pinkCardInfo.freeUriChanges
    );
};

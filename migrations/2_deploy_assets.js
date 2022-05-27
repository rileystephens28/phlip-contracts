const PhlipDAO = artifacts.require("PhlipDAO.sol");
const PhlipP2E = artifacts.require("PhlipP2E.sol");
const SocialProfile = artifacts.require("SocialProfile.sol");
const PinkCard = artifacts.require("PinkCard.sol");
const WhiteCard = artifacts.require("WhiteCard.sol");

require("dotenv").config();

const daoTokenInfo = {
    name: "PhlipDAO Token",
    symbol: "PHLIP",
};

const p2eTokenInfo = {
    name: "PhlipP2E",
    symbol: "PGEN",
};

const socialProfileInfo = {
    name: "Phlip Social Profile",
    symbol: "PSP",
    baseUri: "https.ipfs.moralis.io/ipfs/",
};

const cardInfo = {
    baseUri: "https.ipfs.moralis.io/ipfs/",
    devWallet: process.env.TEAM_WALLET,
    freeUriChanges: 4,
};

const pinkCardInfo = {
    ...cardInfo,
};

const whiteCardInfo = {
    ...cardInfo,
};

module.exports = async function (deployer) {
    const daoTokenDeployment = deployer.deploy(
        PhlipDAO,
        daoTokenInfo.name,
        daoTokenInfo.symbol
    );
    const p2eTokenDeployment = deployer.deploy(
        PhlipP2E,
        p2eTokenInfo.name,
        p2eTokenInfo.symbol
    );

    const socialProfileDeployment = deployer.deploy(
        SocialProfile,
        socialProfileInfo.name,
        socialProfileInfo.symbol,
        socialProfileInfo.baseUri
    );

    const pinkCardDeployment = deployer.deploy(
        PinkCard,
        pinkCardInfo.baseUri,
        pinkCardInfo.devWallet,
        pinkCardInfo.freeUriChanges
    );

    const whiteCardDeployment = deployer.deploy(
        WhiteCard,
        whiteCardInfo.baseUri,
        whiteCardInfo.devWallet,
        whiteCardInfo.freeUriChanges
    );

    // Wait for all contracts to be deployed
    await Promise.all([
        daoTokenDeployment,
        p2eTokenDeployment,
        socialProfileDeployment,
        pinkCardDeployment,
        whiteCardDeployment,
    ]);
};

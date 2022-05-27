const SocialProfile = artifacts.require("SocialProfile.sol");

require("dotenv").config();

const socialProfileInfo = {
    name: "Phlip Social Profile",
    symbol: "PSP",
    baseUri: "https.ipfs.moralis.io/ipfs/",
};

module.exports = async function (deployer) {
    await deployer.deploy(
        SocialProfile,
        socialProfileInfo.name,
        socialProfileInfo.symbol,
        socialProfileInfo.baseUri
    );
};

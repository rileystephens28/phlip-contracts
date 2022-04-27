module.exports = {
    client: require("ganache-core"),
    skipFiles: [
        "Migrations.sol",
        "mocks",
        "interfaces",
        "gameRecords",
        "voting",
        "utils",
        "lists/Blacklist.sol",
        "lists/Blacklister.sol",
        "affiliates",
        "CrowdSale.sol",
    ],
};

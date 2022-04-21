module.exports = {
    client: require("ganache-core"),
    skipFiles: [
        "Migrations.sol",
        "mocks",
        "interfaces",
        "gameRecords",
        "voting",
        "utils",
    ],
};

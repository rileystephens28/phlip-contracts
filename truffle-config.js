const HDWalletProvider = require("@truffle/hdwallet-provider");
const fs = require("fs");
const mnemonic = fs.existsSync(".secret")
    ? fs.readFileSync(".secret").toString().trim()
    : "";
require("dotenv").config();

module.exports = {
    plugins: [
        "truffle-plugin-verify",
        "solidity-coverage",
        "truffle-contract-size",
    ],
    api_keys: {
        etherscan: process.env.ETHERSCAN_API_KEY,
        polygonscan: process.env.POLYGONSCAN_API_KEY,
    },
    mocha: {
        reporter: "eth-gas-reporter",
        reporterOptions: {
            coinmarketcap: process.env.COINMARKETCAP_API_KEY,
            currency: "USD",
            showTimeSpent: true,
        },
    },
    compilers: {
        solc: {
            version: "0.8.13",
            parser: "solcjs",
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        },
    },
    networks: {
        development: {
            host: "127.0.0.1",
            port: 8545,
            network_id: "*",
            disableConfirmationListener: true,
        },
        ganache: {
            host: "127.0.0.1",
            port: 7545,
            chainId: 1337,
            network_id: 5777,
        },
        local_test: {
            host: "127.0.0.1",
            port: 7555,
            chainId: 1337,
            network_id: "*",
            disableConfirmationListener: true,
        },
        ropsten: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/eth/ropsten${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }`
                ),
            network_id: 3,
            gas: 5500000,
            confirmations: 2,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
        kovan: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/eth/kovan${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }`
                ),
            network_id: 42,
            gas: 3716887,
            skipDryRun: true,
            networkCheckTimeout: 100000,
        },
        rinkeby: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/eth/rinkeby${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }`
                ),
            network_id: 4,
            skipDryRun: true,
        },
        goerli: {
            provider: () => {
                return new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/eth/goerli${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }/ws`
                );
            },
            network_id: 5,
            gas: 6000000,
            // gasPrice: 10000000000,
        },
        mainnet: {
            provider: function () {
                return new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/eth/mainnet${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }/ws`
                );
            },
            gas: 5000000,
            gasPrice: 5e9,
            network_id: 1,
        },
        polygon_mumbai: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/polygon/mumbai${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }/ws`
                ),
            network_id: 80001,
            confirmations: 2,
        },
        polygon_mainnet: {
            provider: () =>
                new HDWalletProvider(
                    mnemonic,
                    `wss://speedy-nodes-nyc.moralis.io/${
                        process.env.MORALIS_SPEEDY_NODES_KEY
                    }/polygon/mainnet${
                        process.env.ARCHIVE === true ? "/archive" : ""
                    }/ws`
                ),
            network_id: 137,
            confirmations: 3,
            timeoutBlocks: 200,
            skipDryRun: true,
        },
    },
};

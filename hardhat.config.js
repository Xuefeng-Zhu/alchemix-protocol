require('dotenv').config();
const { utils } = require('ethers');
const fs = require('fs');
const chalk = require('chalk');

require('@nomiclabs/hardhat-waffle');
require('@tenderly/hardhat-tenderly');
require('solidity-coverage');

require('hardhat-deploy');
require('hardhat-gas-reporter');

require('@nomiclabs/hardhat-ethers');
require('@nomiclabs/hardhat-etherscan');

const { isAddress, getAddress, formatUnits, parseUnits } = utils;

/*
      📡 This is where you configure your deploy configuration for 🏗 scaffold-eth
      check out `packages/scripts/deploy.js` to customize your deployment
      out of the box it will auto deploy anything in the `contracts` folder and named *.sol
      plus it will use *.args for constructor args
*/

//
// Select the network you want to deploy to here:
//

const mainnetGwei = 21;

const chainIds = {
  ganache: 1337,
  goerli: 5,
  hardhat: 31337,
  kovan: 42,
  mainnet: 1,
  polygon: 137,
  rinkeby: 4,
  ropsten: 3,
};

let infuraKey = process.env.INFURA_KEY;
if (!infuraKey) {
  console.warn('Please set your INFURA_KEY in a .env file');
  infuraKey = '00000000000000000000000000000000';
}

function createNetworkConfig(network) {
  const url = `https://${network}.infura.io/v3/${infuraKey}`;
  return {
    accounts: {
      mnemonic: process.env.MNEMONIC,
    },
    chainId: chainIds[network],
    url,
  };
}

module.exports = {
  /**
   * gas reporter configuration that let's you know
   * an estimate of gas for contract deployments and function calls
   * More here: https://hardhat.org/plugins/hardhat-gas-reporter.html
   */
  gasReporter: {
    currency: 'USD',
    coinmarketcap: process.env.COINMARKETCAP || null,
  },

  // if you want to deploy to a testnet, mainnet, or xdai, you will need to configure:
  // 1. An Infura key (or similar)
  // 2. A private key for the deployer
  // DON'T PUSH THESE HERE!!!
  // An `example.env` has been provided in the Hardhat root. Copy it and rename it `.env`
  // Follow the directions, and uncomment the network you wish to deploy to.

  networks: {
    mainnet: createNetworkConfig('mainnet'),
    goerli: createNetworkConfig('goerli'),
    kovan: createNetworkConfig('kovan'),
    localhost: {
      url: 'http://127.0.0.1:8545',
      saveDeployments: true,
      loggingEnabled: true,
      companionNetworks: { ethereum: 'mainnet' },
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
            runs: 999999,
          },
        },
      },
    ],
  },
  ovm: {
    solcVersion: '0.7.6',
  },
  namedAccounts: {
    deployer: {
      default: 0, // here this will by default take the first account as deployer
    },
    governance: 0,
    rewards: 0,
    sentinel: 1,
    newGovernance: 0,
    user: 0,
    dai: {
      1: '0x6B175474E89094C44Da98b954EedeAC495271d0F', //mainnet dai address
      1337: '0x6B175474E89094C44Da98b954EedeAC495271d0F', //mainnet dai address
      3: '0xad6d458402f60fd3bd25163575031acdce07538d',
    },
    yearnVault: {
      1: '0x19D3364A399d251E894aC732651be8B0E4e85001', // mainnet yearn daivault address
      1337: '0x19D3364A399d251E894aC732651be8B0E4e85001', // mainnet yearn daivault address
      3: '0xdbfb15bc9beaaacda989ce3a6864af262166ac06',
    },
    linkOracleAddress: {
      1: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
      1337: '0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9',
    },
  },
  etherscan: {
    apiKey: 'DNXJA8RX2Q3VZ4URQIWP7Z68CJXQZSC6AW',
  },
};

const DEBUG = false;

function debug(text) {
  if (DEBUG) {
    console.log(text);
  }
}

task('wallet', 'Create a wallet (pk) link', async (_, { ethers }) => {
  const randomWallet = ethers.Wallet.createRandom();
  const privateKey = randomWallet._signingKey().privateKey;
  console.log('🔐 WALLET Generated as ' + randomWallet.address + '');
  console.log('🔗 http://localhost:3000/pk#' + privateKey);
});

async function addr(ethers, addr) {
  if (isAddress(addr)) {
    return getAddress(addr);
  }
  const accounts = await ethers.provider.listAccounts();
  if (accounts[addr] !== undefined) {
    return accounts[addr];
  }
  throw `Could not normalize address: ${addr}`;
}

task('accounts', 'Prints the list of accounts', async (_, { ethers }) => {
  const accounts = await ethers.provider.listAccounts();
  accounts.forEach((account) => console.log(account));
});

task('blockNumber', 'Prints the block number', async (_, { ethers }) => {
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(blockNumber);
});

task('balance', "Prints an account's balance")
  .addPositionalParam('account', "The account's address")
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(
      await addr(ethers, taskArgs.account)
    );
    console.log(formatUnits(balance, 'ether'), 'ETH');
  });

function send(signer, txparams) {
  return signer.sendTransaction(txparams, (error, transactionHash) => {
    if (error) {
      debug(`Error: ${error}`);
    }
    debug(`transactionHash: ${transactionHash}`);
    // checkForReceipt(2, params, transactionHash, resolve)
  });
}

task('send', 'Send ETH')
  .addParam('from', 'From address or account index')
  .addOptionalParam('to', 'To address or account index')
  .addOptionalParam('amount', 'Amount to send in ether')
  .addOptionalParam('data', 'Data included in transaction')
  .addOptionalParam('gasPrice', 'Price you are willing to pay in gwei')
  .addOptionalParam('gasLimit', 'Limit of how much gas to spend')

  .setAction(async (taskArgs, { network, ethers }) => {
    const from = await addr(ethers, taskArgs.from);
    debug(`Normalized from address: ${from}`);
    const fromSigner = await ethers.provider.getSigner(from);

    let to;
    if (taskArgs.to) {
      to = await addr(ethers, taskArgs.to);
      debug(`Normalized to address: ${to}`);
    }

    const txRequest = {
      from: await fromSigner.getAddress(),
      to,
      value: parseUnits(
        taskArgs.amount ? taskArgs.amount : '0',
        'ether'
      ).toHexString(),
      nonce: await fromSigner.getTransactionCount(),
      gasPrice: parseUnits(
        taskArgs.gasPrice ? taskArgs.gasPrice : '1.001',
        'gwei'
      ).toHexString(),
      gasLimit: taskArgs.gasLimit ? taskArgs.gasLimit : 24000,
      chainId: network.config.chainId,
    };

    if (taskArgs.data !== undefined) {
      txRequest.data = taskArgs.data;
      debug(`Adding data to payload: ${txRequest.data}`);
    }
    debug(txRequest.gasPrice / 1000000000 + ' gwei');
    debug(JSON.stringify(txRequest, null, 2));

    return send(fromSigner, txRequest);
  });

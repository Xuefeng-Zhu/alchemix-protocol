// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat');
const config = require('../config');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  console.log(chainId);
  let addresses = config[chainId];
  addresses = undefined;

  const alchemist = await ethers.getContract('Alchemist', deployer);

  let adapter;
  let rewards;
  if (!addresses) {
    // const baseToken = await ethers.getContract('ERC20Mock', deployer);
    const baseTokenAddress = '0x7D91365bC65CF9caDC6aE1d86d35f5add750Fe37';

    await deploy('YaxisVaultMock', {
      from: deployer,
      args: [baseTokenAddress],
      log: true,
    });
    const vault = await ethers.getContract('YaxisVaultMock', deployer);

    await deploy('GaugeMock', {
      from: deployer,
      args: [vault.address],
      log: true,
    });
    const gauge = await ethers.getContract('GaugeMock', deployer);
    await vault.setGauge(gauge.address);

    await deploy('Rewards', {
      from: deployer,
      args: [gauge.address, baseTokenAddress, 60 * 60 * 24 * 365],
      log: true,
    });
    rewards = await ethers.getContract('Rewards', deployer);

    await deploy('YaxisVaultAdapter', {
      from: deployer,
      args: [vault.address, alchemist.address, rewards.address],
      log: true,
    });
    adapter = await ethers.getContract('YaxisVaultAdapter', deployer);
  } else {
    await deploy('Rewards', {
      from: deployer,
      args: [addresses.gauge, addresses.rewardStake, 60 * 60 * 24 * 365],
      log: true,
    });
    rewards = await ethers.getContract('Rewards', deployer);

    await deploy('YaxisVaultAdapter', {
      from: deployer,
      args: [addresses.vault, alchemist.address, rewards.address],
      log: true,
    });
    adapter = await ethers.getContract('YaxisVaultAdapter', deployer);
  }

  await rewards.setRewardDistribution(adapter.address);
};
module.exports.tags = ['YaxisVaultAdapter'];

// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat');
const config = require('../config');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  console.log(chainId);
  let addresses = config[chainId];

  const alchemist = await ethers.getContract('ConvertAlchemist', deployer);

  let adapter;
  let rewards;
  if (chainId != 1) {
    await deploy('YaxisVaultMock', {
      from: deployer,
      args: [addresses.mimCrv],
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
      args: [gauge.address, addresses.mimCrv, 60 * 60 * 24 * 365],
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

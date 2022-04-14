// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat');
const config = require('../config');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const addresses = config[chainId];

  const alchemist = await ethers.getContract('Alchemist', deployer);

  let adapter;
  if (!addresses) {
    const baseToken = await ethers.getContract('ERC20Mock', deployer);

    await deploy('YaxisVaultMock', {
      from: deployer,
      args: [baseToken.address],
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

    await deploy('YaxisVaultAdapter', {
      from: deployer,
      args: [vault.address, alchemist.address, deployer],
      log: true,
    });
    adapter = await ethers.getContract('YaxisVaultAdapter', deployer);
  } else {
    await deploy('YaxisVaultAdapter', {
      from: deployer,
      args: [addresses.vault, alchemist.address, deployer],
      log: true,
    });
    adapter = await ethers.getContract('YaxisVaultAdapter', deployer);
  }
};
module.exports.tags = ['YaxisVaultAdapter'];

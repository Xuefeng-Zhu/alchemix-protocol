// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat');
const config = require('../config');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();
  const addresses = config[chainId];

  let baseToken;

  if (!addresses) {
    await deploy('ERC20Mock', {
      from: deployer,
      args: ['MIM', 'MIM', 18],
      log: true,
    });
    baseToken = await ethers.getContract('ERC20Mock', deployer);
  } else {
    baseToken = await ethers.getContractAt('ERC20Mock', addresses.mimCrv);
  }

  await deploy('AlToken', {
    from: deployer,
    log: true,
  });

  const alToken = await ethers.getContract('AlToken', deployer);

  await deploy('Transmuter', {
    from: deployer,
    args: [alToken.address, baseToken.address, deployer],
    log: true,
  });
  await deploy('Alchemist', {
    from: deployer,
    args: [baseToken.address, alToken.address, deployer, deployer],
    log: true,
  });

  const transmuter = await ethers.getContract('Transmuter', deployer);
  const alchemist = await ethers.getContract('Alchemist', deployer);

  await alToken.setWhitelist(alchemist.address, true);
  await transmuter.setWhitelist(alchemist.address, true);
  console.log('setWhitelist');
  await alchemist.setTransmuter(transmuter.address);
  await alchemist.setRewards(addresses?.reward || deployer);

  let adapter;
  if (!addresses) {
    await deploy('YearnControllerMock', {
      from: deployer,
      args: [],
      log: true,
    });
    const controller = await ethers.getContract(
      'YearnControllerMock',
      deployer
    );

    await deploy('YearnVaultMock', {
      from: deployer,
      args: [baseToken.address, controller.address],
      log: true,
    });
    const vault = await ethers.getContract('YearnVaultMock', deployer);

    await deploy('YearnVaultAdapter', {
      from: deployer,
      args: [vault.address, alchemist.address],
      log: true,
    });
    adapter = await ethers.getContract('YearnVaultAdapter', deployer);
  } else {
    await deploy('YaxisVaultAdapter', {
      from: deployer,
      args: [addresses.vault, alchemist.address, deployer],
      log: true,
    });
    adapter = await ethers.getContract('YaxisVaultAdapter', deployer);
  }
  await alchemist.initialize(adapter.address);
};
module.exports.tags = ['Alchemist'];

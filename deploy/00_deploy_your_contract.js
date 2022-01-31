// deploy/00_deploy_your_contract.js

const { ethers } = require('hardhat');

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await getChainId();

  await deploy('AlToken', {
    from: deployer,
    log: true,
  });

  await deploy('ERC20Mock', {
    from: deployer,
    args: ['MIM', 'MIM', 18],
    log: true,
  });

  // Getting a previously deployed contract
  const alToken = await ethers.getContract('AlToken', deployer);
  const baseToken = await ethers.getContract('ERC20Mock', deployer);

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

  // Verify from the command line by running `yarn verify`

  // You can also Verify your contracts with Etherscan here...
  // You don't want to verify on localhost
  // try {
  //   if (chainId !== localChainId) {
  //     await run("verify:verify", {
  //       address: YourContract.address,
  //       contract: "contracts/YourContract.sol:YourContract",
  //       contractArguments: [],
  //     });
  //   }
  // } catch (error) {
  //   console.error(error);
  // }
};
module.exports.tags = ['Alchemist'];

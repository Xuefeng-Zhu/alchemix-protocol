const chai = require('chai');
const { solidity } = require('ethereum-waffle');
const { ethers } = require('hardhat');
const { BigNumber, utils } = require('ethers');
const { parseEther } = require('ethers/lib/utils');
const { MAXIMUM_U256, mineBlocks } = require('../helpers/utils');

chai.use(solidity);

const { expect } = chai;

let YaxisVaultMockFactory;
let ERC20MockFactory;
let GaugeMockFactory;
let YaxisVaultAdapterFactory;
let RewardsFactory;

describe('Adapter', () => {
  let deployer;
  let user;
  let token;
  let rewards;
  let vault;
  let gauge;
  let adapter;

  before(async () => {
    ERC20MockFactory = await ethers.getContractFactory('ERC20Mock');
    RewardsFactory = await ethers.getContractFactory('Rewards');
    GaugeMockFactory = await ethers.getContractFactory('GaugeMock');
    YaxisVaultMockFactory = await ethers.getContractFactory('YaxisVaultMock');
    YaxisVaultAdapterFactory = await ethers.getContractFactory(
      'YaxisVaultAdapter'
    );
  });

  beforeEach(async () => {
    [deployer, user] = await ethers.getSigners();

    token = await ERC20MockFactory.connect(deployer).deploy(
      'Mock DAI',
      'DAI',
      18
    );
    vault = await YaxisVaultMockFactory.connect(deployer).deploy(token.address);
    gauge = await GaugeMockFactory.connect(deployer).deploy(vault.address);
    await vault.connect(deployer).setGauge(gauge.address);

    rewards = await RewardsFactory.connect(deployer).deploy(
      gauge.address,
      token.address,
      1000
    );

    adapter = await YaxisVaultAdapterFactory.connect(deployer).deploy(
      vault.address,
      await deployer.getAddress(),
      rewards.address
    );

    await token.mint(await deployer.getAddress(), utils.parseEther('20000'));
    await token.connect(deployer).transfer(adapter.address, 10000);
    await adapter.connect(deployer).deposit(10000);
    await rewards.connect(deployer).setRewardDistribution(adapter.address);
  });

  it('deposit should work correctly', async () => {
    expect(await gauge.balances(adapter.address)).equal(10000);
  });

  it('withdraw should work correctly', async () => {
    await adapter.connect(deployer).withdraw(await user.getAddress(), 10000);
    expect(await token.balanceOf(await user.getAddress())).equal(10000);
  });

  it('claimReward should work correctly', async () => {
    await adapter.connect(deployer).claimReward();
    expect(await gauge.balanceOf(await rewards.address)).equal(
      utils.parseEther('1')
    );
  });
});

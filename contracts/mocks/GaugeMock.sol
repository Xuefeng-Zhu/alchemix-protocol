// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract GaugeMock is ERC20 {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    ERC20 public token;
    mapping(address => uint256) public balances;

    address public gauge;

    constructor(ERC20 _token) public ERC20("gauce Mock", "gMOCK") {
        token = _token;
    }

    function deposit(uint256 _amount) external {
        token.safeTransferFrom(msg.sender, address(this), _amount);
        balances[msg.sender] += _amount;
    }

    function withdraw(uint256 _amount) external {
        balances[msg.sender] = balances[msg.sender].sub(_amount);
        token.safeTransfer(msg.sender, _amount);
    }

    function claim_rewards() external {
        _mint(msg.sender, 1e18);
    }

    function reward_tokens(uint256) external view returns (address) {
        return address(this);
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;
pragma experimental ABIEncoderV2;

import "hardhat/console.sol";

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract YaxisVaultMock is ERC20 {
    using SafeERC20 for ERC20;
    using SafeMath for uint256;

    ERC20 public token;

    address public gauge;

    constructor(ERC20 _token) public ERC20("yEarn Mock", "yMOCK") {
        token = _token;
    }

    function setGauge(address _gauge) external {
        gauge = _gauge;
    }

    function deposit(uint256 _amount) external returns (uint256) {
        token.safeTransferFrom(msg.sender, address(this), _amount);
        _mint(msg.sender, _amount);
    }

    function withdraw(uint256 _shares) external {
        _burn(msg.sender, _shares);
        token.safeTransfer(msg.sender, _shares);
    }

    function getPricePerFullShare() external view returns (uint256) {
        return 1e18;
    }

    function getToken() external view returns (address) {
        return address(token);
    }

    function getLPToken() external view returns (address) {
        return address(this);
    }
}

// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.6.12;

interface ICurveToken {
    function add_liquidity(
        uint256[] calldata token_amount,
        uint256 min_mint_amount
    ) external returns (uint256);

    function remove_liquidity_one_coin(
        uint256 token_amount,
        uint256 i,
        uint256 min_amount,
        address receiver
    ) external returns (uint256);

    function get_virtual_price() external view returns (uint256);
}

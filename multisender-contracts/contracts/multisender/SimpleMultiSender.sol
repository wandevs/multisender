// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";

contract SimpleMultiSender {
    using SafeMath for uint256;
    using SafeERC20 for ERC20;

    uint public constant LIMIT = 200;

    event Multisended(uint256 total, address tokenAddress);
    event ClaimedTokens(address token, address owner, uint256 balance);

    receive() external payable {}

    function multisendToken(address token, address payable[]  calldata _contributors, uint256[] calldata _balances) public payable {
        if (token == 0x000000000000000000000000000000000000bEEF){
            multisendEther(_contributors, _balances);
        } else {
            // uint256 total = 0;
            require(_contributors.length <= LIMIT, "too more users");
            ERC20 erc20token = ERC20(token);
            uint8 i = 0;
            for (i; i < _contributors.length; i++) {
                if (!Address.isContract(_contributors[i])) {
                    erc20token.transferFrom(msg.sender, _contributors[i], _balances[i]);
                }
            }
        }
    }

    function multisendEther(address payable[]  calldata _contributors, uint256[] calldata _balances) public payable {
        uint256 total = msg.value;
        require(_contributors.length <= LIMIT, "too more users");
        uint256 i = 0;
        for (i; i < _contributors.length; i++) {
            if (!Address.isContract(_contributors[i])) { 
                require(total >= _balances[i]);
                total = total.sub(_balances[i]);
                _contributors[i].transfer(_balances[i]);
            }
        }
    }
}
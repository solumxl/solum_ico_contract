pragma solidity ^0.4.11;

contract Helper {
	function getBalance() returns(uint256) {
		return msg.sender.balance;
	}
}
pragma solidity ^0.4.11;


contract Owned {
	address public owner;

	function Owned() internal {
		owner = msg.sender;
	}

	function changeOwner(address newOwner) public onlyOwner {
		owner = newOwner;
	}

	modifier onlyOwner {
		require(msg.sender == owner);
		_;
	}
}
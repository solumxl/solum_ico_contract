pragma solidity ^0.4.11;

import './Owned.sol';

contract Delegate is Owned {
	address public delegate;

	function Delegate() public {
		delegate = msg.sender;
	}

	function changeDelegate(address newDelegate) public onlyOwner {
		delegate = newDelegate;
	}

	modifier onlyDelegate {
		require(msg.sender == delegate);
		_;
	}
}
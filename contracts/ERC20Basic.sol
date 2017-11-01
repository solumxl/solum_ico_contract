pragma solidity ^0.4.11;


/**
 * @title ERC20Basic
 * @dev Implements erc20 Token Standard
 */
contract ERC20Basic {

	uint256 _totalSupply;

	function balanceOf(address _owner) constant returns (uint256 balance);

	function totalSupply() constant returns (uint256);

	function transfer(address _to, uint256 _value) returns (bool success);

	event Transfer(address indexed _from, address indexed _to, uint256 _value);

	function transferFrom(address _from, address _to, uint256 _value) returns (bool success);

	function approve(address _spender, uint256 _value) returns (bool success);

	function allowance(address _owner, address _spender) constant returns (uint256 remaining);

	event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}
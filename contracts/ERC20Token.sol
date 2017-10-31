pragma solidity ^0.4.11;


import "./SafeMath.sol";


contract Owned {
	address public owner;

	function Owned() {
		owner = msg.sender;
	}

	function changeOwner(address newOwner) onlyOwner {
		owner = newOwner;
	}

	modifier onlyOwner {
		require(msg.sender == owner);
		_;
	}
}


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


/**
 * @title Standard erc20 token
 *
 * @dev Implementation of the basic standard token.
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract SolumToken is ERC20Basic, Owned {
	using SafeMath for uint256;

	string public name = "Solum";

	uint8 public decimals = 18;

	string public symbol = "SOL";

	// only after this date balances should be available
	uint256 public allowAfterDate = 1509442116;

	mapping (address => uint256) balances;

	mapping (address => mapping (address => uint256)) allowed;

	function SolumToken() {}

	/**
	* @dev transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
	function transfer(address _to, uint256 _value) returns (bool) {
		require(allowAfterDate <= now);
		require(_to != address(0));

		// SafeMath.sub will throw if there is not enough balance.
		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);
		Transfer(msg.sender, _to, _value);
		return true;
	}

	/**
	* @dev Gets the balance of the specified address.
	* @param _owner The address to query the the balance of.
	* @return An uint256 representing the amount owned by the passed address.
	*/
	function balanceOf(address _owner) constant returns (uint256 balance) {
		if (allowAfterDate > now)
		return 0;
		return balances[_owner];
	}

	function totalSupply() constant returns (uint256) {
		return _totalSupply;
	}

	/**
	 * @dev Transfer tokens from one address to another
	 * @param _from address The address which you want to send tokens from
	 * @param _to address The address which you want to transfer to
	 * @param _value uint256 the amount of tokens to be transferred
	 */
	function transferFrom(address _from, address _to, uint256 _value) returns (bool) {
		require(allowAfterDate <= now);
		require(_to != address(0));

		// Check is not needed because s_allowance.sub(_value) will already throw if this condition is not met
		// require (_value <= _allowance);

		balances[_from] = balances[_from].sub(_value);
		balances[_to] = balances[_to].add(_value);
		allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
		Transfer(_from, _to, _value);
		return true;
	}

	/**
	 * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
	 * @param _spender The address which will spend the funds.
	 * @param _value The amount of tokens to be spent.
	 */
	function approve(address _spender, uint256 _value) returns (bool) {
		// To change the approve amount you first have to reduce the addresses`
		//  allowance to zero by calling `approve(_spender, 0)` if it is not
		//  already 0 to mitigate the race condition described here:
		//  https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
		require((_value == 0) || (allowed[msg.sender][_spender] == 0));

		allowed[msg.sender][_spender] = _value;
		Approval(msg.sender, _spender, _value);
		return true;
	}

	/**
	 * @dev Function to check the amount of tokens that an owner allowed to a spender.
	 * @param _owner address The address which owns the funds.
	 * @param _spender address The address which will spend the funds.
	 * @return A uint256 specifying the amount of tokens still available for the spender.
	 */
	function allowance(address _owner, address _spender) constant returns (uint256 remaining) {
		return allowed[_owner][_spender];
	}

	function mintToken(address target, uint256 mintedAmount) onlyOwner {
		balances[target] = balances[target].add(mintedAmount);
		_totalSupply = _totalSupply.add(mintedAmount);
		Transfer(this, target, mintedAmount);
	}

	function() {
		//if ether is sent to this address, send it back.
		revert();
	}
}
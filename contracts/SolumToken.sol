pragma solidity ^0.4.11;

import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20Basic.sol";


/**
 * @dev Implementation of the basic standard token.
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract SolumToken is ERC20Basic, Owned {
	using SafeMath for uint256;

	string public name = "Solum";

	uint public decimals = 18;

	string public symbol = "SOL";

	// only after this date balances should be available
	uint256 public defrostDate;

	mapping (address => uint256) balances;

	mapping (address => mapping (address => uint256)) allowed;

	function SolumToken(uint256 _defrostDate) {
		defrostDate = _defrostDate;
	}

	/**
	* @dev transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
	function transfer(address _to, uint256 _value) returns (bool) {
		require(defrostDate <= block.timestamp);
		require(_to != address(0));

		// SafeMath.sub will throw if there is not enough balance.
		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);
		Transfer(msg.sender, _to, _value);
		return true;
	}

	function mintToken(address _to, uint256 _value) onlyOwner {
		balances[_to] = balances[_to].add(_value);
		_totalSupply = _totalSupply.add(_value);
		Transfer(this, _to, _value);
	}

	/**
	* @dev Gets the balance of the specified address.
	* @param _owner The address to query the the balance of.
	* @return An uint256 representing the amount owned by the passed address.
	*/
	function balanceOf(address _owner) constant returns (uint256 balance) {
		if (defrostDate > block.timestamp) {
			return 0;
		}
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
		require(defrostDate <= block.timestamp);
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

	function() {
		//if ether is sent to this address, send it back.
		revert();
	}
}
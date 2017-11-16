pragma solidity ^0.4.11;

import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20Basic.sol";
import "./Date.sol";
// TODO remove before deploy!!!
import "./Debug.sol";

/**
 * @dev Implementation of the basic standard token.
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract SolumToken is ERC20Basic, Owned, Debug {
	using SafeMath for uint256;

	event Fee(address indexed _payer, uint256 _value, uint32 _month);

	string public name = "Solum";

	uint public decimals = 18;

	string public symbol = "SOL";

	// only after this date balances should be available
	uint256 public defrostDate;

	mapping (address => uint256) balances;

	mapping (address => mapping (address => uint256)) allowed;

	address public founder;

	Date dateTime;

	mapping (uint32 => uint256) public feePool;

	address[] holders;
	mapping (address => uint256) holdersIndexes;

	function SolumToken(uint256 _defrostDate, address _founder) public {
		defrostDate = _defrostDate;
		dateTime = new Date();
		founder = _founder;
		holders.push(this);
		_addHolder(_founder);
	}

	/**
	* @dev transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
	function transfer(address _to, uint256 _value) external returns (bool) {
		require(defrostDate <= block.timestamp);
		require(_to != address(0));
		uint256 fee = _value.mul(5).div(100);
		// SafeMath.sub will throw if there is not enough balance.
		balances[msg.sender] = balances[msg.sender].sub(_value);
		balances[_to] = balances[_to].add(_value);
		_addHolder(_to);

		Transfer(msg.sender, _to, _value);
		refillFeePool(msg.sender, fee);
		return true;
	}

	function mintToken(address _to, uint256 _value) external onlyOwner {
		balances[_to] = balances[_to].add(_value);
		_addHolder(_to);
		_totalSupply = _totalSupply.add(_value);
		Transfer(this, _to, _value);
	}

	/**
	* @dev Gets the balance of the specified address.
	* @param _owner The address to query the the balance of.
	* @return An uint256 representing the amount owned by the passed address.
	*/
	function balanceOf(address _owner) public constant returns (uint256 balance) {
		if (defrostDate > block.timestamp) {
			return 0;
		}
		return balances[_owner];
	}

	function totalSupply() public constant returns (uint256) {
		return _totalSupply;
	}

	/**
	 * @dev Transfer tokens from one address to another
	 * @param _from address The address which you want to send tokens from
	 * @param _to address The address which you want to transfer to
	 * @param _value uint256 the amount of tokens to be transferred
	 */
	function transferFrom(address _from, address _to, uint256 _value) external returns (bool) {
		require(defrostDate <= block.timestamp);
		require(_to != address(0));

		uint256 fee = _value.mul(5).div(100);

		// Check is not needed because s_allowance.sub(_value) will already throw if this condition is not met
		// require (_value <= _allowance);

		balances[_from] = balances[_from].sub(_value);
		balances[_to] = balances[_to].add(_value);
		_addHolder(_to);
		allowed[_from][msg.sender] = allowed[_from][msg.sender].sub(_value);
		Transfer(_from, _to, _value);
		refillFeePool(_from, fee);
		return true;
	}

	/**
	 * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
	 * @param _spender The address which will spend the funds.
	 * @param _value The amount of tokens to be spent.
	 */
	function approve(address _spender, uint256 _value) external returns (bool) {
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
	function allowance(address _owner, address _spender) external constant returns (uint256 remaining) {
		return allowed[_owner][_spender];
	}

	function refillFeePool(address _sender, uint256 _fee) internal {
		// SafeMath.sub will throw if there is not enough balance.
		uint256 halfFee = _fee.div(2);
		balances[_sender] = balances[_sender].sub(_fee);
		balances[founder] = balances[founder].add(halfFee);

		uint32 month = uint32(dateTime.getYear(now) | (dateTime.getMonth(now) * 2 ** 16));
		feePool[month] = feePool[month].add(halfFee);
		Fee(_sender, _fee, month);
	}

	function sendDividends(uint16 year, uint8 month) external {
		uint16 currentYear = dateTime.getYear(now);
		uint8 currentMonth = dateTime.getMonth(now);
		require(year <= currentYear);
		if(year == currentYear) {
			require(month < currentMonth);
		}
		uint32 key = uint32(year | (month * 2 ** 16));
		require(feePool[key] > 0);

		uint feePoolValue = feePool[key];
		uint receivedFees;
		uint dividend;

		for(uint i = 0; i < holders.length; i++) {
			if(balances[holders[i]] >= 10 ** decimals * 100000) {
				dividend = feePoolValue * balances[holders[i]] / _totalSupply;
				Transfer(this, holders[i], dividend);
				balances[holders[i]] = balances[holders[i]].add(dividend);
				receivedFees = receivedFees.add(dividend);
			}
		}
		uint32 currentMonthKey = uint32(currentYear | (currentMonth * 2 ** 16));
		if(receivedFees < feePoolValue) {
			feePool[currentMonthKey] = feePool[currentMonthKey].add(feePoolValue.sub(receivedFees));
		}
		delete feePool[key];
	}

	function _addHolder(address _receiver) internal {
		if(holdersIndexes[_receiver] == 0) {
			holdersIndexes[_receiver] = holders.length;
			holders.push(_receiver);
		}
	}

	function() external {
		//if ether is sent to this address, send it back.
		revert();
	}

	function getNow() public constant returns(uint) {
		return now;
	}
}
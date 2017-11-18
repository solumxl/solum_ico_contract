pragma solidity ^0.4.11;


import "./SafeMath.sol";
import "./Owned.sol";
import "./ERC20Basic.sol";
import "./IDate.sol";


// TODO remove before deploy!!!
import "./Debug.sol";


/**
 * @dev Implementation of the basic standard token.
 * @dev Based on code by FirstBlood: https://github.com/Firstbloodio/token/blob/master/smart_contract/FirstBloodToken.sol
 */
contract SolumToken is ERC20Basic, Owned, Debug {
	using SafeMath for uint256;

	bool public transfersEnabled = true;    // true if transfer/transferFrom are enabled, false if not
	// triggered when a smart token is deployed - the _token address is defined for forward compatibility, in case we want to trigger the event from a factory
	event NewSmartToken(address _token);
	// triggered when the total supply is increased
	event Issuance(uint256 _amount);
	// triggered when the total supply is decreased
	event Destruction(uint256 _amount);

	event Fee(address indexed _payer, uint256 _value, uint32 _month);

	event FeeDispatched(uint16 indexed _month, uint256 _value);

	string public name = "Solum";

	uint public decimals = 18;

	string public symbol = "SOL";

	// only after this date balances should be available
	uint256 public defrostDate;

	mapping (address => uint256) balances;

	mapping (address => mapping (address => uint256)) allowed;

	address public founder;

	IDate dateTime;

	mapping (uint16 => uint256) public feePool;

	mapping (uint16 => uint256) feePullCountDispatch;
	mapping (uint16 => uint256) feePullRemainder;

	address[] holders;

	mapping (address => uint256) holdersIndexes;

	// allows execution only when transfers aren't disabled
	modifier transfersAllowed {
		assert(transfersEnabled);
		_;
	}

	function SolumToken(uint256 _defrostDate, address _founder, IDate _date) public {
		NewSmartToken(address(this));
		defrostDate = _defrostDate;
		dateTime = _date;
		founder = _founder;
		holders.push(this);
		_addHolder(_founder);
	}

	/**
	* @dev transfer token for a specified address
	* @param _to The address to transfer to.
	* @param _value The amount to be transferred.
	*/
	function transfer(address _to, uint256 _value) external transfersAllowed returns (bool) {
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
	function transferFrom(address _from, address _to, uint256 _value) external transfersAllowed returns (bool) {
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

		uint16 month = dateTime.getYear(now) * 12 + dateTime.getMonth(now);
		feePool[month] = feePool[month].add(halfFee);
		Fee(_sender, _fee, month);
	}

	function sendDividends(uint256 limit, uint16 year, uint8 month) external {
		// To avoid re-send of dividends, send must be made with disabled transfers
		require(!transfersEnabled);

		// send must be made only for past months
		require(year <= dateTime.getYear(now));
		if (year == dateTime.getYear(now)) {
			require(month < dateTime.getMonth(now));
		}

		uint16 key = year * 12 + uint16(month);
		uint feePoolValue = feePool[key];

		require(feePoolValue > 0);

		uint receivedFees;
		uint dividend;
		uint balance;
		address holder;
		uint minBalance = 10 ** decimals * 100000;
		uint start = feePullCountDispatch[key];
		uint end = start + limit;
		feePullCountDispatch[key] = end;

		if(end > holders.length) {
			end = holders.length;
		}
		if(start == 0) {
			feePullRemainder[key] = feePoolValue;
		}

		for (uint i = start; i < end; i++) {
			holder = holders[i];
			balance = balances[holder];
			if (balance >= minBalance) {
				dividend = feePoolValue * balance / _totalSupply;
				Transfer(this, holder, dividend);
				balances[holder] = balance.add(dividend);
				receivedFees = receivedFees + dividend;
			}
		}

		feePullRemainder[key] = feePullRemainder[key].sub(receivedFees);

		if(end == holders.length) {
			if (receivedFees < feePoolValue) {
				uint16 currentMonthKey = dateTime.getYear(now) * 12 + dateTime.getMonth(now);
				feePool[currentMonthKey] = feePool[currentMonthKey].add(feePullRemainder[key]);
			}

			FeeDispatched(key, feePoolValue - feePullRemainder[key]);

			delete feePullRemainder[key];
			delete feePool[key];
			delete feePullCountDispatch[key];
		}
	}

	function _addHolder(address _receiver) internal {
		if (holdersIndexes[_receiver] == 0) {
			holdersIndexes[_receiver] = holders.length;
			holders.push(_receiver);
		}
	}

	function() external {
		//if ether is sent to this address, send it back.
		revert();
	}

	function getNow() public constant returns (uint) {
		return now;
	}

	/**
	*	@dev disables/enables transfers
	*	can only be called by the contract owner
	*	@param _disable    true to disable transfers, false to enable them
	*/
	function changeTransfersStatus(bool _disable) public onlyOwner {
		transfersEnabled = !_disable;
	}
}
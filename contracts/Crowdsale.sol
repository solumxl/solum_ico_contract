pragma solidity ^0.4.11;


import './SolumToken.sol';
import './Owned.sol';
import './Delegate.sol';
import './SafeMath.sol';


contract Crowdsale is Owned, Delegate {

	using SafeMath for uint256;

	SolumToken public token;

	uint256 public tokenTotalSupply;
	/// the founder address can set this to true to halt the crowdsale due to emergency
	bool public halted = false;
	uint256 public stageSaleAmount;

	// Crowdsale parameters
	uint256[2] public stageOneDates;

	uint256[2] public stageTwoDates;

	mapping(uint8 => uint256) public totalSupplyByStage;

	uint256 public price;

	// Modifiers
	modifier validPurchase() {
		require((now >= stageOneDates[0] && now < stageOneDates[1]) || (now >= stageTwoDates[0] && now < stageTwoDates[1]));
		require(msg.value > 0);
		_;
	}

	modifier validUnHalt() {
		require(halted == false);
		_;
	}

	// Events
	event FundTransfer(address backer, uint amount, bool isContribution);
	event SetPrice(uint newPrice);

	function Crowdsale(
	address _tokenAddress,
	uint256 _stageOneStartDate,
	uint256 _stageOneEndDate,
	uint256 _stageTwoStartDate,
	uint256 _stageTwoEndDate,
	uint256 _stageGoalInEth) {
		// date of start stage 1
		stageOneDates[0] = _stageOneStartDate;
		// date of end stage 1
		stageOneDates[1] = _stageOneEndDate;
		// date of start stage 2
		stageTwoDates[0] = _stageTwoStartDate;
		// date of end stage 2
		stageTwoDates[1] = _stageTwoEndDate;

		totalSupplyByStage[1] = 0;
		totalSupplyByStage[2] = 0;

		token = SolumToken(_tokenAddress);

		/// 800 million Solum tokens will ever be created
		tokenTotalSupply = 800 * (10 ** 6) * (10 ** token.decimals());
		/// 264 million tokens for sale
		stageSaleAmount = 264 * (10 ** 6) * (10 ** token.decimals());

		price = _stageGoalInEth.mul(1 ether).div(stageSaleAmount);
		SetPrice(price);
	}

	function() external payable validPurchase validUnHalt {
		uint256 usedValue = mint(msg.sender, msg.value);
		uint256 change = msg.value.sub(usedValue);
		FundTransfer(msg.sender, msg.value, true);
		if(change > 0) {
			FundTransfer(msg.sender, change, false);
			msg.sender.transfer(change);
		}
	}

	function customPayment(address _beneficiary, uint256 _value) external validPurchase validUnHalt onlyDelegate {
		mint(_beneficiary, _value);
	}

	function mint(address _beneficiary, uint256 _value) internal returns(uint256) {
		uint256 tokenAmount = _value.div(price);

		uint256 checkedSupply = token.totalSupply().add(tokenAmount);
		uint8 stage = now >= stageTwoDates[0] ? 2 : 1;

		// Ensure new token increment does not exceed the sale amount
		assert(checkedSupply <= totalSupplyByStage[stage]);

		token.mintToken(_beneficiary, tokenAmount);
		return tokenAmount.mul(price);
	}

	/// @dev Withdraw ethereum to owner contract address
	function withdrawFunds() onlyOwner {
		require((now >= stageOneDates[1] && now < stageTwoDates[0]) || (now >= stageTwoDates[1]));
		owner.transfer(this.balance);
	}

	/// Emergency Stop ICO
	function halt() onlyOwner {
		halted = true;
	}

	function unhalt() onlyOwner {
		halted = false;
	}

	/**
	* @dev Mint all remaining after two stages tokens to owner contract address
	*/
	function withdrawRemainingTokens() onlyOwner {
		require(now > stageTwoDates[1]);
		token.mintToken(owner, tokenTotalSupply.sub(token.totalSupply()));
	}

	/**
	* @dev between fist and second stages owner can change the goal of the second stage
	* @param _ethAmount New goal in Ether for second stage
	*/
	function changeSecondStageGoal(uint256 _ethAmount) onlyOwner {
		require(now >= stageOneDates[1] && now < stageTwoDates[0]);
		price = _ethAmount.mul(1 ether).div(stageSaleAmount);
		SetPrice(price);
	}
}
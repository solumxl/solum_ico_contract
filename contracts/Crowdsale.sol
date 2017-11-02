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
	modifier validPurchase(uint256 _value) {
		require((now >= stageOneDates[0] && now < stageOneDates[1]) || (now >= stageTwoDates[0] && now < stageTwoDates[1]));
		require(_value > 0);
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
		require(_stageGoalInEth > 0);
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

		price = stageSaleAmount.div(_stageGoalInEth.mul(1 ether));
		SetPrice(price);
	}

	function() external payable validPurchase(msg.value) validUnHalt {

		uint256 unused = mint(msg.sender, msg.value);
		FundTransfer(msg.sender, msg.value, true);
		if(unused > 0) {
			msg.sender.transfer(unused);
			FundTransfer(msg.sender, unused, false);
		}
	}

	function customPayment(address _beneficiary, uint256 _value) external validPurchase(_value) validUnHalt onlyDelegate {
		mint(_beneficiary, _value);
	}

	function mint(address _beneficiary, uint256 _value) internal returns(uint256) {
		uint8 stage = now >= stageTwoDates[0] ? 2 : 1;
		require(stageSaleAmount > totalSupplyByStage[stage]);
		uint256 tokenAmount = _value.mul(price);
		uint256 unusedValue = 0;

		uint256 notSold = stageSaleAmount - totalSupplyByStage[stage];
		if(notSold < tokenAmount) {
			unusedValue = tokenAmount.sub(notSold).div(price);
			tokenAmount = notSold;
		}
		totalSupplyByStage[stage] = totalSupplyByStage[stage].add(tokenAmount);

		token.mintToken(_beneficiary, tokenAmount);
		return unusedValue;
	}

	/// @dev Withdraw ethereum to owner contract address
	function withdrawFunds() onlyOwner {
		require((now >= stageOneDates[1] && now < stageTwoDates[0]) || (now >= stageTwoDates[1]));
		owner.transfer(this.balance);
		FundTransfer(owner, this.balance, false);
	}

	/**
	* @dev Mint all remaining after two stages tokens to owner contract address
	*/
	function withdrawRemainingTokens() onlyOwner {
		require(now >= stageTwoDates[1]);
		token.mintToken(owner, tokenTotalSupply.sub(token.totalSupply()));
	}

	/**
	* @dev between fist and second stages owner can change the goal of the second stage
	* @param _ethAmount New goal in Ether for second stage
	*/
	function changeSecondStageGoal(uint256 _ethAmount) onlyOwner {
		require(now >= stageOneDates[1] && now < stageTwoDates[0]);
		price = stageSaleAmount.div(_ethAmount.mul(1 ether));
		SetPrice(price);
	}

	/// Emergency Stop ICO
	function halt() onlyOwner {
		halted = true;
	}

	function unhalt() onlyOwner {
		halted = false;
	}
}
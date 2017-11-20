const ERC20Token = artifacts.require("./SolumToken.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const DateContract = artifacts.require("./Date.sol");
const moment = require('moment');
const firstStage = [
	moment.utc('2017-10-01 00:00:00').format('X'),
	moment.utc('2017-12-30 00:00:00').format('X')
];
const secondStage = [
	moment.utc('2018-01-01 00:00:00').format('X'),
	moment.utc('2018-04-30 00:00:00').format('X')
];
let dateContractAddress = '0xe5c3430f7cef5FC65391a5006BA17cE325e8b425';
let TokenInstance;
module.exports = async (deployer, network, accounts) => {
	if(network == 'development') {
		await deployer.deploy(DateContract);
		dateContractAddress = DateContract.address;
	}
	
	deployer.then(async () => {
		await deployer.deploy(SafeMath);
		deployer.link(SafeMath, ERC20Token);
		
		return ERC20Token.new(secondStage[1], accounts[0], dateContractAddress);
	}).then(instance => {
		TokenInstance = instance;
		return Crowdsale.new(TokenInstance.address, firstStage[0], firstStage[1], secondStage[0], secondStage[1], 200000);
	}).then(CrowdsaleInstance => {
		return TokenInstance.changeOwner(CrowdsaleInstance.address);
	}).catch(e => {
		console.log(e);
	});
};

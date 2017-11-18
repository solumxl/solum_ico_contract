const ERC20Token = artifacts.require("./SolumToken.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");
const SafeMath = artifacts.require("./SafeMath.sol");
const DateContract = artifacts.require("./Date.sol");

// let defrostDate = parseInt(new Date().getTime() / 1000) + 5;
let defrostDate = 1514764800;
module.exports = async (deployer) => {
	deployer.deploy(SafeMath);
	deployer.link(SafeMath, ERC20Token);
	
	await deployer.deploy(DateContract);
	await deployer.deploy(ERC20Token, defrostDate, '0x25872aa16318128186fa1cbd775cfee11166e3f9', DateContract.address);
	await deployer.deploy(Crowdsale, ERC20Token.address, 1509699055, 1512291055, 1513764800, defrostDate, 200000);
};

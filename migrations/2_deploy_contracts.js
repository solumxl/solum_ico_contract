const ERC20Token = artifacts.require("./SolumToken.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");
const SafeMath = artifacts.require("./SafeMath.sol");

// let defrostDate = parseInt(new Date().getTime() / 1000) + 5;
let defrostDate = 1514764800;
module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, ERC20Token);
  deployer.deploy(ERC20Token, defrostDate).then(function() {
	  return deployer.deploy(Crowdsale, ERC20Token.address, 1509699055, 1512291055, 1513764800, defrostDate, 200000);
  });
};

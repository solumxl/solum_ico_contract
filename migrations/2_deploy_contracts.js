const ERC20Token = artifacts.require("./SolumToken.sol");
const SafeMath = artifacts.require("./SafeMath.sol");

let defrostDate = parseInt(new Date().getTime() / 1000) + 5;

module.exports = function(deployer) {
  deployer.deploy(SafeMath);
  deployer.link(SafeMath, ERC20Token);
  deployer.deploy(ERC20Token, defrostDate);
};

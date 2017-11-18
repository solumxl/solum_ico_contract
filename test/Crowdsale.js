'use strict';

const SolumToken = artifacts.require("./SolumToken.sol");
const Crowdsale = artifacts.require("./Crowdsale.sol");
const DateContract = artifacts.require("./Date.sol");
const Helper = artifacts.require("./Helper.sol");
const assertJump = require('./helpers/assertJump');
const web3 = new (require('web3'))();
const BigNumber = require('bignumber.js');

let waitUntil = time => {
	return new Promise(resolve => {
		let left = time - new Date().getTime() / 1000;
		if(left < 0)
			return resolve();
		setTimeout(resolve, Math.ceil(left) * 1000);
	});
};
let wait = ms => new Promise(resolve => setTimeout(resolve, ms));

let randomInteger = (min, max) => {
	let rand = min + Math.random() * (max - min);
	rand = Math.round(rand);
	return rand;
};

let getTime = (offset) => {
	return parseInt(new Date().getTime() / 1000 + offset);
};

const stageGoal = 264000000000000000000000000;
const totalMaxSupply = 800000000000000000000000000;
const gasPrice = 100000000000;
const goal = 1000;

contract('Crowdsale', function(accounts) {
	const ownerAccount = accounts[0];
	
	let SolumTokenInstance;
	let CrowdsaleInstance = {
		delegate: () => {},
		changeDelegate: (newDelegate) => {},
		stageOneDates: (i) => {},
		stageTwoDates: (i) => {},
		price: () => {},
		tokenTotalSupply: () => {},
		customPayment: (_beneficiary, _value) => {},
		changeSecondStageGoal: (_ethAmount) => {},
		withdrawFunds: () => {},
		withdrawRemainingTokens: () => {},
		stageSaleAmount: () => {}
	};
	
	let deployContracts = async (startFirst, endFirst, startSecond, endSecond, goal, transferRights = true) => {
		await DateContract.new();
		SolumTokenInstance = await SolumToken.new(getTime(), ownerAccount, DateContract.address);
		CrowdsaleInstance = await Crowdsale.new(SolumTokenInstance.address, startFirst, endFirst, startSecond, endSecond, goal);
		if(transferRights) {
			await SolumTokenInstance.changeOwner(CrowdsaleInstance.address, {from: ownerAccount});
		}
	};

	describe("crowdsale parameters:", () => {
		it("should be equal date params with specified", async () => {
			let startFirst = getTime(10);
			let endFirst = getTime(20);
			let startSecond = getTime(30);
			let endSecond = getTime(40);

			await deployContracts(startFirst, endFirst, startSecond, endSecond, 1000);
			assert.equal((await CrowdsaleInstance.stageOneDates.call(0)).valueOf(), startFirst, "Invalid first stage start date");
			assert.equal((await CrowdsaleInstance.stageOneDates.call(1)).valueOf(), endFirst, "Invalid first stage end date");
			assert.equal((await CrowdsaleInstance.stageTwoDates.call(0)).valueOf(), startSecond, "Invalid second stage start date");
			assert.equal((await CrowdsaleInstance.stageTwoDates.call(1)).valueOf(), endSecond, "Invalid second stage end date");
		});

		it("tokenTotalSupply and stageSaleAmount should be equal with specified", async () => {
			await deployContracts(getTime(), getTime(), getTime(), getTime(), 1000);
			assert.equal((await CrowdsaleInstance.tokenTotalSupply.call()).valueOf(), totalMaxSupply, "Invalid tokenTotalSupply");
		});

		it("price should be equal with specified", async () => {
			await deployContracts(getTime(), getTime(), getTime(), getTime(), goal);
			assert.equal((await CrowdsaleInstance.price.call()).valueOf(), stageGoal / web3.toWei(goal), "Invalid price");
		});
	});

	describe("changeDelegate()", () => {
		it("should change delegate", async () => {
			await deployContracts(getTime(), getTime(), getTime(), getTime(), 1000);
			assert.equal((await CrowdsaleInstance.delegate.call()).valueOf(), ownerAccount, "Delegate not contract creator");
			await CrowdsaleInstance.changeDelegate(accounts[1]);
			assert.equal((await CrowdsaleInstance.delegate.call()).valueOf(), accounts[1], "Invalid delegate after change");
		});
	});

	describe("payments", () => {
		it("should forbid if start first stage date has not come", async () => {
			await deployContracts(getTime(10), getTime(20), getTime(30), getTime(40), 1000);

			try {
				await CrowdsaleInstance.send(web3.toWei(1, "ether"));
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should allow if start first stage date has come", async () => {
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), 1000);
			await CrowdsaleInstance.send(web3.toWei(1, "ether"));
		});

		it("should forbid if start second stage date has not come, but first ended", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(30), getTime(40), 1000);

			try {
				await CrowdsaleInstance.send(web3.toWei(1, "ether"));
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should allow if start second stage date has come", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(40), 1000);
			await CrowdsaleInstance.send(web3.toWei(1, "ether"));
		});

		it("should correct mint tokens", async () => {
			const goal = 1000;
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			await CrowdsaleInstance.send(web3.toWei(1, "ether"), {
				from: ownerAccount
			});
			let shouldReceive = new BigNumber(stageGoal).div(goal);
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).toNumber(), shouldReceive, "Invalid balance after mint");
		});

		it("should correct mint tokens after double payment", async () => {
			const goal = 1000;
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			await CrowdsaleInstance.send(web3.toWei(1, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.send(web3.toWei(1, "ether"), {from: ownerAccount});
			let shouldReceive = new BigNumber(stageGoal).div(goal).mul(2);
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).toNumber(), shouldReceive, "Invalid balance after mint");
		});

		it("should resend change (goal reached)", async () => {
			const goal = 10;
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			let HelperInstance = await Helper.new();
			let accountBalance = new BigNumber(await HelperInstance.getBalance.call({from: ownerAccount}));
			let result = await CrowdsaleInstance.send(web3.toWei(9, "ether"), {from: ownerAccount});
			accountBalance = accountBalance.minus(gasPrice * result.receipt.gasUsed);
			result = await CrowdsaleInstance.send(web3.toWei(2, "ether"), {from: ownerAccount});
			accountBalance = accountBalance.minus(gasPrice * result.receipt.gasUsed);
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).toNumber(), stageGoal, "Invalid token balance after mint");
			assert.equal((await HelperInstance.getBalance.call({from: ownerAccount})).toNumber(), accountBalance.sub(web3.toWei(10, "ether")).toNumber(), "Invalid balance after mint");
		});

		it("should forbid transfer (goal reached)", async () => {
			const goal = 10;
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			await CrowdsaleInstance.send(web3.toWei(20, "ether"), {from: ownerAccount});
			try {
				await CrowdsaleInstance.send(web3.toWei(2, "ether"), {from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});
	});

	describe("customPayment()", () => {
		it("should forbid if called not delegate", async () => {
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			try {
				await CrowdsaleInstance.customPayment(accounts[0], web3.toWei(2, "ether"), {from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct mint", async () => {
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			await CrowdsaleInstance.customPayment(accounts[1], web3.toWei(goal / 2, "ether"), {from: ownerAccount});
			assert.equal((await SolumTokenInstance.balanceOf.call(accounts[1])).toNumber(), new BigNumber(stageGoal).div(2).toNumber(), "Invalid token balance after mint");
		});
	});

	describe("withdrawFunds()", () => {
		it("should forbid if now first stage", async () => {
			await deployContracts(getTime(-10), getTime(20), getTime(30), getTime(40), goal);
			try {
				await CrowdsaleInstance.withdrawFunds({from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should forbid if now second stage", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(40), goal);
			try {
				await CrowdsaleInstance.withdrawFunds({from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should forbid if called from not-owner account", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(-2), goal);
			try {
				await CrowdsaleInstance.withdrawFunds({from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct withdraw", async () => {
			let HelperInstance = await Helper.new();
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(2), goal);
			await CrowdsaleInstance.send(web3.toWei(5, "ether"), {from: ownerAccount});

			let accountBalance = new BigNumber(await HelperInstance.getBalance.call({from: ownerAccount}));
			await wait(2000);

			let result = await CrowdsaleInstance.withdrawFunds({from: ownerAccount});
			accountBalance = accountBalance.minus(gasPrice * result.receipt.gasUsed);

			assert.equal((await HelperInstance.getBalance.call({from: ownerAccount})).toNumber(), accountBalance.add(web3.toWei(5, "ether")).toNumber(), "Invalid balance after withdraw");
		});

		it("should correct if balance 0", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(-2), goal);
			await CrowdsaleInstance.withdrawFunds({from: ownerAccount});
		});
	});

	describe("withdrawRemainingTokens()", () => {
		it("should forbid if stage 2 not ended", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(2), goal);
			await CrowdsaleInstance.send(web3.toWei(goal / 4, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(accounts[1], web3.toWei(goal / 4, "ether"), {from: ownerAccount});
			try {
				await CrowdsaleInstance.withdrawRemainingTokens({from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct withdraw", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(2), goal);
			await CrowdsaleInstance.send(web3.toWei(goal / 4, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(accounts[1], web3.toWei(goal / 4, "ether"), {from: ownerAccount});
			await wait(2000);

			await CrowdsaleInstance.withdrawRemainingTokens({from: ownerAccount});
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).toNumber(), new BigNumber(totalMaxSupply).minus(new BigNumber(stageGoal).mul(0.25)).toNumber(), "Invalid token balance after withdraw");
		});
	});

	describe("changeSecondStageGoal()", () => {
		it("should forbid if stage 1 not ended", async () => {
			await deployContracts(getTime(-20), getTime(10), getTime(15), getTime(20), goal);
			try {
				await CrowdsaleInstance.changeSecondStageGoal(goal * 2, {from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should forbid if stage 2 is started", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-5), getTime(20), goal);
			try {
				await CrowdsaleInstance.changeSecondStageGoal(goal * 2, {from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should forbid if called from not-owner", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(5), getTime(20), goal);
			try {
				await CrowdsaleInstance.changeSecondStageGoal(goal * 2, {from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct change", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(2), getTime(20), goal);
			await CrowdsaleInstance.changeSecondStageGoal(goal * 2, {from: ownerAccount});
			assert.equal((await CrowdsaleInstance.price.call()).valueOf(), stageGoal / web3.toWei(goal) / 2, "Invalid price");
		});
	});

	describe("halt() and unhalt()", () => {

		it("should forbid halt if called from not-owner", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			try {
				await CrowdsaleInstance.halt({from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct halt", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.halt({from: ownerAccount});
			try {
				await CrowdsaleInstance.send(web3.toWei(1, "ether"), {from: ownerAccount});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should forbid unhalt if called from not-owner", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.halt({from: ownerAccount});
			try {
				await CrowdsaleInstance.unhalt({from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct unhalt", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.halt({from: ownerAccount});
			await CrowdsaleInstance.unhalt({from: ownerAccount});
			await CrowdsaleInstance.send(web3.toWei(1, "ether"), {from: ownerAccount});
		});
	});

	describe("balanceOf() and countInvestors()", () => {
		it("should correct added", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.send(web3.toWei(10, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(ownerAccount, web3.toWei(10, "ether"), {from: ownerAccount});
			let balance = (await CrowdsaleInstance.balanceOf.call(ownerAccount)).toNumber();
			assert.equal(balance, web3.toWei(20, 'ether'));
		});

		it("should correct increment countInvestors", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.send(web3.toWei(10, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(accounts[1], web3.toWei(10, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(accounts[2], web3.toWei(10, "ether"), {from: ownerAccount});
			await CrowdsaleInstance.customPayment(accounts[2], web3.toWei(10, "ether"), {from: ownerAccount});
			let count = (await CrowdsaleInstance.countInvestors.call()).toNumber();
			assert.equal(count, 3);
		});
	});
	
	describe("changeTokenOwner()", () => {
		it("should forbid if not owner", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			try {
				await CrowdsaleInstance.changeTokenOwner(ownerAccount, {from: accounts[3]});
				assert.fail('The transaction must not pass');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should correct change owner", async () => {
			await deployContracts(getTime(-20), getTime(-10), getTime(-2), getTime(20), goal);
			await CrowdsaleInstance.changeTokenOwner(ownerAccount, {from: ownerAccount});
			assert.equal((await SolumTokenInstance.owner.call()).valueOf(), ownerAccount);
		});
	});
});

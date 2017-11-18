'use strict';

const SolumToken = artifacts.require("./SolumToken.sol");
const DateContract = artifacts.require("./Date.sol");
const assertJump = require('./helpers/assertJump');
const BigNumber = require('bignumber.js');
const moment = require('moment');
const web3 = require('web3');

let wait = ms => new Promise(resolve => setTimeout(resolve, ms));
let waitUntil = time => {
	return new Promise(resolve => {
		let left = time - new Date().getTime() / 1000;
		if(left < 0)
			return resolve();
		setTimeout(resolve, Math.ceil(left) * 1000);
	});
};
let randomInteger = (min, max) => {
	let rand = min + Math.random() * (max - min);
	rand = Math.round(rand);
	return rand;
};

// correct this for eth-net. 2 sec delay actual only for testRPC
const defrostDelaySec = 2;
let defrostDate = parseInt(new Date().getTime() / 1000);
let currentDate = parseInt(new Date().getTime() / 1000);
contract('SolumToken', function(accounts) {
	const ownerAccount = accounts[0];
	const founderAccount = accounts[5];
	const feePercent = 0.05;
	const decimals = 18;

	let SolumTokenInstance = {
		// only for ide tips
		mintToken: (_to, _value) => {},
		balanceOf: (_owner) => {},
		transferFrom: (_from, _to, _value) => {},
		approve: (_spender, _value) => {},
		allowance: (_owner, _spender) => {}
	};
	let DateContractInstance = {};

	let deploy = async function(_defrostDate = defrostDate, _founderAccount = founderAccount) {
		SolumTokenInstance = await SolumToken.new(_defrostDate, _founderAccount, DateContract.address);
		await SolumTokenInstance.setBlockTime(currentDate);
	};

	before(async () => {
		DateContractInstance = await DateContract.new();
	});

	beforeEach(() => deploy());
	
	// it("test gas", async function() {
	//
	// 	let amount = new BigNumber(10).pow(decimals).mul(100000000).mul(2);
	// 	await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 	await SolumTokenInstance.transfer(accounts[1], amount.div(4), {from: ownerAccount});
	// 	let result = await SolumTokenInstance.transfer.estimateGas(accounts[1], amount.div(4), {from: ownerAccount});
	// });

	// it("name should be Solum", async function() {
	// 	let name = await SolumTokenInstance.name.call();
	// 	assert.equal(name.valueOf(), "Solum", "Name not Solum");
	// });
	//
	// it("decimals should be 18", async function() {
	// 	let decimals = await SolumTokenInstance.decimals.call();
	// 	assert.equal(decimals.valueOf(), decimals, "Decimals not " + decimals);
	// });
	//
	// it("should mint token correctly but not send (before defrost)", async function() {
	// 	let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
	// 	await deploy(defrostDate, founderAccount);
	//
	// 	const firstAccount = accounts[0],
	// 		testAccount = accounts[3],
	// 		amount = 1000;
	//
	// 	let balance = await SolumTokenInstance.balanceOf.call(testAccount);
	// 	assert.equal(balance.valueOf(), 0, "Test account balance not zero after deploy");
	//
	// 	await SolumTokenInstance.mintToken(testAccount, amount, {from: firstAccount});
	// 	defrostDate = parseInt((await SolumTokenInstance.defrostDate.call()).valueOf());
	// 	assert.isTrue(defrostDate > parseInt(new Date().getTime() / 1000), 'Defrost time has come');
	//
	// 	balance = await SolumTokenInstance.balanceOf.call(testAccount);
	// 	assert.equal(balance.valueOf(), 0, "Test account balance not zero before defrost time has not come");
	//
	// 	try {
	// 		await SolumTokenInstance.transfer(firstAccount, amount, {from: testAccount});
	// 		assert.fail('The transaction must not pass before defrost time has not come');
	// 	} catch(error) {
	// 		assertJump(error);
	// 	}
	// });
	//
	// it("should be a balance and transfer available after defrost", async function() {
	// 	const firstAccount = accounts[0],
	// 		testAccount = accounts[3],
	// 		amount = 1000;
	//
	// 	let defrostDate = (await SolumTokenInstance.defrostDate.call()).toNumber();
	// 	await SolumTokenInstance.setBlockTime(defrostDate + 1);
	// 	await SolumTokenInstance.mintToken(testAccount, amount, {from: firstAccount});
	// 	await SolumTokenInstance.transfer(firstAccount, 1, {from: testAccount});
	// 	let balance = await SolumTokenInstance.balanceOf.call(testAccount);
	// 	assert.equal(balance.valueOf(), amount - 1, "Invalid test account balance after defrost time has not come");
	// });
	//
	// describe('mintToken()', function() {
	// 	it("should not mint token (mint from not owner)", async function() {
	// 		const testAccount = accounts[4];
	// 		const amount = 1000;
	//
	// 		try {
	// 			await SolumTokenInstance.mintToken(testAccount, amount, {from: testAccount});
	// 			assert.fail('Not owner account minted tokens');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should correct mint", async function() {
	// 		const amount = 1000;
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), amount, "Invalid balance after mint");
	// 	});
	// });
	//
	// describe('fee', function() {
	// 	const amount = 1000;
	//
	// 	it("should forbid if not enough founds for pay fee", async function() {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		try {
	// 			await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	// 			assert.fail('Should trhow');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should correct pay fee", async function() {
	// 		const amount = 1000;
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount * 2, {from: ownerAccount});
	// 		let result = await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), amount - amount * feePercent, "Invalid balance after transfer");
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(founderAccount)).valueOf(), amount * feePercent / 2, "Invalid founder balance after transfer");
	// 		assert.equal((await SolumTokenInstance.feePool.call(result.logs[1]['args']['_month'].toNumber())).toNumber(), amount * feePercent / 2, "Invalid amount on fee pool");
	// 	});
	//
	// 	it("correct distribution of the commission by months", async () => {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount * 5, {from: ownerAccount});
	// 		let resultFirst = await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	// 		let resultSecond = await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	// 		await SolumTokenInstance.setBlockTime(defrostDate + 30 * 24 * 60 * 60);
	// 		let resultThird = await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	// 		let resultFourth = await SolumTokenInstance.transfer(accounts[1], amount, {from: ownerAccount});
	//
	// 		let logsKeys = [
	// 			resultFirst.logs[1]['args']['_month'].toNumber(),
	// 			resultSecond.logs[1]['args']['_month'].toNumber(),
	// 			resultThird.logs[1]['args']['_month'].toNumber(),
	// 			resultFourth.logs[1]['args']['_month'].toNumber()
	// 		];
	// 		assert.equal(logsKeys[0], logsKeys[1], "Keys not equal");
	// 		assert.equal(logsKeys[2], logsKeys[3], "Keys not equal");
	// 		assert.notEqual(logsKeys[1], logsKeys[2], "Keys equal");
	// 		assert.equal((await SolumTokenInstance.feePool.call(logsKeys[0])), amount * feePercent, "Invalid fee amount");
	// 		assert.equal((await SolumTokenInstance.feePool.call(logsKeys[2])), amount * feePercent, "Invalid fee amount");
	// 	});
	// });
	//
	// describe('balanceOf()', function() {
	// 	const amount = 1000;
	//
	// 	it("should be 0", async function() {
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), 0, "Invalid balance before mint");
	// 	});
	//
	// 	it("should be 0 if frozen", async function() {
	// 		let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
	// 		await deploy(defrostDate, founderAccount);
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), 0, "Invalid balance before defrost");
	// 	});
	// });
	//
	// describe('totalSupply()', function() {
	// 	it("should be 0", async function() {
	// 		assert.equal((await SolumTokenInstance.totalSupply.call()).valueOf(), 0, "Invalid total supply");
	// 	});
	//
	// 	it("should equal total supply and sum all accounts balances", async function() {
	// 		await SolumTokenInstance.mintToken(accounts[0], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
	// 		await SolumTokenInstance.mintToken(accounts[1], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
	// 		await SolumTokenInstance.mintToken(accounts[2], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
	// 		let result = (await SolumTokenInstance.transfer(accounts[2], 23000, {from: accounts[0]}));
	//
	// 		let sum = (await SolumTokenInstance.feePool.call(result.logs[1]['args']['_month'].toNumber()));
	// 		accounts.forEach(async account => {
	// 			let balance = await SolumTokenInstance.balanceOf.call(account);
	// 			sum = new BigNumber(balance.valueOf()).plus(sum);
	// 		});
	// 		assert.equal((await SolumTokenInstance.totalSupply.call()).valueOf(), sum.valueOf(), "Invalid total supply");
	// 	});
	// });
	//
	// describe('approve() and allowance()', function() {
	// 	const spenderAccount = accounts[3];
	// 	const amount = 1000;
	//
	// 	it("should be 0", async function() {
	// 		assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), 0, "Invalid allowance before allow");
	// 	});
	//
	// 	it("should be correct approve", async function() {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), amount, "Invalid allowance after allow");
	// 	});
	//
	// 	it("should be forbid approve if allowance not 0", async function() {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	//
	// 		try {
	// 			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 			assert.fail('User not should approve if allowance not 0');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should be correct approve after clear allowance", async function() {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, 0, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 	});
	// });
	//
	// describe('transferFrom()', function() {
	//
	// 	const spenderAccount = accounts[3];
	// 	const receiveAccount = accounts[4];
	// 	const amount = 1000;
	//
	// 	it("should forbid transferFrom if frozen", async function() {
	// 		let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
	// 		// for test frozed create local instance
	// 		await deploy(defrostDate, founderAccount);
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 		try {
	// 			await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
	// 			assert.fail('User not should approve if defrost time has not come');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should forbid transferFrom if allowance is 0", async function() {
	// 		try {
	// 			await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
	// 			assert.fail('User not should approve if allowed not zero');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should forbid transferFrom if there is not enough balance", async function() {
	// 		await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
	// 		try {
	// 			await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
	// 			assert.fail('User not should approve if approver balance 0');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should correct transfer", async function() {
	// 		await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(spenderAccount, amount / 2, {from: ownerAccount});
	// 		let result = (await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount / 4, {from: spenderAccount}));
	// 		let fee = (await SolumTokenInstance.feePool.call(result.logs[1]['args']['_month'].toNumber()));
	// 		assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), amount / 4, "Invalid allowance after transfer");
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), new BigNumber(amount * 3 / 4).minus(fee.mul(2)).toNumber(), "Invalid owner balance after transfer");
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(receiveAccount)).valueOf(), amount / 4, "Invalid receiver balance after transfer");
	// 		assert.equal((await SolumTokenInstance.balanceOf.call(spenderAccount)).valueOf(), 0, "Invalid spender balance after transfer");
	// 	});
	// });
	//
	// describe('changeOwner()', function() {
	// 	it("should be changed owner", async function() {
	// 		await SolumTokenInstance.changeOwner(accounts[1]);
	// 		assert.equal((await SolumTokenInstance.owner.call()).valueOf(), accounts[1], "Invalid owner after change");
	// 	});
	// });
	//
	// describe('changeTransfersStatus()', function() {
	// 	it("should be forbid change from not owner", async function() {
	// 		try {
	// 			await SolumTokenInstance.changeTransfersStatus(true, {from: accounts[4]});
	// 			assert.fail('show throw');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 	});
	//
	// 	it("should be success disable and allow transfer from owner", async () => {
	// 		assert.equal((await SolumTokenInstance.transfersEnabled.call()).valueOf(), true, "Transfers disabled after deploy");
	// 		await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.transfersEnabled.call()).valueOf(), false, "Transfers enabled after disable");
	// 		await SolumTokenInstance.changeTransfersStatus(false, {from: ownerAccount});
	// 		assert.equal((await SolumTokenInstance.transfersEnabled.call()).valueOf(), true, "Transfers disabled after enable");
	// 	});
	//
	// 	it("should be forbid transfer()", async () => {
	// 		await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
	// 		await SolumTokenInstance.mintToken(ownerAccount, 1000, {from: ownerAccount});
	// 		try {
	// 			await SolumTokenInstance.transfer(accounts[1], 100, {from: ownerAccount});
	// 			assert.fail('show throw');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 		await SolumTokenInstance.changeTransfersStatus(false, {from: ownerAccount});
	// 		await SolumTokenInstance.transfer(accounts[1], 100, {from: ownerAccount});
	// 	});
	//
	// 	it("should be forbid transferFrom()", async () => {
	// 		await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
	// 		await SolumTokenInstance.mintToken(ownerAccount, 1000, {from: ownerAccount});
	// 		await SolumTokenInstance.approve(accounts[3], 100, {from: ownerAccount});
	// 		try {
	// 			await SolumTokenInstance.transferFrom(ownerAccount, accounts[1], 100, {from: accounts[3]});
	// 			assert.fail('show throw');
	// 		} catch(error) {
	// 			assertJump(error);
	// 		}
	// 		await SolumTokenInstance.changeTransfersStatus(false, {from: ownerAccount});
	// 		await SolumTokenInstance.transferFrom(ownerAccount, accounts[1], 100, {from: accounts[3]});
	// 	});
	// });

	describe('sendDividends()', function() {
		let amount = new BigNumber(10).pow(decimals).mul(200000).mul(2);
		
		it("should forbid if current month", async function() {
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.transfer(accounts[1], amount.div(2), {from: ownerAccount});
			await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
			try {
				await SolumTokenInstance.sendDividends(100, moment().format('YYYY'), moment().format('M'), {from: ownerAccount});
				assert.fail('Should throw');
			} catch(error) {
				assertJump(error);
			}
		});

		it("should correct send dividend", async function() {
			let sendAmount = amount.div(2);
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.transfer(accounts[1], sendAmount, {from: ownerAccount});
			await SolumTokenInstance.setBlockTime(moment().add(1, 'month').format('X'));
			await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
			await SolumTokenInstance.sendDividends(100, moment().format('YYYY'), moment().format('M'), {from: ownerAccount});
			let balance = (await SolumTokenInstance.balanceOf.call(accounts[1])).toNumber();
			let expectedBalance = sendAmount.add(sendAmount.mul(feePercent / 4)).toNumber();
			assert.equal(balance, expectedBalance, "Invalid receiver balance after send dividends");
		});

		it("should not send if balance less than 100 000 tokens", async function() {
			let sendAmount = amount.div(2);
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.transfer(accounts[1], sendAmount, {from: ownerAccount});
			await SolumTokenInstance.setBlockTime(moment().add(1, 'month').format('X'));
			await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
			await SolumTokenInstance.sendDividends(100, moment().format('YYYY'), moment().format('M'), {from: ownerAccount});
			let balance = (await SolumTokenInstance.balanceOf.call(ownerAccount)).toNumber();
			
			let expectedBalance = sendAmount.minus(sendAmount.mul(feePercent)).toNumber();
			assert.equal(balance, expectedBalance, "Invalid sender balance after send dividends");
		});

		it("should correct transfer residue", async function() {
			let sendAmount = amount.div(2);
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.transfer(accounts[1], sendAmount, {from: ownerAccount});
			await SolumTokenInstance.setBlockTime(moment().add(1, 'month').format('X'));
			await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
			await SolumTokenInstance.sendDividends(100, moment().format('YYYY'), moment().format('M'), {from: ownerAccount});
			await SolumTokenInstance.changeTransfersStatus(false, {from: ownerAccount});
			let result = await SolumTokenInstance.transfer(accounts[1], sendAmount.div(2), {from: ownerAccount});
			let key = result.logs[1]['args']['_month'].toNumber();
			let residue = (await SolumTokenInstance.feePool.call(key)).toNumber();
			let expectedResidue = sendAmount.mul(feePercent / 4).plus(sendAmount.div(2).mul(feePercent / 2)).toNumber();
			assert.equal(residue, expectedResidue, "Invalid  correct transfer residue");
		});
		
		let mint30 = async () => {
			let list = [];
			// 1 - 15 - 10 000 tokens
			// 16 - 25 - 100 000 tokens
			// 26 - 30 - 150 000 tokens
			for(let i = 1; i <= 30; i++) {
				let address = i.toString(16);
				while(address.length < 40)
					address = '0' + address;
				address = '0x' + address;
				
				let mintAmount = new BigNumber(10).pow(decimals).mul(10000);
				if(i > 15 && i <= 25) {
					mintAmount = mintAmount.mul(10);
				} else if (i > 25) {
					mintAmount = mintAmount.mul(15);
				}
				
				list.push(SolumTokenInstance.mintToken(address, mintAmount, {from: ownerAccount}));
			}
			await Promise.all(list);
		};
		
		it("should correct work with several iterations", async () => {
			let amount = web3.toWei(50);
			const totalSupply = amount.mul(4).plus(web3.toWei(10000).mull(15)).plus(web3.toWei(100000).mull(10)).plus(web3.toWei(150000).mull(10));
			
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.mintToken(accounts[1], amount, {from: ownerAccount});
			await SolumTokenInstance.mintToken(accounts[2], amount, {from: ownerAccount});
			await SolumTokenInstance.mintToken(accounts[3], amount, {from: ownerAccount});
			await mint30();
			
			const sendAmount = web3.toWei(5);
			await SolumTokenInstance.transfer(accounts[1], sendAmount, {from: ownerAccount});
			await SolumTokenInstance.transfer(accounts[2], sendAmount, {from: accounts[1]});
			await SolumTokenInstance.transfer(accounts[3], sendAmount, {from: accounts[2]});
			await SolumTokenInstance.transfer(accounts[4], sendAmount, {from: accounts[3]});
			
			const expectedFeeAmount = web3.toWei(5);
			await SolumTokenInstance.setBlockTime(moment().add(1, 'month').format('X'));
			await SolumTokenInstance.changeTransfersStatus(true, {from: ownerAccount});
			await SolumTokenInstance.sendDividends(100, moment().format('YYYY'), moment().format('M'), {from: ownerAccount});
			// добавить несколько итераций
			// проверку на наличие ивента о завершении
			// проверить балансы всех аккаунтов
		});
		
		// добавить проверку на возможность начилять дивиденды за несколько месяцев
	});
});

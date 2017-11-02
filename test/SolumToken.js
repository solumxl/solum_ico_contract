'use strict';

const SolumToken = artifacts.require("./SolumToken.sol");
const assertJump = require('./helpers/assertJump');
const BigNumber = require('bignumber.js');

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

contract('SolumToken', function(accounts) {
	const ownerAccount = accounts[0];
	
	let SolumTokenInstance = {
		// only for ide tips
		mintToken: (_to, _value) => {},
		balanceOf: (_owner) => {},
		transferFrom: (_from, _to, _value) => {},
		approve: (_spender, _value) => {},
		allowance: (_owner, _spender) => {}
	};
	
	beforeEach(async function() {
		SolumTokenInstance = await SolumToken.new(defrostDate);
	});
	
	it("name should be Solum", async function() {
		let name = await SolumTokenInstance.name.call();
		assert.equal(name.valueOf(), "Solum", "Name not Solum");
	});
	
	it("decimals should be 18", async function() {
		let decimals = await SolumTokenInstance.decimals.call();
		assert.equal(decimals.valueOf(), 18, "Decimals not 18");
	});
	
	it("should mint token correctly but not send (before defrost)", async function() {
		let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
		SolumTokenInstance = await SolumToken.new(defrostDate);
		
		const firstAccount = accounts[0],
			testAccount = accounts[3],
			amount = 1000;
		
		let balance = await SolumTokenInstance.balanceOf.call(testAccount);
		assert.equal(balance.valueOf(), 0, "Test account balance not zero after deploy");
		
		await SolumTokenInstance.mintToken(testAccount, amount, {from: firstAccount});
		defrostDate = parseInt((await SolumTokenInstance.defrostDate.call()).valueOf());
		assert.isTrue(defrostDate > parseInt(new Date().getTime() / 1000), 'Defrost time has come');
		
		balance = await SolumTokenInstance.balanceOf.call(testAccount);
		assert.equal(balance.valueOf(), 0, "Test account balance not zero before defrost time has not come");
		
		try {
			await SolumTokenInstance.transfer(firstAccount, amount, {from: testAccount});
			assert.fail('The transaction must not pass before defrost time has not come');
		} catch(error) {
			assertJump(error);
		}
	});
	
	it("should be a balance and transfer available after defrost", async function() {
		const firstAccount = accounts[0],
			testAccount = accounts[3],
			amount = 1000;
		
		let defrostDate = parseInt((await SolumTokenInstance.defrostDate.call()).valueOf());
		await waitUntil(defrostDate);
		assert.isTrue(defrostDate <= parseInt(new Date().getTime() / 1000), 'Defrost time has not come');
		
		await SolumTokenInstance.mintToken(testAccount, amount, {from: firstAccount});
		await SolumTokenInstance.transfer(firstAccount, 1, {from: testAccount});
		
		let balance = await SolumTokenInstance.balanceOf.call(testAccount);
		assert.equal(balance.valueOf(), amount - 1, "Invalid test account balance after defrost time has not come");
	});
	
	////////////////////////////////
	/// DEFROST TIME HAS COME!!! ///
	////////////////////////////////
	
	describe('transfer()', function() {
		it("should not mint token (mint from not owner)", async function() {
			const testAccount = accounts[4];
			const amount = 1000;
			
			try {
				await SolumTokenInstance.mintToken(testAccount, amount, {from: testAccount});
				assert.fail('Not owner account minted tokens');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should correct mint", async function() {
			const amount = 1000;
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), amount, "Invalid balance after mint");
		});
	});
	
	describe('mintToken()', function() {
		it("should not mint token (mint from not owner)", async function() {
			const testAccount = accounts[4];
			const amount = 1000;
			
			try {
				await SolumTokenInstance.mintToken(testAccount, amount, {from: testAccount});
				assert.fail('Not owner account minted tokens');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should correct mint", async function() {
			const amount = 1000;
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), amount, "Invalid balance after mint");
		});
	});
	
	describe('balanceOf()', function() {
		const amount = 1000;
		
		it("should be 0", async function() {
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), 0, "Invalid balance before mint");
		});
		
		it("should be 0 if frozen", async function() {
			let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
			let SolumTokenInstance = await SolumToken.new(defrostDate);
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), 0, "Invalid balance before defrost");
		});
	});
	
	describe('totalSupply()', function() {
		it("should be 0", async function() {
			assert.equal((await SolumTokenInstance.totalSupply.call()).valueOf(), 0, "Invalid total supply");
		});
		
		it("should equal total supply and sum all accounts balances", async function() {
			await SolumTokenInstance.mintToken(accounts[0], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
			await SolumTokenInstance.mintToken(accounts[1], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
			await SolumTokenInstance.mintToken(accounts[2], randomInteger(23000, 10000000000000000000000), {from: accounts[0]});
			await SolumTokenInstance.transfer(accounts[2], 23000, {from: accounts[0]});
			
			let sum = 0;
			accounts.forEach(async account => {
				let balance = await SolumTokenInstance.balanceOf.call(account);
				sum = new BigNumber(balance.valueOf()).plus(sum);
			});
			assert.equal((await SolumTokenInstance.totalSupply.call()).valueOf(), sum.valueOf(), "Invalid total supply");
		});
	});
	
	describe('approve() and allowance()', function() {
		const spenderAccount = accounts[3];
		const amount = 1000;
		
		it("should be 0", async function() {
			assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), 0, "Invalid allowance before allow");
		});
		
		it("should be correct approve", async function() {
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
			assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), amount, "Invalid allowance after allow");
		});
		
		it("should be forbid approve if allowance not 0", async function() {
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
			
			try {
				await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
				assert.fail('User not should approve if allowance not 0');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should be correct approve after clear allowance", async function() {
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, 0, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
		});
	});
	
	describe('transferFrom()', function() {
		
		const spenderAccount = accounts[3];
		const receiveAccount = accounts[4];
		const amount = 1000;
		
		it("should forbid transferFrom if frozen", async function() {
			let defrostDate = parseInt(new Date().getTime() / 1000) + defrostDelaySec;
			// for test frozed create local instance
			let SolumTokenInstance = await SolumToken.new(defrostDate);
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
			try {
				await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
				assert.fail('User not should approve if defrost time has not come');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should forbid transferFrom if allowance is 0", async function() {
			try {
				await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
				assert.fail('User not should approve if allowed not zero');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should forbid transferFrom if there is not enough balance", async function() {
			await SolumTokenInstance.approve(spenderAccount, amount, {from: ownerAccount});
			try {
				await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount, {from: spenderAccount});
				assert.fail('User not should approve if approver balance 0');
			} catch(error) {
				assertJump(error);
			}
		});
		
		it("should correct transfer", async function() {
			await SolumTokenInstance.mintToken(ownerAccount, amount, {from: ownerAccount});
			await SolumTokenInstance.approve(spenderAccount, amount / 2, {from: ownerAccount});
			await SolumTokenInstance.transferFrom(ownerAccount, receiveAccount, amount / 4, {from: spenderAccount});
			assert.equal((await SolumTokenInstance.allowance.call(ownerAccount, spenderAccount)).valueOf(), amount / 4, "Invalid allowance after transfer");
			assert.equal((await SolumTokenInstance.balanceOf.call(ownerAccount)).valueOf(), amount * 3 / 4, "Invalid owner balance after transfer");
			assert.equal((await SolumTokenInstance.balanceOf.call(receiveAccount)).valueOf(), amount / 4, "Invalid receiver balance after transfer");
			assert.equal((await SolumTokenInstance.balanceOf.call(spenderAccount)).valueOf(), 0, "Invalid spender balance after transfer");
		});
	});
	
	describe('changeOwner()', function() {
		it("should be changed owner", async function() {
			await SolumTokenInstance.changeOwner(accounts[1]);
			assert.equal((await SolumTokenInstance.owner.call()).valueOf(), accounts[1], "Invalid owner after change");
		});
	});
	
});

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 6083,
			gas: 4712388,
			network_id: "*" // Match any network id
		},
		testnet: {
			host: "127.0.0.1",
			port: 6082,
			gas: 2100000,
			network_id: "*" // Match any network id
		}
	},
	mocha: {
		useColors: true
	}
};

module.exports = {
	networks: {
		development: {
			host: "127.0.0.1",
			port: 6083,
			gas: 2816044,
			network_id: "*" // Match any network id
		},
		testnet: {
			from: "0xf8e5a2e7a7aa1148ab36dac0e5088a86e336ce79",
			host: "94.130.35.43",
			port: 6082,
			gas: 2816044,
			network_id: "*" // Match any network id
		}
	},
	mocha: {
		useColors: true
	}
};

module.exports = function(error) {
	if(error.message.search('invalid opcode') < 0) {
		throw error;
	}
};
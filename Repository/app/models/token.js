const mongoose = require('mongoose');

const tokenSchema = mongoose.Schema({
	_userId : {
		type: String
	},
	token: {
		type : String
	}
});

module.exports = mongoose.model('token',tokenSchema);

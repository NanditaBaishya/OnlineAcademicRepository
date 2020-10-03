const mongoose = require('mongoose');

const SData = mongoose.Schema({
	userId: {
		type: String,
		require: true
	},
	
	createdOn: {
		type: Date,
		default: Date.now()
	},

	condition : {
		type : String,
		default : "session"
	}
});

module.exports = mongoose.model('SData',SData);

const mongoose = require('mongoose');

const adminSchema = mongoose.Schema({
	userId: {
		type: String,
		require: true
	},
	password: {
		type: String,
		require: true
	},
	createdOn: {
		type: Date,
		default: Date.now()
	}
});

module.exports = mongoose.model('admin',adminSchema);
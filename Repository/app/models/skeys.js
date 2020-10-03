const mongoose = require('mongoose');

const keySchema = mongoose.Schema({
	key:{
		type: String,
		required: true
	}
});

module.exports = mongoose.model('skeys',keySchema);
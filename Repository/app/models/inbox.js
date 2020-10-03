const mongoose = require('mongoose');

//Schema

const inboxSchema = mongoose.Schema({
	username:{
		type: String,
		required: true
	},
	subject:{
		type: String,
		required: true
	},
	msg : {
		type: String,
		required: true
	}
	
});

const teacher = module.exports = mongoose.model('inbox',inboxSchema);
const mongoose = require('mongoose');

//Schema

const teacherSchema = mongoose.Schema({
	name:{
		type: String,
		required: true
	},
	email:{
		type: String,
		required: true
	},
	department:{
		type: String,
		required: true
	},
	username: {
		type: String,
		required: true 
	},
	password: {
		type: String,
		required: true
	},
	createdOn: {
		type: Date,
		default: Date.now()
	}
});

const teacher = module.exports = mongoose.model('teacher',teacherSchema);
const mongoose = require('mongoose');

//Schema

const noticeSchema = mongoose.Schema({
	notice : {
		type : String,
		required : true,
	},
	user : {
		type : String,
		required : true
	}
	
});

module.exports = mongoose.model('notice',noticeSchema);
const express=require("express");
const mongoose =require("mongoose");
const bcrypt=require('bcryptjs')
const session = require('express-session');
const methodOverride = require('method-override');

//connecting to database
mongoose.connect('mongodb://localhost/repository',
	{ useNewUrlParser: true});
// mongoose.connect("mongodb+srv://RichardNz:1k72233bb@cluster0-g2o1b.azure.mongodb.net/test?retryWrites=true&w=majority",
//     {useNewUrlParser: true},()=>{
    
//     console.log('Connected to DB!');
// });
let db = mongoose.connection;

db.once('open',function(){
	console.log('Connected to Mongodb');
});

db.on('error',function(err){
	console.log(err);
});

//including app and middlewares
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended : false }));
app.use(express.static(__dirname + '/pages'));
app.use(express.static(__dirname + '/views'));
app.use(methodOverride('_method'));

//set view engine
app.set('view engine','ejs');

//session middleware
app.use(session({
	name: 'sid',
	resave: false,
	saveUninitialized: false,
	secret: 'secret',
	cookie: {
		maxAge: 1000*60*60,
		sameSite: true, 
		secure: process.env.NODE_ENV ==='production',

	},
}));

//including models
const Teacher = require('./models/teacher');
const Token = require('./models/token');
const Admin = require('./models/admin');

//routes 
app.use(require('./routes/teacher'));
app.use(require('./routes/admin'));

app.listen(3000,function(){
	console.log("listening on port 3000");
});
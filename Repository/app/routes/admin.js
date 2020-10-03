const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const session = require('express-session');
var path = require('path');

//include models
const Admin = require('../models/admin');
const Admins = Admin.find({});
const Teacher = require('../models/teacher');
const Teachers = Teacher.find({});
const Key = require('../models/sKeys');
const Keys = Key.find({});

//redirect middleware
const redirectLogin = (req,res,next)=>{
	if(!req.session.userId){
		res.redirect('/admin');
	}else{
		next();
	}
}
const redirectHome = (req,res,next)=>{
	if(req.session.userId){
		res.redirect('/Adminhome');
	}else{
		next();
	}
}

//ROUTES

router.get('/asignup',(req,res)=>{
	res.render('asignup');
})

router.post('/asignup',(req,res)=>{
	username = req.body.user;
	password = req.body.password;
	newAdmin = new Admin({
		userId : username,
		password : password,
	})
	newAdmin.save(err=>{
		if(err) throw err;
		res.redirect('/admin');
	})
});

//GET Admin Login Page
router.get('/admin',redirectHome,(req,res)=>{
	//res.sendFile(path.join(__dirname + '/../pages/alogin.html'));
	res.render('alogin',{});
});
//GET to admin homepage/dashboard
router.get('/adminHome',redirectLogin, (req,res)=>{
	//res.sendFile(path.join(__dirname + '/../pages/Adminhome.html'));
	res.render('adminHome');
});
//POST to login 
router.post('/admin',(req,res)=>{
	id = req.body.uid;
	pass = req.body.pswd;
	Admin.findOne({userId : id, password : pass},(err,user)=>{
		if(err){
			console.log("error");
			return 
		}
		else if(!user){
			console.log("user does not exist");
			return res.send("user does not exist");
		}
		else if(user){
			req.session.userId = user.userId;
			return res.render('adminHome',{ username : id });
		}
		res.redirect('/admin');
	});
});
//TO logout
router.get('/logout',(req,res)=>{
	req.session.destroy(err=>{
		if(err){
			res.redirect('/adminHome');
		}
		res.clearCookie('sid');
		res.redirect('/admin');
	})
})
//get list of admins
router.get('/sadmin',redirectLogin, (req,res)=>{
	Admins.exec((err,data)=>{
		if(err) throw err;
		res.render('adminHome',{title: 'Admins',records: data});
	});
});
//get list of teachers
router.get('/steacher', redirectLogin, (req,res)=>{
	Teachers.exec((err,data)=>{
		if(err) throw err;
		res.render('adminHome',{title2: 'Teachers',records2: data});
	});
});
//create key
router.post('/createKey',(req,res)=>{
	key = req.body.newKey;
	newKey = new Key ({
		key : key
	});
	newKey.save(err =>{
		if(err) throw err;
		console.log("key created");
	});
});
//show keys
router.get('/skeys',(req,res)=>{
	Keys.exec((err,data)=>{
		if(err) throw err;
		res.render('adminHome',{title3: 'keys', records3:data});
	});
})
//GET for adminSignup
router.get('/adminSignup',(req,res)=>{
	res.render('adminSignup');

});
//POST for adminSignup
router.post('/adminSignup',(req,res)=>{
     uid=req.body.Name;
     pswd=req.body.pswd;
     if(!uid||!pswd){
     	console.log("NO");
     	res.redirect('/adminSignup');
     }
     Admin.findOne({userId:uid},(err,data)=>{
     	if(data){
     		res.send("User exists");		
     	}
     	else{
     		bcrypt.genSalt(10,(err,salt)=>{
        		bcrypt.hash(pswd,salt,(err,hash)=>{
        			pswd=hash;
        			console.log(hash);
        		});
        	});
        	newAdmin = new Admin({
        		userId:uid,
        		password:pswd

        	});
        	newAdmin.save((err)=>{
        		if(err) throw err;
        		console.log("Admin created");
        	})
        	res.redirect('/adminHome');
     	}
     });
     

});

module.exports = router;
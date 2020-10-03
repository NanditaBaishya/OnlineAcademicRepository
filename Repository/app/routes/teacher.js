const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const path = require('path');
const mongoose = require('mongoose');
const crypto = require('crypto');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const multer = require('multer');
const methodOverride = require('method-override');
const Glob = require('glob');
const fs = require('fs');



var ID;

//including models
const Key = require('../models/sKeys');
const Teacher = require('../models/teacher');
const SData = require('../models/sessionData');
const Inbox = require('../models/inbox');
const Notice = require('../models/notice');


//for files
const conn = mongoose.createConnection(
	'mongodb://localhost/uploads',{ 
		useNewUrlParser: true
});

//init gfs
let gfs;


conn.once('open',()=>{
	gfs = Grid(conn.db, mongoose.mongo);
	gfs.collection('uploads');
	console.log('Connected to Mongodb/uploads');
});

conn.on('error',function(err){
	console.log(err);
});


//create storage engine

const storage = new GridFsStorage({
	url: 'mongodb://localhost/uploads',
	file: (req,res)=>{
		return new Promise((resolve,reject)=>{
			crypto.randomBytes(16,(err,buf)=>{
				if(err){
					return reject(err);
				}
				else{
					SData.findOne({ condition:"session"},(err,data)=>{
						if(err) throw err;
						else{
							const ID = data.userId;
							console.log(data.userId);
							// const filename = buf.toString('hex')+
				// 			path.extname(res.originalname);
							const filename = res.originalname
							const fileInfo = {
								filename : filename,
							// filetype : path.extname(res.originalname),
								bucketName : 'uploads',
								contentType : ID,
							};
							resolve(fileInfo);
							console.log("uploaded");
						}	
					});

				}
			});
		});
	}
});
const upload = multer({storage: storage})

//redirecting middleware
const redirectLogin = (req,res,next)=>{
	if(!req.session.userId){
		res.redirect('/login');
	}
	next();
};
const redirectHome = (req,res,next)=>{
	if(req.session.userId){
		res.redirect('/userHome');
	}
	next();
};

//middlewares



//Get for login
router.get('/login', redirectHome,(req,res)=>{
	res.render('first');
});


//Get for signup
router.get('/signup',redirectHome, (req,res)=>{
	res.render('signup');
})

//post for signup
router.post('/signup', redirectHome, (req,res)=>{
	name = req.body.name;
	dept = req.body.dept;
	uid = req.body.uid;
	pswd = req.body.pswd;
	pswd2 = req.body.pswd2;
	nkey = req.body.sKey;
	email = req.body.email;

	if(!req.body.email||!req.body.name||!req.body.dept||!req.body.uid||
		!req.body.pswd||!req.body.pswd2||!req.body.sKey){
		res.redirect('signup');
	}
	if(pswd!=pswd2){
		res.redirect('signup');
		console.log('Password mismatch')
	}
	Teacher.findOne({username : uid},(err,data)=>{
		if(err) throw err;
		else if(data){
			return res.redirect('signup');
		}
		else{
			Key.findOne({key:nkey},(err,data)=>{
		if(!data){
			console.log('wrong key');
			res.redirect('signup');
		}
		else{
			bcrypt.genSalt(10,(err,salt)=>{
        		bcrypt.hash(pswd,salt,(err,hash)=>{
        			pswd=hash;
        			newTeacher = new Teacher({
					name : name,
					department : dept,
					username : uid,
					password : pswd,
					email : email,
				});
				newTeacher.save(err=>{
					if(err) throw err;
						console.log("Account created");
				});
				Key.deleteOne({key:nkey},(err=>{
					if(err) throw err;
				}));
				res.redirect('/login');
        			});
        	});
		}
	});
		}
	});
	
});

//POST for login
router.post('/login',redirectHome,async(req,res)=>{
	await SData.deleteMany({},(err)=>{
		if(err) throw err;
	});
	newSessionData = new SData({
							userId : req.body.uid,
						});
	newSessionData.save(err=>{
		if(err) throw err;
		else{
			console.log("added session");
			}
	});

	uid=req.body.uid;
	pswd=req.body.pswd;
	Teacher.findOne({username:uid},(err,data)=>{
    	if(!data) {
    			 res.send("user does not exist");
    	}  
    	else{
    		bcrypt.compare(pswd,data.password,(err,result)=>{
    			if(result){
    				req.session.userId = req.body.uid;
    				ID = req.body.uid;
    				SData.findOne({condition:"session"},(err,data1)=>{
						if(err) throw err;
       					gfs.files.find({contentType : data1.userId}).sort({uploadDate : -1}).toArray((err,files)=>{
							if(err) throw err;
							else{
								gfs.files.find().toArray((err,allFiles)=>{
									if(err) throw err;
									else if(!files||files.length===0){
										res.render('userHome',{username:uid, files: false , allFiles : allFiles});
									}
									else{
										res.render('userHome',{ username : uid, files : files, allFiles : allFiles });		
									}
    							})
    						}
    					})
    				});
    			}
			});
		}
	});
});


//POST for logout
router.get('/tlogout',(req,res)=>{
	req.session.destroy(err=>{
		if(err){
			return res.redirect('/adminHome');
		}
		res.clearCookie('sid');
		return res.redirect('/login');
	})
});

// GET for upload
router.get('/upload',redirectLogin,(req,res)=>{
	return res.render('upload');
});

//POST for upload
router.post('/upload',redirectLogin,upload.single('file'),(req,res)=>{
	return res.render('upload');
});

//GET for userHome
router.get('/userHome',redirectLogin,(req,res)=>{
	
	SData.findOne({condition:"session"},(err,data)=>{
		if(err) throw err;
       					gfs.files.find({contentType : data.userId}).sort({uploadDate : -1}).toArray((err,files)=>{
							if(err) throw err;
							else{
								gfs.files.find().toArray((err,allFiles)=>{
									if(err) throw err;
									else if(!files||files.length===0){
										res.render('userHome',{username:uid, files: false , allFiles : allFiles});
									}
									else{
										res.render('userHome',{ username : uid, files : files, allFiles : allFiles });		
									}
    							})
    						}
    					})
	});
});

//GET for uploaded files
router.get('/files',redirectLogin,(req,res)=>{
	SData.findOne({condition:"session"},(err,data)=>{
		if(err) throw err;
		gfs.files.find({contentType:data.userId}).toArray((err,files)=>{
		if(err) throw err;
		else if(!files||files.length===0){
			res.render('fileList',{files: false});
		}
		else{
			files.map(files=>{
				if(files.contentType ===
						'image/jpeg'){
					files.isImage = true;
				}
				else{
					files.isImage = false;
				}
			});
			res.render('fileList',{files: files, uid : data.userId});
		}
	});
	});
	
});

//DELETE for /files/:id
router.delete('/delete/:id',(req,res)=>{
	console.log("deleting");
	gfs.remove({_id:req.params.id,root:'uploads'},
		(err,gridStore)=>{
			if(err){
				return res.status(404).json({err:err});
			}
			res.redirect('/files');
		})
});

//Download file
router.get('/download/:id',(req, res)=>{

	const readStream = gfs.createReadStream({_id: req.params.id});
        let file = [];
        readStream.on('data',chunk=> {
            file.push(chunk);
        });
        readStream.on('error', err => {
            console.log(err); 
        });
        
        return readStream.on('end', ()=> {
            file = Buffer.concat(file);
            res.writeHead(200, {
     	  'Content-Type': 'application/pdf',
      	  'Content-Disposition': 'attachment; filename='+req.params.id+'.pdf',
     	  'Content-Length': file.length
     	 });
          	res.end(file);
        });

});
  
//GET for profile
router.get('/profile',redirectLogin,(req,res)=>{
	SData.findOne({condition : "session"},(err,user)=>{
		Teacher.findOne({username : user.userId},(err,data)=>{
			res.render('profile',{data : data});
		});
	});
	
});

//GET for uploading DP
const imgStorage = new GridFsStorage({
	url: 'mongodb://localhost/images',
	file: (req,res)=>{
		return new Promise((resolve,reject)=>{
			crypto.randomBytes(16,(err,buf)=>{
				if(err){
					return reject(err);
				}
				else{
					SData.findOne({ condition:"session"},(err,data)=>{
						if(err) throw err;
						else{
							const ID = data.userId;
							console.log(data.userId);
							// const filename = buf.toString('hex')+
				// 			path.extname(res.originalname);
							const filename = res.originalname
							const fileInfo = {
								filename : filename,
							// filetype : path.extname(res.originalname),
								bucketName : 'uploads',
								contentType : ID,
							};
							resolve(fileInfo);
							console.log("uploaded");
						}	
					});

				}
			});
		});
	}
});

const imgUpload = multer({storage : imgStorage});

router.post('/uploadPic',imgUpload.single('img'),(req,res)=>{
	console.log("uploaded dp");
	return res.redirect("/userHome");
});

//GET for /
router.get('/',(req,res)=>{
	gfs.files.find().toArray((err,allFiles)=>{
		if(err) throw err;
		else if(!allFiles||allFiles.length===0){
			res.render('studentHome',{username:uid, files: false});					
		}
		else{
			res.render('studentHome',{ allFiles : allFiles });		
			}
    });
});

//POST for sort
router.post('/sort',(req,res)=>{
	m = req.body.sorting;
	if(m === "newest"){
		gfs.files.find({}).sort({uploadDate : -1}).toArray((err,data)=>{
			if(err) throw err;
			res.render('studentHome',{allFiles:data});	
		});
	}
	if(m==="oldest"){
		res.redirect('/');
	}
});

//POST for tsort
router.post('/tsort',redirectLogin,(req,res)=>{
	m = req.body.sorting;
	SData.findOne({condition:"session"},(err,data)=>{
		if(err) throw err;
       					gfs.files.find({contentType : data.userId}).sort({uploadDate : -1}).toArray((err,files)=>{
							uid : data.userId;
							if(err) throw err;
							else if(!files||files.length===0){
								res.render('userHome',{files: false});
							}	
							else if(m === "newest"){
								gfs.files.find({}).sort({uploadDate : -1}).toArray((err,allFiles)=>{
									if(err) throw err;
										return res.render('userHome',{ username : uid, files : files, allFiles : allFiles });	
								});
							}
							else if(m==="oldest"){
								return res.redirect('/userHome');
								}
    							
    						})
    					})
	});

//POST for search
router.post('/search',(req,res)=>{
	m = req.body.search;
	gfs.files.find({filename : m}).toArray((err,data)=>{
		if(err) throw err;
		return res.render('studentHome',{allFiles : data});
	});
});

//POST for tsearch
router.post('/tsearch',redirectLogin,(req,res)=>{
	m = req.body.search;
		SData.findOne({condition:"session"},(err,user)=>{
			if(err) throw err;
			else{
				id = user.userId;
				gfs.files.find({filename : m}).toArray((err,data)=>{
					if(err) throw err; 
					else{
					res.render('userHome',{uid : id ,allFiles : data});	
				}
			})
		}
		
	});
});

//GET for getTs
router.get('/getTs',(req,res)=>{
	Teacher.find({},(err,data)=>{
		if(err) throw err;
		return res.render('studentHome',{teachers : data});
	})
});

//GET for inbox
router.post('/msg',(req,res)=>{
	name = req.body.name;
	subject = req.body.subject;
	msg = req.body.msg;
	
	Teacher.findOne({username : name},(err,teach)=>{
		if(err) throw err;
		newInbox = new Inbox({
		username : name,
		subject : subject,
		msg : msg,
		});
		newInbox.save(err=>{
			if(err) throw err;
			console.log("msg added");
		})
		return res.redirect('/getTs');
		});
});
router.get('/msg/:id',(req,res)=>{
 	id = req.params.id;
	Teacher.findOne({_id : id},(err,teach)=>{
		if(err) throw err;
		return res.render('msg',{data : teach});
	});
});

//GET for inbox
router.get('/inbox',redirectLogin,(req,res)=>{
	SData.findOne({condition : "session"},(err,user)=>{
		uid = user.userId
		if(err)throw err;
		console.log(user);
		Inbox.find({username : uid},(err,msg)=>{
			if(err) throw err;
			console.log(msg)
			if(msg)
			return res.render('inbox',{uid : uid,msg : msg});
			if(!msg)
				return res.render("no data");
		});
	});
})

//POST for editProfile
router.post('/editProfile',redirectLogin,(req,res)=>{
	email = req.body.email;
	pswd1 = req.body.pswd1;
	pswd2 = req.body.pswd2;
	SData.findOne({condition : "session"},(err,user)=>{
		if(err) throw err;
		id = user.userId;
		if((!pswd1||!pswd2)&&email){	
			Teacher.findOneAndUpdate({username : id},{
				email : email,
				
			},(err)=>{
				if(err) throw err;
				return res.redirect('/profile');
			});
			
		}
		if(!email&&!pswd1&&!pswd2){	
			return res.redirect('/profile');
		}
		if(!email&&(pswd1&&pswd2)){
			console.log("here");
			if(pswd1===pswd2){
			bcrypt.genSalt(10,(err,salt)=>{
        		bcrypt.hash(pswd1,salt,(err,hash)=>{
        			pswd1=hash;
        			console.log(pswd1);
        			Teacher.findOneAndUpdate({username : id},{
						password : pswd1,
				
					},(err)=>{
					if(err) throw err;
						return res.redirect('/profile');
					});
					
				})
        	});
			}
			else return res.redirect('/profile');
		}
		if(email&&(pswd1===pswd2)){
			bcrypt.genSalt(10,(err,salt)=>{
        		bcrypt.hash(pswd1,salt,(err,hash)=>{
        			pswd=hash;
        			Teacher.findOneAndUpdate({username : id},{
						password : pswd,
						email : email
					},(err)=>{
					if(err) throw err;
						return res.redirect('/profile');
					});
					
				})
        	});
		}

	})
})

//DELETE for /mdelete/:id
router.delete('/mdelete/:id',redirectLogin,(req,res)=>{
	console.log("deleting");
	Inbox.remove({_id: req.params.id},
		(err)=>{
			if(err){
				return res.status(404).json({err:err});
			}
			res.redirect('/inbox');
		})
});

//Get for editProfile
router.get('/editProfile',redirectLogin,(req,res)=>{
	SData.findOne({condition : "session"},(err,data)=>{
		if(err) throw err;
		uid : data.userId;
		res.render('editProfile',{uid : uid});
	})
});

//DP storage
const storagedp = new GridFsStorage({
	url: 'mongodb://localhost/uploadsdp',
	file: (req,res)=>{
		return new Promise((resolve,reject)=>{
			crypto.randomBytes(16,(err,buf)=>{
				if(err){
					return reject(err);
				}
				else{
					SData.findOne({ condition:"session"},(err,data)=>{
						if(err) throw err;
						else{
							const ID = data.userId;
							const filename = res.originalname
							const fileInfo = {
								filename : data.userId,
								bucketName : 'uploadsDp',
								contentType : ID,
							};
							resolve(fileInfo);
							console.log("uploaded");
						}	
					});

				}
			});
		});
	}
});

const uploadDP = multer({
 	storage : storagedp,
  
});

//POST for uploadDp
router.post("/uploadDp",redirectLogin,uploadDP.single("dp"),(req, res) => {
 	return res.redirect('/profile');   
});


//GET for notice
router.get('/notice',redirectLogin,(req,res)=>{
	SData.findOne({condition : "session"},(err,user)=>{
		return res.render('notice',{uid :user.userId});
	});
});

router.get('/snotice',(req,res)=>{
	Notice.find({},(err,data)=>{
		if(err) throw err;
		return res.render('snotice',{data : data});
	});
		
	
});


//POST for notice
router.post('/notice',redirectLogin,(req,res)=>{
	SData.findOne({condition : "session"},(err,user)=>{
		notice = req.body.notice;
		newNotice = new Notice({
			notice : notice,
			user : user.userId,
		});
		newNotice.save(err=>{
			if(err) throw err;
			res.redirect('/notice');
		});
	});
});

//GET for homeicon
router.get('/homeicon',(req,res)=>{
	if(req.session.userId){
		return res.redirect('userHome');
	}
	else{
		return res.redirect('/');
	}
});

module.exports = router;
'use strict'

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const pbkdf2 = require('pbkdf2-password')()
const mysql = require('mysql')

const config = require('./config');
const { exit } = require('process');

const connection = mysql.createConnection(config)
if (!connection) {
	exit(-1);
}

let app = module.exports = express();

app.use(express.urlencoded({ extended:false }))
app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: '6HBnWF56qv@nME'
}))

app.use(function(req, res, next){
	var err = req.session.error;
	var msg = req.session.success;
	delete req.session.error;
	delete req.session.success;
	res.locals.message = '';
	if (err) res.locals.message = 'Error:' + err + '';
	if (msg) res.locals.message = 'Success:' + msg + '';
	next();
});

function createHash(givenPassword, givenSalt, callback) {
	if (givenSalt !== '') {
		pbkdf2({ password: givenPassword, salt: givenSalt }, (err, pass, salt, hash) => {
			if (err) throw err;
			callback(salt, hash);
		});
	}
	else {
		pbkdf2({ password: givenPassword }, (err, pass, salt, hash) => {
			if (err) throw err;
			callback(salt, hash);
		});
	}
}

// createHash('password', '', (salt, hash) => {
// 	console.log('hash: %s\nsalt: %s', hash, salt);
// });

function authenticate(name, pass, userType, fn) {
	if (!module.parent) console.log('authenticating %s:%s', name, pass);
	let query = '';
	if (userType == 'admin')
		query = `select username, user_id, password_hash, salt from admin where username=?`;
	else
		query = `select username, user_id, password_hash, salt from users where username=?`;
	connection.query(query, [name], (error, results, fields) => {
		if (error) {
			console.log('error in query!');
			return console.error(error.message);
		} else {
			for (let row of results) {
				let passHash = row.password_hash;
				let passSalt = row.salt;
				createHash(pass, passSalt, (salt, hash) => {
					console.log('hash-stored: %s\nhash-calc: %s\nsalt-used:%s\n', passHash, hash, passSalt);
					if (hash === passHash) {
						console.log('logged in as user');
						return fn(null, row.user_id, userType);
					}
					fn(null, null, null);
				});
			}
		}
	});
}

function restrict(req, res, next) {
	if (req.session.user) {
		next();
	} else {
		req.session.code = 69420;
		res.redirect('/login');
	}
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/edit', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		res.render('admin');
	}
	else {
		let query = `select roll_no, student_name, status, student_semester, subject from attendance a inner join students s on a.student_id=s.student_id`;
		connection.query(query, (error, results, fields) => {
			if (error) {
				console.log('error reading database!' + error.message);
				return error;
			}
			res.render('teacher', { records: results });
		});
	}
});

app.get('/login', (req, res) => {
	res.status(200).render('login');
});

app.get('/logout', (req, res) => {
	req.session.destroy(() => {
		res.redirect('/login');
	});
});

app.get('/', (req, res) => {
	res.redirect('/login');
});

app.get('/404', (req, res) => {
	res.status(200).render('404');
});

app.get('*', (req, res, next) => {
	res.status(200).redirect('404');
	next();
});

app.post('/login', (req, res, next) => {
	console.log('POST {\n username:%s,\n password:%s,\n user:%s\n}',
				req.body.username, req.body.password, req.body.user_select);
	authenticate(req.body.username, req.body.password, req.body.user_select,
		(err, user, userType) => {
			if (err) {
				console.log('Error logging in!');
				return next(err);
			}
			if (user) {
				req.session.regenerate(()=>{
					req.session.user = user;
					req.session.userType = userType;
					req.session.status_code = 69;
					res.redirect('/edit');
				});
			} else {
				req.session.status_code = 420;
				res.redirect('/login');
			}
		});
});

app.post('/saveattendance', (req, res, next) => {
	if (req.body.semester) {}
});

app.listen(3000);
console.log('Express js listening to http://localhost:3000');

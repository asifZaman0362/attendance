'use strict'

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const pbkdf2 = require('pbkdf2-password')();
const parser = require('body-parser');
const mysql = require('mysql');

const config = require('./config');
const { exit } = require('process');

const connection = mysql.createConnection(config)
var limitedConnection = null;

if (!connection) {
	exit(-1);
}

let app = module.exports = express();

// app.use(express.urlencoded({ extended:false }));
app.use(parser.urlencoded({ extended: false }));
// app.use(parser.json);
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

app.get('/createAttendance', restrict, (req, res) => {
	if (req.session.userType == 'teacher') {
		if (req.query.semester && req.query.course && req.query.subject) {
			let query = `select student_name, roll_no from students where student_semester = ? and student_course = ?`;
			connection.query(query, [parseInt(req.query.semester), req.query.course], (error, results, fields) => {
				if (error) {
					console.log(error.message);
					res.send('<p class="error">' + error.message + '</p>');
				} else {
					res.render('attendanceEdit', {edit: true, sem: req.query.semester, course: req.query.course, subject: req.query.subject, rows: results, date: req.query.date});
				}
			});
		} else {
			res.render('createAttendance');
		}
	} else res.redirect('/login');
});

app.get('/viewAttendance', restrict, (req, res) => {
	if (req.session.userType == 'teacher') {
		let query = `select attendance_date, subject from attendance_table`;
		connection.query(query, (error, results, fields) => {
			if (error) {
				console.log(error.message);
				res.send('<p class="error">' + error.message + '</p>');
			} else {
				res.render('attendanceTable', { rows: results });
			}
		});
	} else res.redirect('/login');
});

app.get('/viewStudents', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `select * from students`;
		connection.query(query, (error, results, fields) => {
			if (error) return console.log(error.message);
			res.render('studentList', {edit: false, rows: results});
		});
	} else res.redirect('/login');
});

app.get('/editStudents', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `select * from students`;
		connection.query(query, (error, results, fields) => {
			if (error) return console.log(error.message);
			res.render('studentList', {edit: true, rows: results});
		});
	} else res.redirect('/login');
});

app.get('/addStudent', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		console.log(req.query);
		if (req.query.update == 'true') {
			res.render('editStudent', {create: false, id: req.query.id});
		}
		else {
			res.render('editStudent', {create: true, id: -1});
		}
	} else {
		res.redirect('/login');
	}
});

app.get('/viewTeachers', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `SELECT teacher_id, teacher_name, username FROM teachers t inner join users u on t.teacher_id = u.user_id;`
		connection.query(query, (error, results, fields) => {
			if (error) return res.send('could not load database!');
			res.render('teacherList', {edit: false, rows: results});
		});
	} else {
		res.redirect('/login');
	}
});

app.get('/editTeachers', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `SELECT teacher_id, teacher_name, username FROM teachers t inner join users u on t.teacher_id = u.user_id;`
		connection.query(query, (error, results, fields) => {
			if (error) return res.send('could not load database!');
			res.render('teacherList', {edit: true, rows: results});
		});
	} else {
		res.redirect('login');
	}
});

app.get('/addTeacher', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		console.log(req.query);
		if (req.query.update == 'true') {
			res.render('editTeacher', {create: false, id: req.query.id});
			console.log('update');
		}
		else {
			res.render('editTeacher', {create: true});
			console.log('new');
		}
	} else {
		res.redirect('/login');
	}
});

app.get('/viewAdmins', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		res.render('adminList', {edit: false});
	} else res.redirect('/login');
});

app.get('/editAdmins', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		res.render('adminList', {edit: true});
	} else res.redirect('/login');
});

app.get('/addAdmin', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let update = req.query.update == 'true';
		res.render('editAdmin', { update: update });
	} else res.redirect('/login');
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
					let cfg = {
						host: "localhost",
						user: req.body.username,
						password: req.body.password,
						database: "attendance_app"
					};
					limitedConnection = mysql.createConnection(cfg);
					res.redirect('/edit');
				});
			} else {
				req.session.status_code = 420;
				res.redirect('/login');
			}
		});
});

app.post('/saveAttendance', restrict, (req, res, next) => {
	if (req.session.userType == 'teacher') {
		let query = `insert into attendance values(?, ?, ?, ?, ?)`;
		connection.query(query, [req.body.date, req.body.subject, req.body.course, req.body.semester, req.body.numbers], (error, results, fields) => {
			if (error) {
				res.send(err.message);
				return console.log(err.message);
			}
			res.send("Added entries successfully!");
		});
	} else res.redirect('/login');
});

app.post('/saveStudent', restrict, (req, res, next) => {
	if (connection) {
		let query = `select * from students`;
		if (req.body.id == -1) {
			connection.query(query, (error, results, fields) => {
				let id = results.length + 1;
				let insertQuery = `insert into students values(?, ?, ?, ?, ?)`;
				connection.query(insertQuery, [id, req.body.student_name, req.body.student_course, req.body.student_semester, req.body.roll_no], (error, results, fields) => {
					if (error) return console.log(error.message);
					res.send('Added student entry!');
					next();
				});
			});
		} else {
			connection.query(query, (error, results, fields) => {
				let id = req.body.id;
				let insertQuery = `update students values set student_name=?, student_course=?, student_semester=?, roll_no=? where student_id=?)`;
				connection.query(insertQuery, [req.body.student_name, req.body.student_course, req.body.student_semester, req.body.roll_no, req.body.id], (error, results, fields) => {
					if (error) return console.log(error.message);
					res.send('Added student entry!');
					next();
				});
			});
		}
	}
});

app.post('/saveTeacher', restrict, (req, res, next) => {
	if (connection) {
		let query = `select * from students`;
		connection.query(query, (error, results, fields) => {
			let id = results.length + 1;
			let insertQuery = `insert into students values(?, ?, ?, ?, ?)`;
			connection.query(insertQuery, [id, req.body.student_name, req.body.student_course, req.body.student_semester, req.body.roll_no], (error, results, fields) => {
				if (error) return console.log(error.message);
				res.send('Added student entry!');
				next();
			});
		});
	}
});

app.listen(3000);
console.log('Express js listening to http://localhost:3000');

'use strict'

const express = require('express');
const session = require('express-session');
const path = require('path');
const pbkdf2 = require('pbkdf2-password')();
const parser = require('body-parser');
const mysql = require('mysql');

const config = require('./config');
const { exit } = require('process');

const connection = mysql.createConnection(config)

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
	if (err) res.locals.error = 'Error:' + err + '';
	if (msg) res.locals.success = 'Success:' + msg + '';
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

function authenticate(name, pass, userType, fn) {
	if (!module.parent) console.log('authenticating %s:%s', name, pass);
	let query = '';
	if (userType == 'admin')
		query = `select username, user_id, password_hash, salt from admin where username=?`;
	else
		query = `select username, teacher_id, password_hash, salt from teachers where username=?`;
	connection.query(query, [name], (error, results, fields) => {
		if (error) {
			console.log('error in query! Error: ' + error.message);
			return console.error(error.message);
		} else {
			for (let row of results) {
				let passHash = row.password_hash;
				let passSalt = row.salt;
				createHash(pass, passSalt, (salt, hash) => {
					if (hash === passHash) {
						console.log('logged in as user');
						return fn(null, 1, userType);
					}
					return fn(null, null, null);
				});
			}
		}
	});
}

function restrict(req, res, next) {
	if (req.session.user || req.session.new) {
		if (req.session.new) delete req.session.new;
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
		res.render('teacher');
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
					res.render('attendanceEdit', {edit: true, sem: req.query.semester, course: req.query.course, subject: req.query.subject, students: results, date: req.query.date});
				}
			});
		} else {
			res.render('createAttendance');
		}
	} else res.redirect('/login');
});

app.get('/viewAttendance', restrict, (req, res) => {
	if (req.session.userType == 'teacher') {
		if (req.query.id) {
			let id = parseInt(req.query.id);
			let query1 = `select date_taken, subject, course, semester, roll_numbers from attendance where att_id = ?`;
			connection.query(query1, [id], (error, results, fields) => {
				if (error) {
					res.send('<p class="error">Error loading database!</p>');
					return console.log("DB Error in /viewAttendance: " + error.message);
				} else {
					let query2 = `select student_name, roll_no from students where student_semester = ? and student_course = ?`;
					connection.query(query2, [results[0].semester, results[0 ].course], (error, results2, fields2) => {
						if (error) {
							res.send('<p class="error">Error loading database!</p>');
							return console.log("DB Error in /viewAttendance: " + error.message);
						} else {
							let numbers = JSON.parse(results[0].roll_numbers);
							res.render('attendanceEdit', { edit: false, present_list: numbers, sem: results[0].semester, course: results[0].course, subject: results[0].subject, date: results[0].date_taken, students: results2 });
						}
					});
				}
			});
		} else {
			let query = `select date_taken, subject, att_id from attendance`;
			connection.query(query, (error, results, fields) => {
				if (error) {
					console.log(error.message);
					res.send('<p class="error">' + error.message + '</p>');
				} else {
					res.render('attendanceTable', { rows: results });
				}
			});
		}
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
		let query = `SELECT teacher_id, teacher_name, username FROM teachers`;
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
		let query = `SELECT teacher_id, teacher_name, username FROM teachers`;
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
		if (req.query.update == 'true') {
			res.render('editTeacher', {create: false, id: req.query.id});
		}
		else {
			res.render('editTeacher', {create: true});
		}
	} else {
		res.redirect('/login');
	}
});

app.get('/viewAdmins', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `select * from admin;`;
		connection.query(query, (err, rows, fields) => {
			if (err) {
				req.session.error = err;
				return console.log(err.message);
			}
			res.render('adminList', {edit: false, rows: rows});
		});
	} else res.redirect('/login');
});

app.get('/editAdmins', restrict, (req, res) => {
	if (req.session.userType == 'admin') {
		let query = `select * from admin;`;
		connection.query(query, (err, rows, fields) => {
			if (err) {
				req.session.error = err;
				return console.log(err.message);
			}
			res.render('adminList', {edit: true, rows: rows});
		});
	} else res.redirect('/login');
});

app.get('/register', (req, res) => {
	res.render('editAdmin', {first: true, create: true});
});

app.get('/createAdmin', (req, res) => {
	if (req.query.create)
		res.render('editAdmin', {create: true, first: false});
	else if (req.query.edit_id) {
		let id = parseInt(req.query.edit_id);
		let query = `SELECT username, email, phone from admin where user_id = ?`;
		connection.query(query, [id], (err, results, fields) => {
			if (err) {
				req.session.error = "Couldn't fetch database!";
				console.log("Error fetching database! " + err.message);
				res.redirect('/edit');
			} else {
				let name = results[0].username;
				let email = results[0].email;
				let phone = results[0].phone;
				res.render('editAdmin', {create: false, first: false, uname: name, email: email, phone: phone});
			}
		});
	} else {
		res.render('editAdmin', {create: true});
	}
});

app.get('/', (req, res) => {
	let query = `select * from prefs`;
	connection.query(query, (err, rows, fields) => {
		if (err) {
			return console.log(err.message);
		} else {
			if (rows.length > 0 && rows[0].first_run == 1) {
				req.session.new = true;
				res.redirect('/register');
			} else {
				res.redirect('/login');
			}
		}
	});
});

app.get('/404', (req, res) => {
	res.status(200).render('404');
});

app.get('*', (req, res, next) => {
	res.status(200).redirect('404');
	next();
});

app.get('/editAdmins', (req, res, next) => {
	res.render('adminList', {edit: true});
});

app.get('/viewAdmins', (req, res, next) => {
	res.render('adminList', {edit: false});
});

app.post('/login', (req, res, next) => {
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
					req.session.success = "Logged in successfully!";
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
		let query = `insert into attendance (date_taken, subject, course, semester, roll_numbers) values(?, ?, ?, ?, ?)`;
		connection.query(query, [req.body.date, req.body.subject, req.body.course, req.body.semester, req.body.numbers], (error, results, fields) => {
			if (error) {
				res.send(err.message);
				return console.log(err.message);
			}
			req.session.success = "Added entries successfully!";
			res.redirect('/edit');
		});
	} else res.redirect('/login');
});

app.post('/saveStudent', restrict, (req, res, next) => {
	if (connection) {
		if (req.body.id == -1) {
			let insertQuery = `insert into students (student_name, student_course, student_semester, roll_no) values(?, ?, ?, ?)`;
			connection.query(insertQuery, [req.body.student_name, req.body.student_course, req.body.student_semester, req.body.roll_no], (error, results, fields) => {
				if (error) return console.log(error.message);
				req.session.success = 'Added student entry!';
				res.redirect('/edit');
				next();
			});
		} else {
			connection.query(query, (error, results, fields) => {
				let id = req.body.id;
				let insertQuery = `update students values set student_name=?, student_course=?, student_semester=?, roll_no=? where student_id=?)`;
				connection.query(insertQuery, [req.body.student_name, req.body.student_course, req.body.student_semester, req.body.roll_no, req.body.id], (error, results, fields) => {
					if (error) return console.log(error.message);
					req.session.success = 'Added student entry!';
					res.redirect('/edit');
					next();
				});
			});
		}
	}
});

app.post('/saveTeacher', restrict, (req, res, next) => {
	if (connection) {
		createHash(req.body.teacher_pass, '', (salt, hash) => {
			let insertQuery = `insert into teachers (teacher_name, username, salt, password_hash) values(?, ?, ?, ?)`;
			connection.query(insertQuery, [req.body.teacher_name, req.body.username, salt, hash], (error, results, fields) => {
				if (error) return console.log(error.message);
				req.session.success = 'Added teacher entry!';
				res.redirect('/edit');
				next();
			});
		});
	}
});

app.post('/saveAdmin', restrict, (req, res, next) => {
	if (connection) {
		createHash(req.body.admin_pass, '', (salt, hash) => {
			if (req.body.update) {
				let updateQuery;
				let values;
				if (req.body.admin_pass.length == 0) {
					updateQuery = `update admin set username=?, email=?, phone=? where user_id = ?`;
					values = [req.body.username, req.body.email, req.body.phone];
				}
				else {
					updateQuery = `update admin set username=?, email=?, phone=?, password_hash = ?, salt = ? where user_id = ?`;
					[req.body.username, req.body.email, req.body.phone, hash, salt]
				}
				connection.query(updateQuery, values, (err, rows, fields) => {
					if (err) {
						req.session.error = "Failed pushing to database!";
						console.log("Error updating database: " + err.message);
						res.redirect('/edit');
					}
					req.session.success = "Updated entries successfuly!";
					res.redirect('/viewAdmins');
				});
			}
			let insertQuery = `insert into admin (username, email, phone, salt, password_hash) values(?, ?, ?, ?, ?)`;
			connection.query(insertQuery, [req.body.username, req.body.email, req.body.phone, salt, hash], (error, results, fields) => {
				if (error) return console.log(error.message);
				if (req.body.first) {
					let updateFirstRunQuery = `update prefs set first_run = false where first_run = true`;
					connection.query(updateFirstRunQuery, (err, results, fields) => {
						if (err) {
							req.session.error = err.message;
							return console.log(err.message);
						} 
						req.session.success = 'Added admin entry!';
						res.redirect('/edit');
						next();
					});
				} else {
					req.session.success = 'Added admin entry!';
					res.redirect('/edit');
					next();
				}
			});
		});
	}
});

app.listen(3000);
console.log('Express js listening to http://localhost:3000');

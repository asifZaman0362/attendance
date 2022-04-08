'use strict'

const express = require('express');
const session = require('express-session');
const path = require('path');
const config = require('./config');
const { exit } = require('process');

const auth = require('./auth');
const admin = require('./routes/admin');
const teacher = require('./routes/teacher');
const home = require('./routes/index');
const db = require('./database');

const app = module.exports = express();
let connection = null;

db.then((conn) => {
    console.log("Established connection to MySQL server");
    connection = conn;
}).catch((error) => {
    console.error(error);
    exit(-1);
});

app.set('view engine', 'pug');
app.set('views', path.join(__dirname + '/views'));

//#region Third-party middleware

app.use(express.urlencoded({ extended: false }));

app.use(session({
	resave: false,
	saveUninitialized: false,
	secret: '6HBnWF56qv@nME'
}));

app.use(express.json());

app.use((req, res, next) => {
    var error = req.session.error;
    var success = req.session.success;
    delete req.session.error;
    delete req.session.success;
    if (error) res.locals.error = error;
    if (success) res.locals.success = success;
    next();
});

app.use(express.static('public'));

//#endregion

//#region Routing

app.use('/admin*', admin);
app.use('/teacher*', teacher);
app.use('/', home);

//#endregion

app.listen(3000, () => {
    console.log('Express server started at: http://localhost:3000');
});
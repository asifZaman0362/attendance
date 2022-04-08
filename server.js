'use strict'

const express = require('express');
const session = require('express-session');
const pbkdf2 = require('pbkdf2-password');
const path = require('path');
const mysql = require('mysql');
const config = require('./config');
const { exit } = require('process');
const req = require('express/lib/request');

const auth = require('./auth');

const app = module.exports = express();
const connection = mysql.createConnection(config);

if (!connection) {
    console.log("Failed to establish connection with database! Exiting...");
    exit(-1);
}

app.set('view engine', 'pug');
app.set('views', path.join(__dirname + '/views'));

//#region Middleware

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

app.get('/login', (req, res) => {
    res.render('loginView');
    return;
});

app.get('/admin', (req, res, next) => {
    auth.restrictUser("Admin", req, res, next);
    return;
}, (req, res) => {
    if (req.session.error) {
        console.log(error);
        return res.redirect('/login');
    }
    return res.send('Admin dashboard');
});

app.get('/', (req, res) => {
    res.redirect('/login');
    return;
});

app.get('*', (req, res) => {
    res.status(404).render('404');
    return;
});

app.post('/login', (req, res, next) => {
    console.log('posting info');
    req.session.regenerate(() => {
        console.log(req.body);
        req.session.user = req.body.username;
        req.session.userType = req.body.usertype;
        return res.redirect('/admin');
    });
});

//#endregion

app.listen(3000, () => {
    console.log('Express server started at: http://localhost:3000');
});
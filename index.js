'use strict'

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

let app = global.exports = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.status(200).render('index')
});

app.get('/404', (req, res) => {
	res.status(200).render('404');
});

app.get('*', (req, res, next) => {
	res.status(200).redirect('404');
	next();
});

app.listen(3000);
console.log('Express js listening to http://localhost:3000');

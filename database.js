const mysql = require('mysql2/promise');
const config = require('./config');

module.exports = mysql.createConnection(config);
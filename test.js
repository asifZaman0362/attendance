const connection = require('./database');

connection.then((res) => {
    res.query('select * from Prefs').then((rows) => {
        console.log(rows[0].length);
    });
}).catch(console.error);
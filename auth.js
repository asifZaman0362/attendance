const pbkdf2 = require('pbkdf2-password')();
const connection = require('./database');

function restrictUser(userType, req, res, next) {
    console.log('Checking access for user: %s as %s...', req.session.user, req.session.userType);
    if (req.session.user && req.session.userType == userType) {
        console.log('Access granted!');
        return next();
    } else {
        req.session.code = 203;
        req.session.error = "Access Denied! Only <b>" + userType + "</b> can perform that action.";
        return next();
    }
}

// function createHash(password, salt, callback) {
//     pbkdf2({ password: password, salt: salt ? salt : undefined }, (error, pass, c_salt, c_hash) => {
//         if (error) {
//             console.log("Error in function createHash() of 'server.js': Error computing hash. Details:\n" + error);
//             callback(null, null);
//         } else {
//             callback(c_hash, c_salt);
//         }
//     });
// }

async function createHash(password, salt) {
    return new Promise((resolve, reject) => {
        pbkdf2({ password: password, salt: salt ? salt : undefined }, (error, pass, c_salt, c_hash) => {
            if (error) {
                reject("Encountered an error while computing password hash!");
            } else {
                resolve({ hash: c_hash, salt: c_salt });
            }
        });
    });
}

async function authenticate(name, pass, usertype) {
    console.log('Attempting authentication for : %s', name);
    try {
        let conn = await connection;
        let data;
        if (usertype == 'Admin')
            data = await conn.query(`SELECT password_hash, salt FROM Admin WHERE username = ?`, [name]);
        else data = await conn.query(`SELECT password_hash, salt FROM Teacher WHERE username = ?`, [name]);
        let rows = data[0];
        for (let row of rows) {
            let hashed = await createHash(pass, row.salt);
            console.log("pass: %s\nsalt: %s", pass, row.salt);
            console.log("computed: %s\nstored: %s", hashed.hash, row.password_hash);
            if (row.password_hash == hashed.hash) {
                console.log('Logged in as %s (%s).', name, usertype);
                return { name: name, usertype: usertype };
            }
        }
        return { error: "Incorrect username or password!" };
    } catch (error) {
        return { error: error };
    }
}

async function checkRegistration() {
    try {
        let conn = await connection;
        let data = await conn.query(`SELECT registered FROM Prefs`);
        console.log(data[0]);
        return (data[0].length > 0 && data[0]);
    } catch (error) {
        console.error(error);
        throw "Error encountered while querying database!";
    }
}

module.exports = {
    restrictUser,
    createHash,
    authenticate,
    checkRegistration
};
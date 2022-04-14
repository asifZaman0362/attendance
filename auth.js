const pbkdf2 = require('pbkdf2-password')();
const connection = require('./database');

function restrictUser(userType, req, res, next) {
    if (req.session.user && req.session.userType == userType) {
        console.log('Access granted!');
        return next();
    } else {
        req.session.code = 203;
        req.session.error = "Access Denied! Only <b>" + userType + "</b> can perform that action.";
        return next();
    }
}

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
        return (data[0].length > 0 && data[0][0].registered);
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
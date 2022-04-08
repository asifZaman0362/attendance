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

function createHash(password, salt, callback) {
    if (salt) {
        pbkdf2({ password: password, salt: salt }, (error, pass, c_salt, c_hash) => {
            if (error) {
                console.log("Error in function createHash() of 'server.js': Error computing hash. Details:\n" + error);
                callback(null, null);
            } else {
                callback(c_hash, c_salt);
            }
        });
    } else {
        pbkdf2({ password: password }, (error, pass, c_salt, c_hash) => {
            if (error) {
                console.log("Error in function createHash() of 'server.js': Error computing hash. Details:\n" + error);
                callback(null, null);
            } else {
                callback(c_hash, c_salt);
            }
        });
    }
}

function authenticate(name, pass, userType, callback) {
    console.log('Attempting authentication for : %s', name);
    connection.query('SELECT password_hash, salt FROM ? WHERE username = ?', [userType, name], (error, rows, fields) => {
        if (error) {
            console.error("Error in function 'authenticate()' of %s: %s", __filename, error.message);
            callback(error, null, null);
            return;
        }
        for (let row of rows) {
            createHash(pass, row.salt, (hash, salt) => {
                if (row.password_hash == hash) {
                    console.log('Logged in as %s (%s).', name, userType);
                    callback(null, name, userType);
                    return;
                }
            });
        }
        callback("Incorrect username or password!", null, null);
        return;
    });
}

module.exports = {
    restrictUser,
    createHash,
    authenticate
};
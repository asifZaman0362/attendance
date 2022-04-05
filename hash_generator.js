const pbkdf2 = require('pbkdf2-password')();

function create_hash(password, salt, callback) {
    if (salt == '') {
        pbkdf2({ password: password }, (error, pass, _salt, hash) => {
            if (error) {
                console.log("Error computing password hash: ");
                throw error;
            } else {
                callback(salt, hash);
            }
        });
    }
}


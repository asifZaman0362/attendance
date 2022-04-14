const pbkdf2 = require('pbkdf2-password')();

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

createHash("pass", "", (salt, hash) => {
    console.log("salt: %s\nhash: %s", salt, hash);
});
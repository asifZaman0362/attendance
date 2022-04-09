const express = require('express');
const auth = require('../auth');
const connection = require('../database');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('loginView', { title: "Login" });
    return;
});

router.get('/register', async (req, res) => {
    try {
        let registered = await auth.checkRegistration();
        if (registered) {
            req.session.error = "Already registered!";
            return res.redirect('/login');
        } else {
            return res.render('register');
        }
    } catch (error) {
        req.session.error = error;
        console.error(error);
        return res.redirect('/login');
    }
});

router.get('/', (req, res) => {
    if (req.session.userType) {
        if (req.session.userType == 'Teacher')
            return res.redirect('/teacher');
        else if (req.session.userType == 'Admin')
            return res.redirect('/admin');
        else {}
    }
    return res.redirect('/login');
});

router.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        res.redirect('/login');
    });
});

router.get('*', (req, res) => {
    res.status(404).render('404', { title: "Page Not Found", username: req.session.user, usertype: req.session.userType });
    return;
});

router.post('/login', async (req, res) => {
    let result = await auth.authenticate(req.body.username, req.body.password, req.body.usertype);
    if (result.error) {
        req.session.error = result.error;
        console.log(result.error);
        return res.redirect('/login');
    } else {
        req.session.regenerate(() => {
            req.session.user = result.name;
            req.session.userType = result.usertype;
            req.session.success = "Successfully logged in as <b>" + result.name + "</b>!";
            let target = result.usertype == "Admin" ? "/admin" : "/teacher";
            return res.redirect(target);
        });
    }
});

router.post('/register', async (req, res) => {
    try {
        let registred = await auth.checkRegistration();
        if (registred) {
            req.session.error = error;
            return res.redirect('/');
        } else {
            let hashed = await auth.createHash(req.body.password);
            let conn = await connection;
            let values = [
                req.body.username, hashed.hash, hashed.salt, req.body.firstname,
                req.body.lastname, req.body.mail, req.body.phone
            ];
            await conn.beginTransaction();
            await conn.execute(`INSERT INTO Admin(username, password_hash, salt, 
                firstname, lastname, email, phone) values(?, ?, ?, ?, ?, ?, ?)`, 
                values);
            await conn.execute(`UPDATE Prefs SET registered = True where registered = False`);
            await conn.commit();
            req.session.success = "Registered successfully! Log in to continue."
            return res.redirect('/login');
        }
    } catch (error) {
        req.session.error = "Error encountered while querying database!";
        console.error(error);
        res.redirect('/');
    }
});

module.exports = router;
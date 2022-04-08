const express = require('express');
const auth = require('../auth');
const router = express.Router();

router.get('/login', (req, res) => {
    res.render('loginView', { title: "Login" });
    return;
});

router.get('/', (req, res) => {
    res.redirect('/login');
    return;
});

router.get('*', (req, res) => {
    res.status(404).render('404');
    return;
});

router.post('/login', (req, res, next) => {
    console.log('posting info');
    req.session.regenerate(() => {
        req.session.user = req.body.username;
        req.session.userType = req.body.usertype;
        return res.redirect('/admin');
    });
});

module.exports = router;
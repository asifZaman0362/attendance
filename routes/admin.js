const express = require('express');
const auth = require('../auth');
const router = express.Router();

function restrict(req, res, next) {
    auth.restrictUser("Admin", req, res, next);
    return;
}

router.get('/', restrict, (req, res) => {
    if (req.session.error) {
        console.log("Access denied!");
        return res.redirect('/login');
    }
    return res.render('adminDashboard', { title: "Admin Panel", username: req.session.user, usertype: req.session.userType });
});

router.get('*', restrict, (req, res) => {
    res.status(404).render('404');
    return;
});

module.exports = router;
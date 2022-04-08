const express = require('express');
const auth = require('../auth');
const router = express.Router();

function restrict(req, res, next) {
    auth.restrictUser("Teacher", req, res, next);
    return;
}

router.get('/', restrict, (req, res) => {
    if (req.session.error) {
        console.log("Access denied!");
        return res.redirect('/login');
    }
    return res.render('teacherDashboard', { title: "Teacher Panel", username: req.session.user, usertype: req.session.userType });
});

router.get('*', restrict, (req, res) => {
    res.status(404).render('404', { title: "Page Not Found" });
    return;
});

module.exports = router;
const express = require('express');
const auth = require('../auth');
const connection = require('../database');
const router = express.Router();

function restrict(req, res, next) {
    auth.restrictUser("Admin", req, res, next);
    return;
}

router.get('/', restrict, (req, res) => {
    if (req.session.error) {
        return res.redirect('/login');
    }
    return res.render('adminDashboard', { title: "Admin Panel", username: req.session.user, usertype: req.session.userType });
});

router.get('/addUser', restrict, async (req, res) => {
    if (req.session.error) {
        return res.redirect('/');
    }
    let options;
    if (req.query.edit) {
        try {
            let conn = await connection;
            let query;
            if (req.query.type == "Teacher") 
                query = `SELECT firstname, lastname, username, email, phone FROM Teacher WHERE id = ?`;
            else 
                query = `SELECT firstname, lastname, username, email, phone FROM Admin WHERE id = ?`
            let res = await conn.query(query, [req.query.id]);
            let options = {
                edit: true,
                title: "Admin Panel",
                username: req.session.user,
                usertype: req.session.userType,
                type: "Teacher",
                firstname: res[0][0].firstname,
                lastname: res[0][0].lastname,
                uname: res[0][0].username,
                email: res[0][0].email,
                phone: res[0][0].phone
            };
            return res.render('editUser', options);
        } catch (error) {
            console.error(error);
            req.session.error = error;
            return res.redirect('/');
        }
    } else {
        if (req.query.type == "Teacher") { // If we're adding a new Teacher, fetch available departments for selection
            let conn = await connection;
            let departments = await conn.query('SELECT * FROM Department');
            let ids = [];
            let names = [];
            for (let dept of departments[0]) {
                ids.push(dept.id);
                names.push(dept.dept_name);
            }
            options = {
                edit: false,
                type: "Teacher",
                title: "Add Teacher | Admin Panel",
                username: req.session.user,
                usertype: req.session.userType,
                department_names: names,
                department_ids: ids
            };
        } else {
            options = {
                edit: false,
                type: "Admin",
                title: "Add Admin | Admin Panel",
                username: req.session.user,
                usertype: req.session.userType
            };
        }
        return res.render('editUser', options);
    }
});

router.get('/listTeachers', restrict, async (req, res) => {
    if (req.session.error) {
        return res.redirect('/');
    }
    try {
        let query = `SELECT teacher_id, concat(firstname, ' ', lastname) AS name, username, Departments FROM Teacher _t LEFT JOIN (SELECT teacher_id, GROUP_CONCAT(DISTINCT dept_name ORDER BY teacher_id DESC SEPARATOR ',') AS departments FROM (SELECT teacher_id, dept_name FROM Teacher t LEFT JOIN (SELECT teacher_id, dept_name FROM Teacher_Department td LEFT JOIN Department d ON d.id = td.dept_id) combined ON combined.teacher_id = t.id) AS x GROUP BY x.teacher_id) AS y ON _t.id = y.teacher_id`
        let conn = await connection;
        let results = await conn.query(query);
        return res.render('teacherList', { title: "Teacher List", username: req.session.user, usertype: req.session.userType, rows: results[0] });
    } catch (error) {
        req.session.error = "Error fetching database!";
        return res.redirect('/');
    }
});

router.get('/listAdmins', restrict, async (req, res) => {
    if (req.session.error) {
        return res.redirect('/');
    }
    try {
        let query = `SELECT id, CONCAT(firstname, ' ', lastname) as name, username, email FROM Admin`;
        let conn = await connection;
        let results = await conn.query(query);
        return res.render('adminList', { title: "Admin List", username: req.session.user, usertype: req.session.userType, rows: results[0] });
    } catch (error) {
        req.session.error = "Error fetching database!";
        return res.redirect('/');
    }
});

router.get('*', (req, res) => {
    res.status(404).render('404', { title: "Page Not Found", username: req.session.user, usertype: req.session.userType });
    return;
});

router.post('/editUser', restrict, async (req, res) => {
    if (req.session.error) {
        return res.redirect('/');
    }
    try {
        let hashed = await auth.createHash(req.body.password, "");
        let conn = await connection;
        let values = [
            req.body.firstname,
            req.body.lastname,
            req.body.username,
            hashed.hash,
            hashed.salt,
            req.body.phone,
            req.body.email
        ];
        if (req.body.type == 'Teacher') {
            await conn.beginTransaction();
            await conn.execute(`INSERT INTO Teacher (firstname, lastname, username, password_hash, salt, phone, email) values (?, ?, ?, ?, ?, ?)`, values);
            let pushed = await conn.query(`SELECT id FROM Teacher WHERE username = ? AND password_hash = ?`, [req.body.username, hashed.hash]);
            let departments = req.body.departments.split(',');
            for (let department of departments) {
                await conn.execute(`INSERT INTO Teacher_Department (teacher_id, dept_id) values (?, ?)`, [pushed[0][0].id, parseInt(department)]);
            }
            await conn.commit();
        } else {
            await conn.query(`INSERT INTO Admin (firstname, lastname, username, password_hash, salt, phone, email) values (?, ?, ?, ?, ?, ?)`, values);
        }
        req.session.success = "Successfully added user info!";
        return res.redirect('/');
    } catch (error) {
        console.error("Error while adding %s info: %s", req.body.type, error);
        req.session.error = "Error while updating database!";
        return res.redirect('/');
    }
});

module.exports = router;
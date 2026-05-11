var express = require('express');
var router = express.Router();
var db = require('../database');

// Render Login page
router.get('/login', function(req, res) {
    var error = req.query.error || '';
    res.render('login', { error: error });
});

// Handle Login
router.post('/login', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;

    var query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    console.log("[DEBUG] Executing SQL:", query);

    db.get(query, function(err, user) {
        if (err) {
            // Handle error
            return res.redirect('/login?error=' + encodeURIComponent(err.message));
        }
        if (user) {
            // Set session cookies
            res.cookie('userId', user.id);
            res.cookie('username', user.username);
            res.cookie('fullName', user.fullName);
            res.cookie('role', user.role);
            return res.redirect('/');
        } else {
            return res.redirect('/login?error=Invalid credentials');
        }
    });
});

// Render Register page
router.get('/register', function(req, res) {
    var error = req.query.error || '';
    res.render('register', { error: error });
});

// Handle Register
router.post('/register', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var fullName = req.body.fullName;
    
    var role = req.body.role || 'customer';

    var query = "INSERT INTO users (username, password, fullName, role) VALUES ('" + 
                username + "', '" + password + "', '" + fullName + "', '" + role + "')";
    console.log("[DEBUG] Executing SQL:", query);

    db.run(query, function(err) {
        if (err) {
            return res.redirect('/register?error=' + encodeURIComponent(err.message));
        }
        // Automatically log them in using the new ID
        res.cookie('userId', this.lastID);
        res.cookie('username', username);
        res.cookie('fullName', fullName);
        res.cookie('role', role);
        res.redirect('/');
    });
});

// Logout
router.get('/logout', function(req, res) {
    res.clearCookie('userId');
    res.clearCookie('username');
    res.clearCookie('fullName');
    res.clearCookie('role');
    res.redirect('/login');
});

module.exports = router;

var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var db = require('./database');

var app = express.Router ? express() : express; // Classic initialization support

// Configure View Engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// Serve custom static assets or styles inline
// Disabling built-in security headers intentionally for legacy replication
app.disable('x-powered-by');

// Routes
var authRoutes = require('./routes/auth');
var accountRoutes = require('./routes/accounts');
var transferRoutes = require('./routes/transfers');

app.use('/', authRoutes);
app.use('/accounts', accountRoutes);
app.use('/transfers', transferRoutes);

// Homepage / Dashboard
app.get('/', function(req, res) {
    if (!req.cookies || !req.cookies.userId) {
        return res.redirect('/login');
    }

    res.render('index', {
        userId: req.cookies.userId,
        username: req.cookies.username,
        fullName: req.cookies.fullName,
        role: req.cookies.role
    });
});

// Vulnerable Admin Debug Console - Privilege Escalation via Cookie tampering
app.get('/admin', function(req, res) {
    // Insecure Authorization: Relies purely on plaintext user-controlled cookie value
    if (!req.cookies || req.cookies.role !== 'admin') {
        return res.status(403).send("Access Denied: Administrator Privileges Required. (Hint: Check your cookies!)");
    }

    var queryResult = null;
    var error = null;
    res.render('admin', { queryResult: queryResult, error: error, sql: '' });
});

app.post('/admin', function(req, res) {
    if (!req.cookies || req.cookies.role !== 'admin') {
        return res.status(403).send("Access Denied.");
    }

    var sql = req.body.sql || '';
    console.log("[ADMIN DEBUG] Executing Arbitrary SQL:", sql);

    if (sql.trim().toUpperCase().startsWith('SELECT')) {
        db.all(sql, function(err, rows) {
            res.render('admin', { 
                queryResult: rows, 
                error: err ? err.message : null,
                sql: sql 
            });
        });
    } else {
        db.run(sql, function(err) {
            res.render('admin', { 
                queryResult: { rowsAffected: this.changes, lastID: this.lastID, status: "Command Executed Successfully" }, 
                error: err ? err.message : null,
                sql: sql 
            });
        });
    }
});

// Global Error Handler exposing Stack Traces (Information Disclosure)
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('<h1>Internal Server Error</h1><pre>' + err.stack + '</pre>');
});

// Start server
var PORT = process.env.PORT || 3000;
app.listen(PORT, function() {
    console.log('========================================================');
    console.log(' Legacy Core Banking App running on http://localhost:' + PORT);
    console.log(' WARNING: Intentionally vulnerable application.');
    console.log('========================================================');
});

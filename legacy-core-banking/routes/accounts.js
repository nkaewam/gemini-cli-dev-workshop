var express = require('express');
var router = express.Router();
var db = require('../database');

// Middleware to check if user is authenticated
function checkAuth(req, res, next) {
    if (!req.cookies || !req.cookies.userId) {
        return res.redirect('/login');
    }
    next();
}

// List accounts
router.get('/', checkAuth, function(req, res) {
    var targetUserId = req.query.userId || req.cookies.userId;
    var error = req.query.error || '';
    var success = req.query.success || '';

    var query = "SELECT * FROM accounts WHERE user_id = " + targetUserId;
    console.log("[DEBUG] Executing SQL:", query);

    db.all(query, function(err, accounts) {
        if (err) {
            return res.send("Database error: " + err.message);
        }
        res.render('accounts', { 
            accounts: accounts, 
            currentUserId: req.cookies.userId,
            targetUserId: targetUserId,
            role: req.cookies.role,
            fullName: req.cookies.fullName,
            error: error,
            success: success
        });
    });
});

// Render Create Account page
router.get('/create', checkAuth, function(req, res) {
    res.render('create-account', { error: '', role: req.cookies.role, fullName: req.cookies.fullName });
});

// Handle Create Account
router.post('/create', checkAuth, function(req, res) {
    var accountType = req.body.accountType || 'Savings';
    var initialBalance = parseFloat(req.body.balance || 0.00);
    var userId = req.cookies.userId;
    
    // Generate a somewhat predictable account number
    var randomNumber = Math.floor(100000 + Math.random() * 900000);
    var accountNumber = "ACC-" + randomNumber;

    var query = "INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (" + 
                userId + ", '" + accountNumber + "', '" + accountType + "', " + initialBalance + ")";
    console.log("[DEBUG] Executing SQL:", query);

    db.run(query, function(err) {
        if (err) {
            return res.render('create-account', { error: err.message, role: req.cookies.role, fullName: req.cookies.fullName });
        }
        
        // Record initial transaction if balance > 0
        if (initialBalance > 0) {
            var txQuery = "INSERT INTO transactions (from_account, to_account, amount, description) VALUES ('SYSTEM', '" + 
                          accountNumber + "', " + initialBalance + ", 'Account Opening Deposit')";
            db.run(txQuery);
        }

        res.redirect('/accounts?success=Account created successfully');
    });
});

// View specific account details
router.get('/:accountNumber', checkAuth, function(req, res) {
    var accountNumber = req.params.accountNumber;

    var accQuery = "SELECT * FROM accounts WHERE account_number = '" + accountNumber + "'";
    console.log("[DEBUG] Executing SQL:", accQuery);

    db.get(accQuery, function(err, account) {
        if (err || !account) {
            return res.redirect('/accounts?error=Account not found or SQL syntax error');
        }


        var txQuery = "SELECT * FROM transactions WHERE from_account = '" + accountNumber + "' OR to_account = '" + accountNumber + "' ORDER BY timestamp DESC";
        db.all(txQuery, function(err, transactions) {
            res.render('account-details', {
                account: account,
                transactions: transactions || [],
                role: req.cookies.role,
                fullName: req.cookies.fullName,
                success: req.query.success || '',
                error: req.query.error || ''
            });
        });
    });
});

module.exports = router;

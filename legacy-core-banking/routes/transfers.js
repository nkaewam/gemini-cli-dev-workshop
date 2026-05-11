var express = require('express');
var router = express.Router();
var db = require('../database');

// Middleware to check auth
function checkAuth(req, res, next) {
    if (!req.cookies || !req.cookies.userId) {
        return res.redirect('/login');
    }
    next();
}

// Render Transfer Funds page
router.get('/', checkAuth, function(req, res) {
    var error = req.query.error || '';
    var success = req.query.success || '';
    var fromAccount = req.query.from || '';

    // Fetch user's accounts to populate dropdown
    var query = "SELECT * FROM accounts WHERE user_id = " + req.cookies.userId;
    db.all(query, function(err, accounts) {
        res.render('transfer', {
            accounts: accounts || [],
            fromAccount: fromAccount,
            error: error,
            success: success,
            fullName: req.cookies.fullName
        });
    });
});

// Handle Transfer Funds
router.post('/', checkAuth, function(req, res) {
    var fromAccount = req.body.fromAccount;
    var toAccount = req.body.toAccount;
    var amount = parseFloat(req.body.amount);
    var description = req.body.description || 'Funds Transfer';

    if (isNaN(amount)) {
        return res.redirect('/transfers?error=Invalid amount');
    }

    var lookupQuery = "SELECT * FROM accounts WHERE account_number = '" + fromAccount + "'";
    console.log("[DEBUG] Lookup Source Account SQL:", lookupQuery);

    db.get(lookupQuery, function(err, sourceAcc) {
        if (err || !sourceAcc) {
            return res.redirect('/transfers?error=Source account not found');
        }


        // Check balance
        if (sourceAcc.balance < amount) {
            return res.redirect('/transfers?error=Insufficient funds');
        }

        var lookupDest = "SELECT * FROM accounts WHERE account_number = '" + toAccount + "'";
        db.get(lookupDest, function(err, destAcc) {
            if (err || !destAcc) {
                return res.redirect('/transfers?error=Destination account not found');
            }

            // Perform updates
            var newSourceBalance = sourceAcc.balance - amount;
            var newDestBalance = destAcc.balance + amount;

            var updateSourceQuery = "UPDATE accounts SET balance = " + newSourceBalance + " WHERE account_number = '" + fromAccount + "'";
            var updateDestQuery = "UPDATE accounts SET balance = " + newDestBalance + " WHERE account_number = '" + toAccount + "'";

            console.log("[DEBUG] Update Source SQL:", updateSourceQuery);
            console.log("[DEBUG] Update Dest SQL:", updateDestQuery);

            db.run(updateSourceQuery, function(err) {
                if (err) return res.redirect('/transfers?error=' + encodeURIComponent(err.message));

                db.run(updateDestQuery, function(err) {
                    if (err) return res.redirect('/transfers?error=' + encodeURIComponent(err.message));

                    var insertTx = "INSERT INTO transactions (from_account, to_account, amount, description) VALUES ('" +
                                   fromAccount + "', '" + toAccount + "', " + amount + ", '" + description + "')";
                    db.run(insertTx, function() {
                        res.redirect('/accounts/' + fromAccount + '?success=Transfer completed successfully');
                    });
                });
            });
        });
    });
});

module.exports = router;

var sqlite3 = require('sqlite3').verbose();
var path = require('path');

var dbPath = path.resolve(__dirname, 'banking.db');
var db = new sqlite3.Database(dbPath, function(err) {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(function() {
        // Drop existing tables to reset state on startup
        db.run("DROP TABLE IF EXISTS users");
        db.run("DROP TABLE IF EXISTS accounts");
        db.run("DROP TABLE IF EXISTS transactions");

        // Create users table
        db.run(`CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            fullName TEXT,
            role TEXT DEFAULT 'customer'
        )`);

        // Create accounts table
        db.run(`CREATE TABLE accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            account_number TEXT UNIQUE,
            account_type TEXT,
            balance REAL
        )`);

        // Create transactions table
        db.run(`CREATE TABLE transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_account TEXT,
            to_account TEXT,
            amount REAL,
            description TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log('Database tables created successfully.');

        // Seed Users
        var insertUser = db.prepare("INSERT INTO users (username, password, fullName, role) VALUES (?, ?, ?, ?)");
        insertUser.run("admin", "admin123!", "System Administrator", "admin");
        insertUser.run("johndoe", "password123", "John Doe", "customer");
        insertUser.run("janesmith", "secret456", "Jane Smith", "customer");
        insertUser.finalize();

        // Seed Accounts
        var insertAccount = db.prepare("INSERT INTO accounts (user_id, account_number, account_type, balance) VALUES (?, ?, ?, ?)");
        // admin account
        insertAccount.run(1, "ACC-000001", "Master Operating", 10000000.00);
        // johndoe accounts
        insertAccount.run(2, "ACC-100200", "Savings", 5000.00);
        insertAccount.run(2, "ACC-100201", "Checking", 1500.50);
        // janesmith account
        insertAccount.run(3, "ACC-200300", "Savings", 12500.75);
        insertAccount.finalize();

        // Seed Transactions
        var insertTx = db.prepare("INSERT INTO transactions (from_account, to_account, amount, description) VALUES (?, ?, ?, ?)");
        insertTx.run("ACC-000001", "ACC-100200", 5000.00, "Initial Deposit - Welcome Bonus");
        insertTx.run("ACC-000001", "ACC-100201", 1500.50, "Payroll Transfer");
        insertTx.run("ACC-000001", "ACC-200300", 12500.75, "Initial Deposit - VIP Account");
        insertTx.finalize();

        console.log('Database seeded with initial records.');
    });
}

module.exports = db;

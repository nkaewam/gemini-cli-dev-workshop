process.env.DB_PATH = ':memory:';
const request = require('supertest');
const app = require('../server');
const db = require('../database');

describe('Transfers API', () => {
    const getAccount = (accNum) => {
        return new Promise((resolve, reject) => {
            db.get("SELECT balance FROM accounts WHERE account_number = ?", [accNum], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    it('should redirect to login if not authenticated', async () => {
        const res = await request(app).get('/transfers');
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toEqual('/login');
    });

    it('should render transfer page if authenticated', async () => {
        const res = await request(app)
            .get('/transfers')
            .set('Cookie', ['userId=2']);
        expect(res.statusCode).toEqual(200);
        expect(res.text).toContain('Wire Funds Transfer');
    });

    it('should handle transfer funds', async () => {
        const res = await request(app)
            .post('/transfers')
            .set('Cookie', ['userId=2'])
            .send({
                fromAccount: 'ACC-100200',
                toAccount: 'ACC-100201',
                amount: 100,
                description: 'Test Transfer'
            });
        
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toContain('/accounts/ACC-100200');
        
        const sourceAcc = await getAccount('ACC-100200');
        expect(sourceAcc.balance).toEqual(4900);
        
        const destAcc = await getAccount('ACC-100201');
        expect(destAcc.balance).toEqual(1600.50);
    });

    it('should fail if insufficient funds', async () => {
        const res = await request(app)
            .post('/transfers')
            .set('Cookie', ['userId=2'])
            .send({
                fromAccount: 'ACC-100201', // Has 1500.50
                toAccount: 'ACC-100200',
                amount: 2000,
                description: 'Test Transfer'
            });
        
        expect(res.statusCode).toEqual(302);
        expect(res.headers.location).toContain('error=Insufficient%20funds');
    });
});

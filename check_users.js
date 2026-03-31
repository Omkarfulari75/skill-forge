const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    try {
        console.log('--- Admins ---');
        const [admins] = await connection.execute('SELECT id, name, email, password FROM admins');
        console.log(JSON.stringify(admins, null, 2));

        console.log('\n--- Instructors ---');
        const [instructors] = await connection.execute('SELECT id, name, email, password FROM instructors');
        console.log(JSON.stringify(instructors, null, 2));
    } catch (err) {
        console.error('Query failed:', err);
    } finally {
        await connection.end();
    }
}

check();

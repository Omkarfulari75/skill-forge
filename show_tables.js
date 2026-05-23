const mysql = require('mysql2/promise');
require('dotenv').config();

async function showTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    try {
        console.log('\n=== ADMINS ===');
        const [admins] = await connection.execute('SELECT id, name, email FROM admins');
        console.table(admins);

        console.log('\n=== INSTRUCTORS ===');
        const [instructors] = await connection.execute('SELECT id, name, email FROM instructors');
        console.table(instructors);

        console.log('\n=== COURSES ===');
        const [courses] = await connection.execute('SELECT id, title, difficulty FROM courses LIMIT 10');
        console.table(courses);

        console.log('\n(Shown only first 10 courses for brevity)');
    } catch (err) {
        console.error('Error fetching data:', err.message);
    } finally {
        await connection.end();
    }
}

showTables();

const db = require('./db');
db.query('SELECT id, name FROM students LIMIT 1', (err, students) => {
    if (err) { console.error(err); process.exit(1); }
    db.query('SELECT id, title FROM courses LIMIT 1', (err, courses) => {
        if (err) { console.error(err); process.exit(1); }
        console.log(JSON.stringify({student: students[0], course: courses[0]}));
        process.exit(0);
    });
});

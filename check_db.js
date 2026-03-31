const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

db.connect();

db.query("SELECT * FROM instructors", (err, results) => {
  if (err) console.error("Instructors Table Error:", err);
  else console.log("Instructors:", results);

  db.query("SELECT * FROM courses", (err, results) => {
    if (err) console.error("Courses Table Error:", err);
    else console.log("Courses:", results);
    process.exit();
  });
});

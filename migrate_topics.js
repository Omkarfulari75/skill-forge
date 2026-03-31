const db = require("./db");
const sql = "ALTER TABLE topics ADD COLUMN youtube_link VARCHAR(511), ADD COLUMN generic_link VARCHAR(511);";
db.query(sql, (err) => {
    if (err) {
        if (err.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Columns already exist.");
        } else {
            console.error("Migration Error:", err);
            process.exit(1);
        }
    } else {
        console.log("Migration successful: Added youtube_link and generic_link to topics table.");
    }
    process.exit(0);
});

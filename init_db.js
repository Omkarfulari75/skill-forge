require("dotenv").config();
const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || ""
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("Connected to MySQL server");

  connection.query("CREATE DATABASE IF NOT EXISTS skillforge", (err) => {
    if (err) throw err;
    console.log("Database 'skillforge' created or already exists");

    connection.query("USE skillforge", (err) => {
      if (err) throw err;

      // Drop tables in correct order to avoid FK constraints
      const dropQueries = [
        "DROP TABLE IF EXISTS student_progress",
        "DROP TABLE IF EXISTS student_course_levels",
        "DROP TABLE IF EXISTS questions",
        "DROP TABLE IF EXISTS quizzes",
        "DROP TABLE IF EXISTS materials",
        "DROP TABLE IF EXISTS topics",
        "DROP TABLE IF EXISTS subjects",
        "DROP TABLE IF EXISTS courses"
      ];

      const createStudents = `
        CREATE TABLE IF NOT EXISTS students (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT NULL,
          points INT DEFAULT 0
        )
      `;

      const createInstructors = `
        CREATE TABLE IF NOT EXISTS instructors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `;

      const createAdmins = `
        CREATE TABLE IF NOT EXISTS admins (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        )
      `;

      const createCourses = `
        CREATE TABLE IF NOT EXISTS courses (
          id INT AUTO_INCREMENT PRIMARY KEY,
          instructor_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          difficulty ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
          thumbnail_url VARCHAR(255),
          course_link VARCHAR(511),
          FOREIGN KEY (instructor_id) REFERENCES instructors(id) ON DELETE CASCADE
        )
      `;

      const createSubjects = `
        CREATE TABLE IF NOT EXISTS subjects (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `;

      const createTopics = `
        CREATE TABLE IF NOT EXISTS topics (
          id INT AUTO_INCREMENT PRIMARY KEY,
          subject_id INT NOT NULL,
          course_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          youtube_link VARCHAR(511),
          generic_link VARCHAR(511),
          FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `;

      const createMaterials = `
        CREATE TABLE IF NOT EXISTS materials (
          id INT AUTO_INCREMENT PRIMARY KEY,
          topic_id INT NOT NULL,
          course_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          type ENUM('video', 'pdf', 'link') NOT NULL,
          url TEXT NOT NULL,
          difficulty_level ENUM('Basic', 'Intermediate', 'Advanced') DEFAULT 'Basic',
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `;

      const createQuizzes = `
        CREATE TABLE IF NOT EXISTS quizzes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          topic_id INT NOT NULL,
          course_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          difficulty ENUM('Basic', 'Intermediate', 'Advanced') DEFAULT 'Basic',
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
        )
      `;

      const createQuestions = `
        CREATE TABLE IF NOT EXISTS questions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          quiz_id INT NOT NULL,
          question_text TEXT NOT NULL,
          option_a VARCHAR(255) NOT NULL,
          option_b VARCHAR(255) NOT NULL,
          option_c VARCHAR(255) NOT NULL,
          option_d VARCHAR(255) NOT NULL,
          correct_option CHAR(1) NOT NULL,
          FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
        )
      `;

      const createStudentCourseLevels = `
        CREATE TABLE IF NOT EXISTS student_course_levels (
          student_id INT NOT NULL,
          course_id INT NOT NULL,
          level ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED') DEFAULT 'BEGINNER',
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          PRIMARY KEY (student_id, course_id)
        )
      `;

      const createStudentProgress = `
        CREATE TABLE IF NOT EXISTS student_progress (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          course_id INT NOT NULL,
          topic_id INT NOT NULL,
          last_score INT DEFAULT 0,
          attempts INT DEFAULT 0,
          status ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'NOT_STARTED',
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
          UNIQUE KEY student_course_topic (student_id, course_id, topic_id)
        )
      `;

      function runDrops(index) {
        if (index === dropQueries.length) {
          runCreates(0);
          return;
        }
        connection.query(dropQueries[index], (err) => {
          if (err) throw err;
          runDrops(index + 1);
        });
      }

      const createQueries = [
        createStudents,
        createInstructors,
        createAdmins,
        createCourses,
        createSubjects,
        createTopics,
        createMaterials,
        createQuizzes,
        createQuestions,
        createStudentCourseLevels,
        createStudentProgress
      ];

      function runCreates(index) {
        if (index === createQueries.length) {
          console.log("All tables ready");
          seedAdmin();
          return;
        }

        connection.query(createQueries[index], (err) => {
          if (err) throw err;
          runCreates(index + 1);
        });
      }

      function seedAdmin() {
        const adminEmail = 'admin@skillforge.com';
        const adminPass = 'admin123';
        const seedAdminQuery = `INSERT IGNORE INTO admins (name, email, password) VALUES ('System Admin', ?, ?)`;

        connection.query(seedAdminQuery, [adminEmail, adminPass], (err) => {
          if (err) throw err;
          console.log("Default admin seeded (if didn't exist)");
          console.log("Database initialization complete!");
          process.exit(0);
        });
      }

      runDrops(0);
    });
  });
});

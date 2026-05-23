require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("./db");
const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

let openai = null;
const apiKey = process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.trim() : null;
if (apiKey) {
  console.log("Initializing OpenAI with key: " + apiKey.substring(0, 10) + "...");
  openai = new OpenAI({
    apiKey: apiKey,
  });
} else {
  console.warn("WARNING: OPENAI_API_KEY is missing or empty. AI features will be disabled.");
}

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Multer Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "uploads/";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Static Files
app.use("/uploads", express.static("uploads"));

app.get("/", (req, res) => {
  res.send("SkillForge API is running successfully!");
});



app.post("/api/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (role === 'admin') return res.status(403).send({ error: "Admin registration restricted" });

  const table = role + 's';
  const sql = `INSERT INTO ${table} (name, email, password) VALUES (?, ?, ?)`;
  db.query(sql, [name, email, password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') return res.status(400).send({ error: "Email already registered" });
      return res.status(500).send({ error: "Database Error" });
    }
    res.send({ message: "Registration successful" });
  });
});

app.post("/api/login", (req, res) => {
  const { role, email, password } = req.body;
  const table = role + 's';
  const sql = `SELECT id, name, email ${role === 'student' ? ', level, points' : ''} FROM ${table} WHERE email = ? AND password = ?`;
  db.query(sql, [email, password], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    if (results.length > 0) {
      const user = results[0];
      user.role = role;
      res.send({ message: "Login Successful", user });
    } else {
      res.status(401).send({ error: "Invalid email or password" });
    }
  });
});



app.post("/api/generate-ai-quiz", async (req, res) => {
  const { topic } = req.body;

  const mockQuiz = [
    { question: `What is a core concept of ${topic || 'this subject'}?`, a: "Abstraction", b: "Iteration", c: "Recursion", d: "Scalability", correct: "a" },
    { question: "Which of these is a best practice?", a: "Hardcoding values", b: "Modular code", c: "Ignoring errors", d: "Global variables", correct: "b" },
    { question: "What does AI help with in this platform?", a: "Cooking", b: "Personalization", c: "Gaming", d: "Driving", correct: "b" },
    { question: "How is student progress measured?", a: "By time spent", b: "By height", c: "By points and level", d: "By age", correct: "c" },
    { question: "Which level is after Beginner?", a: "Novice", b: "Master", c: "Intermediate", d: "Expert", correct: "c" }
  ];

  if (!openai) {
    console.warn("OpenAI not configured, providing mock quiz.");
    return res.send(mockQuiz);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a professional quiz generator for SkillForge. Create a 5-question multiple choice quiz. Output ONLY a JSON array of objects with keys: question, a, b, c, d, correct (letter). Ensure each question is highly specific to the given topic and completely unique/randomized every time.",
        },
        { role: "user", content: `Generate a unique, randomized quiz for the topic: "${topic || "General Web Development"}". Ensure questions are technical, accurate, and different from previous ones. Current timestamp for randomness: ${new Date().toISOString()}` },
      ],
      timeout: 15000
    });

    const quiz = JSON.parse(completion.choices[0].message.content);
    res.send(quiz);
  } catch (err) {
    console.error("AI Error (Falling back to mock):", err.message);
    res.send(mockQuiz);
  }
});

app.post("/api/update-level", (req, res) => {
  const { student_id, course_id, score } = req.body;
  let level = 'BEGINNER';
  if (score === 5) level = 'ADVANCED';
  else if (score >= 3) level = 'INTERMEDIATE';

  const updateGlobalPoints = "UPDATE students SET points = points + ? WHERE id = ?";
  db.query(updateGlobalPoints, [score * 20, student_id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });

    if (course_id) {
      const updateCourseLevel = `
        INSERT INTO student_course_levels (student_id, course_id, level) 
        VALUES (?, ?, ?) 
        ON DUPLICATE KEY UPDATE level = ?`;
      db.query(updateCourseLevel, [student_id, course_id, level, level], (levelErr) => {
        if (levelErr) return res.status(500).send({ error: "Database Error saving level" });
        res.send({ message: "Level updated", level });
      });
    } else {
      res.send({ message: "Level updated globally", level });
    }
  });
});

app.post("/api/adaptive-learning", async (req, res) => {
  const { student_id, course_id, topic } = req.body;
  if (!openai) return res.status(503).send({ error: "AI Engine Offline" });

  // 1. Fetch Student Metrics for THIS COURSE from DB
  const sql = `
    SELECT s.*, 
           c.title as course_title,
           c.description as course_description,
           (SELECT JSON_ARRAYAGG(last_score) FROM student_progress WHERE student_id = s.id AND course_id = ?) as quiz_scores,
           (SELECT JSON_ARRAYAGG(t.name) FROM topics t WHERE t.course_id = ?) as all_course_topics,
           (SELECT JSON_ARRAYAGG(t.name) FROM student_progress sp JOIN topics t ON sp.topic_id = t.id WHERE sp.student_id = s.id AND sp.course_id = ? AND sp.status = 'COMPLETED') as topics_completed,
           (SELECT level FROM student_course_levels WHERE student_id = s.id AND course_id = ?) as course_level
    FROM students s 
    CROSS JOIN courses c ON c.id = ?
    WHERE s.id = ?`;

  db.query(sql, [course_id, course_id, course_id, course_id, course_id, student_id], async (err, results) => {
    if (err || results.length === 0) return res.status(500).send({ error: "Student or Course not found" });
    const student = results[0];

    // Prepare input data for AI
    const studentDataInput = {
      student_name: student.name,
      current_global_level: student.course_level || student.level || "BEGINNER",
      course_title: student.course_title,
      course_description: student.course_description,
      all_topics: student.all_course_topics || [],
      quiz_scores: student.quiz_scores || [],
      topics_completed: student.topics_completed || [],
      weak_topics: [], // AI will deduce this or we can fetch from DB
      strong_topics: [],
      time_spent: 0,
      accuracy: 0,
      recent_activity: "active"
    };

    try {
      const prompt = `You are the SkillForge AI Adaptive Learning Engine for the course: "${student.course_title}".
Course Description: ${student.course_description}
Full Curriculum Topics: ${JSON.stringify(student.all_course_topics)}

Analyze this student's progress: ${JSON.stringify(studentDataInput)}
Topic of interest (if any): ${topic || "General Course Proficiency"}

Current Timestamp: ${new Date().toISOString()} (Use this to ensure high randomness)

TASK:
1. Suggest the next topic the student should focus on from the "Full Curriculum Topics".
2. Adjust proficiency level based on score: 5/5 -> ADVANCED, 3-4/5 -> INTERMEDIATE, 0-2/5 -> BEGINNER.
3. Generate 5 UNIQUE, RANDOMIZED MCQs specifically related to the course content. DO NOT output generic questions. Each question MUST be highly specific to "${student.course_title}" and its curriculum.
4. Provide a performance analysis including strong/weak areas and specific suggestions for enhancement.
5. Provide a progress percentage based on the number of topics completed.

STRICT JSON OUTPUT ONLY:
{
  "next_lesson": "string",
  "next_lesson_links": { "youtube": "string", "reference": "string" },
  "recommended_level": "easy | medium | hard",
  "progress": { "percentage": number, "color": "red | yellow | green" },
  "quiz": { 
    "mcqs": [{"question": "", "options": ["", "", "", ""], "answer": "a|b|c|d", "associated_topic": "string"}]
  },
  "performance_analysis": { "strong_topics": [], "weak_topics": [], "suggestions": "string" }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      res.send(response);
    } catch (aiErr) {
      console.error("AI Adaptive Engine Error (Falling back to course-specific mock):", aiErr.message);

      const topics = student.all_course_topics || [topic, "Core Concepts", "Advanced Patterns"];
      const displayTopic = topics[Math.floor(Math.random() * topics.length)];

      const mockResponse = {
        next_lesson: `Mastering ${topics[0] || "Advanced Concepts"}`,
        next_lesson_links: {
          youtube: "https://www.youtube.com/results?search_query=" + encodeURIComponent(student.course_title + " " + (topics[0] || "")),
          reference: "https://en.wikipedia.org/wiki/" + encodeURIComponent(student.course_title)
        },
        recommended_level: student.level?.toLowerCase() || "medium",
        progress: { percentage: 45, color: "yellow" },
        quiz: {
          mcqs: [
            { question: `Which of the following is a primary objective in ${student.course_title}?`, options: ["Redundancy", "Optimization", "Manual Scaling", "Hardcoding"], answer: "b", associated_topic: displayTopic },
            { question: `In the context of ${displayTopic}, what is a best practice?`, options: ["Global state usage", "Modular design", "Ignoring exceptions", "Tight coupling"], answer: "b", associated_topic: displayTopic },
            { question: `Which concept is most related to ${student.course_title}?`, options: ["Iterative development", "Linear execution only", "Manual memory management", "Fixed architectures"], answer: "a", associated_topic: topics[0] || "General" },
            { question: `What does 'SkillForge' aim to help you build in ${student.course_title}?`, options: ["Physical tools", "Technical proficiency", "Gaming assets", "Basic awareness"], answer: "b", associated_topic: topics[0] || "General" },
            { question: `A student at ${student.level || 'BEGINNER'} level should focus on:`, options: ["Advanced research", "Foundational principles", "System retirement", "Hardware design"], answer: "b", associated_topic: topics[0] || "General" }
          ]
        },
        performance_analysis: {
          strong_topics: [displayTopic || "General Concepts"],
          weak_topics: ["Complex Implementations"],
          suggestions: `Continue focusing on the core principles of ${student.course_title} to build a strong foundation.`
        }
      };

      res.send(mockResponse);
    }
  });
});

app.post("/api/analyze-assessment", async (req, res) => {
  const { student_id, course_id, quiz_data, user_answers } = req.body;
  if (!openai) return res.status(503).send({ error: "AI Engine Offline" });

  const sql = `SELECT c.title, c.description FROM courses c WHERE c.id = ?`;
  db.query(sql, [course_id], async (err, results) => {
    if (err || results.length === 0) return res.status(500).send({ error: "Course not found" });
    const course = results[0];

    const assessmentInput = quiz_data.map((q, idx) => ({
      question: q.question,
      associated_topic: q.associated_topic,
      correct_answer: q.answer,
      user_answer: user_answers[idx],
      is_correct: user_answers[idx] === q.answer
    }));

    try {
      const prompt = `You are the SkillForge AI Adaptive Learning Engine for the course: "${course.title}".
Course Description: ${course.description}

A student just completed an assessment. Here are their results:
${JSON.stringify(assessmentInput, null, 2)}

TASK:
1. Analyze the results. Identify specifically which topics they struggled with (based on the associated_topic of questions they answered incorrectly).
2. Suggest the absolute best "next_lesson" topic for them to focus on to fix their weaknesses. If they got everything right, suggest an advanced topic.
3. Provide a constructive performance analysis. Be specific about what they missed and what they should study next.

STRICT JSON OUTPUT ONLY:
{
  "next_lesson": "string",
  "next_lesson_links": { "youtube": "string", "reference": "string" },
  "performance_analysis": { "strong_topics": ["string"], "weak_topics": ["string"], "suggestions": "string" }
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: prompt }],
        response_format: { type: "json_object" }
      });

      const response = JSON.parse(completion.choices[0].message.content);
      res.send(response);
    } catch (aiErr) {
      console.error("AI Analysis Error:", aiErr.message);

      const weakTopics = assessmentInput.filter(q => !q.is_correct).map(q => q.associated_topic);
      const uniqueWeak = [...new Set(weakTopics)];

      res.send({
        next_lesson: uniqueWeak.length > 0 ? uniqueWeak[0] : "Advanced Concepts",
        next_lesson_links: {
          youtube: "https://www.youtube.com/results?search_query=" + encodeURIComponent(course.title + " " + (uniqueWeak[0] || "")),
          reference: "https://en.wikipedia.org/wiki/" + encodeURIComponent(course.title)
        },
        performance_analysis: {
          strong_topics: assessmentInput.filter(q => q.is_correct).map(q => q.associated_topic),
          weak_topics: uniqueWeak,
          suggestions: uniqueWeak.length > 0 ? `Review the topics you missed, especially ${uniqueWeak.join(', ')}.` : "Great job! Keep up the good work."
        }
      });
    }
  });
});

// New Endpoint: Update Student Progress (Course-Specific)
app.post("/api/update-course-progress", (req, res) => {
  const { student_id, course_id, topic_id, score, status } = req.body;

  const sql = `
    INSERT INTO student_progress (student_id, course_id, topic_id, last_score, attempts, status)
    VALUES (?, ?, ?, ?, 1, ?)
    ON DUPLICATE KEY UPDATE 
      last_score = VALUES(last_score),
      attempts = attempts + 1,
      status = VALUES(status)`;

  db.query(sql, [student_id, course_id, topic_id, score, status], (err) => {
    if (err) {
      console.error("Update Progress Error:", err);
      return res.status(500).send({ error: "Database Error" });
    }

    // Also update global points
    db.query("UPDATE students SET points = points + ? WHERE id = ?", [score * 10, student_id], (pointErr) => {
      res.send({ message: "Progress updated successfully" });
    });
  });
});

app.get("/api/suggested-materials/:topic_id/:level", (req, res) => {
  const { topic_id, level } = req.params;
  const sql = "SELECT * FROM materials WHERE topic_id = ? AND difficulty_level = ?";
  db.query(sql, [topic_id, level], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/suggested-courses/:student_id", (req, res) => {
  const studentSql = "SELECT level FROM students WHERE id = ?";
  db.query(studentSql, [req.params.student_id], (err, results) => {
    if (err || results.length === 0) return res.status(500).send({ error: "Student not found" });

    const level = results[0].level || 'BEGINNER';
    const courseSql = "SELECT * FROM courses WHERE difficulty = ? OR ? = 'ADVANCED' LIMIT 6";
    db.query(courseSql, [level, level], (courseErr, courses) => {
      res.send({ level, courses });
    });
  });
});

app.get("/api/global-suggested-resources/:level", (req, res) => {
  const { level } = req.params;

  // Inclusive filtering: Student sees materials at their level and below
  let levels = ["'Basic'"];
  if (level === 'INTERMEDIATE') levels.push("'Intermediate'");
  if (level === 'ADVANCED') {
    levels.push("'Intermediate'");
    levels.push("'Advanced'");
  }

  const sql = `
    SELECT m.*, t.name as topic_name, s.name as subject_name, c.title as course_title 
    FROM materials m
    JOIN topics t ON m.topic_id = t.id
    JOIN subjects s ON t.subject_id = s.id
    JOIN courses c ON s.course_id = c.id
    WHERE m.difficulty_level IN (${levels.join(',')})
    ORDER BY FIELD(m.difficulty_level, 'Advanced', 'Intermediate', 'Basic')
    LIMIT 9
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error("Global Suggestions Error:", err);
      return res.status(500).send({ error: "Database Error" });
    }
    res.send(results);
  });
});



app.get("/api/courses/:instructor_id", (req, res) => {
  const { instructor_id } = req.params;
  const sql = "SELECT * FROM courses WHERE instructor_id = ?";
  db.query(sql, [instructor_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/courses", (req, res) => {
  const { instructor_id } = req.query;
  if (!instructor_id) return res.status(400).send({ error: "instructor_id required" });
  const sql = "SELECT * FROM courses WHERE instructor_id = ?";
  db.query(sql, [instructor_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/all-courses", (req, res) => {
  const sql = "SELECT * FROM courses";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

// New Endpoint: Get course-specific dashboard data
app.get("/api/course-dashboard/:student_id/:course_id", (req, res) => {
  const { student_id, course_id } = req.params;

  const progressSql = "SELECT * FROM student_progress WHERE student_id = ? AND course_id = ?";
  const courseSql = "SELECT * FROM courses WHERE id = ?";
  const topicsSql = "SELECT t.*, sp.status, sp.last_score FROM topics t LEFT JOIN student_progress sp ON t.id = sp.topic_id AND sp.student_id = ? WHERE t.course_id = ?";

  db.query(courseSql, [course_id], (err, courseResults) => {
    if (err || courseResults.length === 0) return res.status(404).send({ error: "Course not found" });

    db.query(topicsSql, [student_id, course_id], (topicErr, topicResults) => {
      if (topicErr) return res.status(500).send({ error: "Database Error (Topics)" });

      const subjectsSql = "SELECT * FROM subjects WHERE course_id = ?";
      db.query(subjectsSql, [course_id], (subjectErr, subjectResults) => {
        if (subjectErr) return res.status(500).send({ error: "Database Error (Subjects)" });

        const levelSql = "SELECT level FROM student_course_levels WHERE student_id = ? AND course_id = ?";
        db.query(levelSql, [student_id, course_id], (levelErr, levelResults) => {
          if (levelErr) return res.status(500).send({ error: "Database Error (Level)" });

          const courseLevel = levelResults.length > 0 ? levelResults[0].level : 'BEGINNER';

          const totalTopics = topicResults.length;
          const completedTopics = topicResults.filter(t => t.status === 'COMPLETED').length;
          const progressPercent = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

          res.send({
            course: courseResults[0],
            subjects: subjectResults,
            topics: topicResults,
            stats: {
              totalTopics,
              completedTopics,
              progressPercent,
              courseLevel
            }
          });
        });
      });
    });
  });
});

app.post("/api/courses", upload.single("thumbnail"), (req, res) => {
  console.log("Creating Course:", req.body);
  const { instructor_id, title, description, difficulty, course_link } = req.body;
  const thumbnail_url = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : null;
  const sql = "INSERT INTO courses (instructor_id, title, description, difficulty, thumbnail_url, course_link) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [instructor_id, title, description, difficulty, thumbnail_url, course_link], (err, result) => {
    if (err) {
      console.error("DB Error:", err);
      return res.status(500).send({ error: "Database Error", details: err.message });
    }
    res.send({ message: "Course created successfully", id: result.insertId });
  });
});

app.put("/api/courses/:id", upload.single("thumbnail"), (req, res) => {
  const { title, description, difficulty, course_link } = req.body;
  let sql = "UPDATE courses SET title = ?, description = ?, difficulty = ?, course_link = ?";
  const params = [title, description, difficulty, course_link];

  if (req.file) {
    const thumbnail_url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    sql += ", thumbnail_url = ?";
    params.push(thumbnail_url);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Course updated successfully" });
  });
});

app.delete("/api/courses/:id", (req, res) => {
  db.query("DELETE FROM courses WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Course deleted successfully" });
  });
});



app.get("/api/subjects/:course_id", (req, res) => {
  const { course_id } = req.params;
  db.query("SELECT * FROM subjects WHERE course_id = ?", [course_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/subjects", (req, res) => {
  const { course_id } = req.query;
  if (!course_id) return res.status(400).send({ error: "course_id required" });
  db.query("SELECT * FROM subjects WHERE course_id = ?", [course_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.post("/api/subjects", (req, res) => {
  const { course_id, name, description } = req.body;
  const sql = "INSERT INTO subjects (course_id, name, description) VALUES (?, ?, ?)";
  db.query(sql, [course_id, name, description], (err, result) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Subject added", id: result.insertId });
  });
});

app.put("/api/subjects/:id", (req, res) => {
  const { name, description } = req.body;
  const sql = "UPDATE subjects SET name = ?, description = ? WHERE id = ?";
  db.query(sql, [name, description, req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Subject updated" });
  });
});

app.delete("/api/subjects/:id", (req, res) => {
  db.query("DELETE FROM subjects WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Subject deleted" });
  });
});


app.get("/api/topics/:subject_id", (req, res) => {
  const { subject_id } = req.params;
  db.query("SELECT * FROM topics WHERE subject_id = ?", [subject_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/topics", (req, res) => {
  const { subject_id } = req.query;
  if (!subject_id) return res.status(400).send({ error: "subject_id required" });
  db.query("SELECT * FROM topics WHERE subject_id = ?", [subject_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.post("/api/topics", (req, res) => {
  const { subject_id, course_id, name, description, youtube_link, generic_link } = req.body;
  const sql = "INSERT INTO topics (subject_id, course_id, name, description, youtube_link, generic_link) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(sql, [subject_id, course_id, name, description, youtube_link, generic_link], (err, result) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Topic added", id: result.insertId });
  });
});

app.put("/api/topics/:id", (req, res) => {
  const { name, description, youtube_link, generic_link } = req.body;
  const sql = "UPDATE topics SET name = ?, description = ?, youtube_link = ?, generic_link = ? WHERE id = ?";
  db.query(sql, [name, description, youtube_link, generic_link, req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Topic updated" });
  });
});

app.delete("/api/topics/:id", (req, res) => {
  db.query("DELETE FROM topics WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Topic deleted" });
  });
});



app.get("/api/materials/:topic_id", (req, res) => {
  const { topic_id } = req.params;
  db.query("SELECT * FROM materials WHERE topic_id = ?", [topic_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.get("/api/materials", (req, res) => {
  const { topic_id } = req.query;
  if (!topic_id) return res.status(400).send({ error: "topic_id required" });
  db.query("SELECT * FROM materials WHERE topic_id = ?", [topic_id], (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results);
  });
});

app.post("/api/materials", upload.single("file"), (req, res) => {
  const { topic_id, course_id, title, description, type, difficulty_level, external_url } = req.body;
  const url = req.file ? `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}` : external_url;
  const sql = "INSERT INTO materials (topic_id, course_id, title, description, type, url, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [topic_id, course_id, title, description, type, url, difficulty_level], (err, result) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Material added", id: result.insertId, url });
  });
});

app.put("/api/materials/:id", upload.single("file"), (req, res) => {
  const { title, description, type, difficulty_level, external_url } = req.body;
  let sql = "UPDATE materials SET title = ?, description = ?, type = ?, difficulty_level = ?";
  const params = [title, description, type, difficulty_level];

  if (req.file) {
    const url = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`;
    sql += ", url = ?";
    params.push(url);
  } else if (external_url) {
    sql += ", url = ?";
    params.push(external_url);
  }

  sql += " WHERE id = ?";
  params.push(req.params.id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Material updated" });
  });
});

app.delete("/api/materials/:id", (req, res) => {
  db.query("DELETE FROM materials WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "Material deleted" });
  });
});


app.get("/api/admin/stats", (req, res) => {
  const statsSql = `
    SELECT 
      (SELECT COUNT(*) FROM students) as totalStudents,
      (SELECT COUNT(*) FROM instructors) as totalInstructors,
      (SELECT COUNT(*) FROM courses) as totalCourses
  `;
  db.query(statsSql, (err, results) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send(results[0]);
  });
});

app.get("/api/admin/users", (req, res) => {
  const studentsSql = "SELECT id, name, email, level, points, 'student' as role FROM students";
  const instructorsSql = "SELECT id, name, email, 'instructor' as role FROM instructors";

  db.query(studentsSql, (err, students) => {
    if (err) return res.status(500).send({ error: "Database Error (Students)" });

    db.query(instructorsSql, (err, instructors) => {
      if (err) return res.status(500).send({ error: "Database Error (Instructors)" });
      res.send({ students, instructors });
    });
  });
});

app.delete("/api/admin/users/:role/:id", (req, res) => {
  const { role, id } = req.params;
  const table = role === 'student' ? 'students' : 'instructors';
  const sql = `DELETE FROM ${table} WHERE id = ?`;

  db.query(sql, [id], (err) => {
    if (err) return res.status(500).send({ error: "Database Error" });
    res.send({ message: "User deleted successfully" });
  });
});

// ===============================
// ERROR HANDLER & START
// ===============================

app.use((err, req, res, next) => {
  console.error("CRITICAL ERROR:", err);
  res.status(500).send({ error: "Server Error", details: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[${new Date().toISOString()}] Server running on port ${PORT} (0.0.0.0)`);
});
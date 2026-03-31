const mysql = require('mysql2/promise');
require('dotenv').config();

async function seed() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE
    });

    console.log('Connected to database. Starting seeding...');

    const instructorId = 4;

    const courseTitles = [
        'Data Structures & Algorithms',
        'Database Management Systems',
        'Operating Systems',
        'Computer Networks',
        'Software Engineering'
    ];

    // Clean up existing courses with these titles to avoid duplicates during re-runs
    for (const title of courseTitles) {
        await connection.execute('DELETE FROM courses WHERE title = ? AND instructor_id = ?', [title, instructorId]);
    }

    const data = [
        {
            title: 'Data Structures & Algorithms',
            description: 'Master the fundamentals of problem-solving with DSA. Covers Arrays, Linked Lists, Trees, and Sorting.',
            difficulty: 'ADVANCED',
            subjects: [
                {
                    name: 'Linear Data Structures',
                    description: 'Sequential data organization',
                    topics: [
                        { name: 'Arrays & ArrayLists', description: 'Basic sequential storage', materials: [
                            { title: 'Array Basics', type: 'video', url: 'https://www.youtube.com/watch?v=N99_SJlShG0' },
                            { title: 'Array Notes', type: 'pdf', url: 'https://www.google.com/search?q=array+dsa+pdf' }
                        ]},
                        { name: 'Linked Lists', description: 'Dynamic memory allocation', materials: [
                            { title: 'Linked List Tutorial', type: 'video', url: 'https://www.youtube.com/watch?v=njTh_OwM6A8' },
                            { title: 'LL Cheat Sheet', type: 'pdf', url: 'https://www.google.com/search?q=linked+list+notes+pdf' }
                        ]}
                    ]
                },
                {
                    name: 'Non-Linear Data Structures',
                    description: 'Hierarchical and networked data',
                    topics: [
                        { name: 'Binary Trees', description: 'Tree traversal and height', materials: [
                            { title: 'Binary Trees Explained', type: 'video', url: 'https://www.youtube.com/watch?v=-DzowlcaRKw' }
                        ]},
                        { name: 'Graph Theory', description: 'Nodes and Edges', materials: [
                            { title: 'Graph Algorithms', type: 'video', url: 'https://www.youtube.com/watch?v=09_LlHjoEiY' }
                        ]}
                    ]
                }
            ]
        },
        {
            title: 'Database Management Systems',
            description: 'Learn SQL, Normalization, and ACID properties.',
            difficulty: 'INTERMEDIATE',
            subjects: [
                {
                    name: 'Relational Model',
                    description: 'Tables and Relationships',
                    topics: [
                        { name: 'SQL Basics', description: 'SELECT, INSERT, UPDATE', materials: [
                            { title: 'SQL Full Course', type: 'video', url: 'https://www.youtube.com/watch?v=HXV3zeQKqGY' }
                        ]},
                        { name: 'Normalization', description: '1NF, 2NF, 3NF', materials: [
                            { title: 'Normalization Explained', type: 'video', url: 'https://www.youtube.com/watch?v=UrYLYV7WSHM' }
                        ]}
                    ]
                }
            ]
        },
        {
            title: 'Operating Systems',
            description: 'Process Management, Memory, and File Systems.',
            difficulty: 'ADVANCED',
            subjects: [
                {
                    name: 'Process Management',
                    description: 'CPU Scheduling and Deadlocks',
                    topics: [
                        { name: 'Scheduling Algorithms', description: 'FCFS, SJF, RR', materials: [
                            { title: 'CPU Scheduling', type: 'video', url: 'https://www.youtube.com/watch?v=zFxaCly6S9U' }
                        ]},
                        { name: 'Deadlocks', description: 'Prevention and Avoidance', materials: [
                            { title: 'Deadlock Basics', type: 'video', url: 'https://www.youtube.com/watch?v=XofOOnM7-7E' }
                        ]}
                    ]
                }
            ]
        },
        {
            title: 'Computer Networks',
            description: 'ISO OSI Model, TCP/IP, and Routing.',
            difficulty: 'INTERMEDIATE',
            subjects: [
                {
                    name: 'Network Models',
                    description: 'OSI and TCP/IP layers',
                    topics: [
                        { name: 'OSI Layers', description: 'Physical to Application', materials: [
                            { title: 'OSI Model Guide', type: 'video', url: 'https://www.youtube.com/watch?v=vv4y_uOneC0' }
                        ]},
                        { name: 'IP Addressing', description: 'IPv4 and IPv6', materials: [
                            { title: 'IP Basics', type: 'video', url: 'https://www.youtube.com/watch?v=vcQZ8aVno2c' }
                        ]}
                    ]
                }
            ]
        },
        {
            title: 'Software Engineering',
            description: 'SDLC, Agile, and Testing.',
            difficulty: 'BEGINNER',
            subjects: [
                {
                    name: 'SDLC Models',
                    description: 'Waterfall, Spiral, Agile',
                    topics: [
                        { name: 'Agile Methodology', description: 'Scrum and Sprints', materials: [
                            { title: 'Agile Explained', type: 'video', url: 'https://www.youtube.com/watch?v=Z9QbYZh1YXY' }
                        ]}
                    ]
                }
            ]
        }
    ];

    for (const course of data) {
        const [courseResult] = await connection.execute(
            'INSERT INTO courses (instructor_id, title, description, difficulty) VALUES (?, ?, ?, ?)',
            [instructorId, course.title, course.description, course.difficulty]
        );
        const courseId = courseResult.insertId;
        console.log(`Added course: ${course.title} (ID: ${courseId})`);

        for (const subject of course.subjects) {
            const [subjectResult] = await connection.execute(
                'INSERT INTO subjects (course_id, name, description) VALUES (?, ?, ?)',
                [courseId, subject.name, subject.description]
            );
            const subjectId = subjectResult.insertId;

            for (const topic of subject.topics) {
                const [topicResult] = await connection.execute(
                    'INSERT INTO topics (subject_id, course_id, name, description) VALUES (?, ?, ?, ?)',
                    [subjectId, courseId, topic.name, topic.description]
                );
                const topicId = topicResult.insertId;

                if (topic.materials) {
                    for (const mat of topic.materials) {
                        await connection.execute(
                            'INSERT INTO materials (topic_id, course_id, title, url, type) VALUES (?, ?, ?, ?, ?)',
                            [topicId, courseId, mat.title, mat.url, mat.type]
                        );
                    }
                }
            }
        }
    }

    console.log('Seeding completed successfully.');
    await connection.end();
}

seed().catch(err => {
    console.error('Seeding failed:', err);
    process.exit(1);
});

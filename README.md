# SkillForge - Adaptive Learning Platform

SkillForge is a comprehensive learning platform designed to provide a personalized learning experience through an AI-driven adaptive engine.

## Features

- **Adaptive Learning Engine**: Generates personalized quizzes and recommends topics based on student proficiency levels (Beginner, Intermediate, Advanced).
- **Instructor Dashboard**: Allows instructors to manage courses, add topics, and provide reference materials (YouTube/Reference links).
- **Student Dashboard**: Provides students with a structured learning path, course selection, and performance tracking.
- **Role-Based Access**: Secure login for Students, Instructors, and Administrators.

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS.
- **Backend**: Node.js, Express.
- **Database**: MySQL.
- **AI Integration**: OpenAI GPT for adaptive content generation.

## Getting Started

### Prerequisites

- Node.js
- MySQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Omkarfulari75/skillforge-backend.git
   ```
2. Install dependencies for the backend:
   ```bash
   cd skillforge-backend
   npm install
   ```
3. Install dependencies for the frontend:
   ```bash
   cd frontend_react
   npm install
   ```
4. Set up your `.env` file with the following variables:
   ```env
   DB_HOST=localhost
   DB_USER=your_user
   DB_PASSWORD=your_password
   DB_DATABASE=skillforge
   PORT=5000
   OPENAI_API_KEY=your_openai_key
   ```

### Running the Application

1. Start the backend:
   ```bash
   npm start
   ```
2. Start the frontend:
   ```bash
   cd frontend_react
   npm run dev
   ```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

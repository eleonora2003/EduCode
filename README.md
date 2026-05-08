# AI Programming Task Generator

AI-powered web application for generating programming exercises for teachers and programming courses.

The application allows teachers to automatically generate:
- programming tasks
- test cases
- reference solutions

based on selected parameters such as:
- programming language
- programming concept
- difficulty level

---

# Features

## Current Features
- Generate programming tasks using OpenAI API
- Select:
  - Programming language
  - Concept/topic
  - Difficulty
- FastAPI backend
- React frontend

## Planned Features
- Test case generation
- Reference solution generation
- Docker sandbox execution
- Automatic validation
- Export to PDF / Markdown 

---

# Backend Setup

## Install dependencies

```bash
pip install -r requirements.txt
```

## requirements.txt

```txt
fastapi
uvicorn
openai
python-dotenv
```

## Environment Variables

Create `.env` file inside backend folder:

```env
OPENAI_API_KEY=your_api_key
```
---

# Running with Docker Compose

You can run both frontend and backend using Docker Compose.

---

# Docker Setup

## Start application

```bash
docker compose up --build
```

## Stop containers

```bash
docker compose down
```
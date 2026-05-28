# EduCode – AI-Powered Programming Task Generator

EduCode is an AI-powered web application designed for teachers, educators, and programming courses.

The platform helps generate complete programming exercises using artificial intelligence, including:
- programming tasks
- reference solutions
- unit tests
- validation workflows
- reusable custom templates

Teachers can quickly create high-quality exercises tailored to different:
- programming languages
- concepts/topics
- difficulty levels
- custom teaching templates

---

# Features

## AI Task Generation
- Generate programming exercises using OpenAI
- AI-generated:
  - task descriptions
  - reference solutions
  - unit tests
- Supports custom template-based generation

---

## Custom Template System
- Create reusable teaching templates
- Define:
  - programming language
  - concepts
  - difficulty
  - learning goals
  - restrictions
  - starter code
- View and delete saved templates
- Generate tasks directly from saved templates

---

## Task Management & History
- Save generated tasks
- View task history
- Store:
  - generated descriptions
  - tests
  - solutions
  - template metadata

---

## Validation System
- Validate generated solutions
- Docker-based execution environment
- Automated test execution
- Validation statistics and logs

---

## Export Features
Export tasks to:
- PDF
- Markdown
- Moodle XML

---

## Authentication System
- User registration and login
- JWT authentication
- Protected routes
- User-specific templates and task history

---

## AI Chat Assistant
- AI-assisted programming support
- Educational workflow assistance
- Interactive task generation support

---

# Technology Stack

## Frontend
- React
- React Router
- Axios

## Backend
- FastAPI
- SQLAlchemy
- JWT Authentication

## Database
- SQLite

## AI Integration
- OpenAI API

## DevOps
- Docker
- Docker Compose
- GitHub Actions CI/CD

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
sqlalchemy
python-dotenv
python-jose
passlib
bcrypt
pydantic
```

---

# Environment Variables

Create `.env` file inside backend folder:

```env
OPENAI_API_KEY=your_api_key
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

# Running with Docker Compose

Run frontend and backend together:

```bash
docker compose up --build
```

---

# Docker Commands

## Start application

```bash
docker compose up --build
```

## Stop containers

```bash
docker compose down
```

## Rebuild backend only

```bash
docker compose build --no-cache backend
```

---

# CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

## Pipeline Stages

1. **Build** - Builds Docker images for both backend and frontend
2. **Tests** - Runs backend (pytest) and frontend (Jest) tests with coverage reporting
3. **Deploy** - Deploys to the server using Docker Compose (only on main/master branch)

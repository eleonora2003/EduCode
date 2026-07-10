# EduCode – AI-Powered Programming Task Generator

**EduCode** is an AI-powered web application that helps teachers and educators quickly create, manage, validate, and export high-quality programming exercises.

Using the power of artificial intelligence, the platform automatically generates complete programming assignments including task descriptions, reference solutions, unit tests, and validation workflows — all tailored to specific programming languages, concepts, difficulty levels, and teaching goals.

---

## Live Demo

- **Frontend**: [https://dash.moltenpancake.club/](https://dash.moltenpancake.club/)
- **Backend API**: [https://api.moltenpancake.club/](https://api.moltenpancake.club/)
- **Screenshots & Gallery**: [View on GitHub Pages](https://eleonora2003.github.io/EduCode/)

---

## Features

### AI Task Generation
- Generate complete programming tasks using OpenAI
- Includes: task description, examples, reference solution and unit tests
- Support for multiple programming languages and concepts
- Refine or improve existing tasks with AI

### Custom Template System
Create reusable templates to speed up task creation. Templates can define:
- Programming language
- Concepts & topics
- Difficulty level
- Learning objectives
- Constraints & starter code

### Task Management
- Save and organize generated tasks
- Full task history
- Edit, update or delete tasks
- User-specific storage

### Automated Validation
Secure validation environment powered by Docker:
- Isolated sandbox execution
- Automatic unit test running
- Execution logs and statistics
- Time tracking and result evaluation

### Export Options
Export tasks and solutions in multiple formats:
- PDF
- DOCX
- Markdown
- Moodle XML

### AI Chat Assistant
Built-in AI assistant for additional help with task creation, code explanations and educational support.

### Authentication & Security
- User registration & login
- JWT authentication
- Google & GitHub OAuth
- Protected user-specific data

---

## Technology Stack

**Frontend**
- React
- React Router
- Axios

**Backend**
- FastAPI
- SQLAlchemy + Alembic
- Pydantic
- JWT Authentication

**Database**
- PostgreSQL

**AI**
- OpenAI API

**DevOps**
- Docker & Docker Compose
- GitHub Actions (CI/CD)

---

## Installation & Quick Start

### Using Docker Compose (Recommended)

```bash
git clone https://github.com/eleonora2003/EduCode
cd EduCode
docker compose up --build
```

The application will start both frontend and backend automatically.

# Backend Setup

## Install dependencies

```bash
pip install -r requirements.txt
```

---

# Environment Variables

Create `.env` file inside backend folder:

```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
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

# API Documentation

After starting the backend, interactive API documentation is available:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

# CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

## Pipeline Stages

1. **Build** - Builds Docker images for both backend and frontend
2. **Tests** - Runs backend (pytest) and frontend (Jest) tests with coverage reporting
3. **Deploy** - Deploys to the server using Docker Compose (only on main/master branch)

---

# Authors

- Eleonora Stankovska
- Mila Nastoska
- Neja Kašman


# Onboarding Platform - Backend API

FastAPI backend for the AI-powered onboarding platform.

## Features

- User management
- Learning progress tracking
- Quiz system with automatic grading
- Access request management
- Group-based provisioning
- Admin dashboard APIs

## API Endpoints

### Health
- `GET /health` - Health check

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/{user_id}` - Get user by ID
- `PUT /api/users/{user_id}` - Update user

### Learning Progress
- `GET /api/progress/{user_id}` - Get user progress
- `POST /api/progress` - Update progress
- `GET /api/progress/{user_id}/{module_id}` - Get module progress

### Quiz
- `GET /api/quiz/{module_id}` - Get quiz
- `POST /api/quiz/submit` - Submit quiz

### Access Requests
- `GET /api/access-requests` - Get all requests
- `GET /api/access-requests/user/{user_id}` - Get user requests
- `POST /api/access-requests` - Create request
- `PUT /api/access-requests/{request_id}/status` - Update status

### Dashboard
- `GET /api/dashboard/{user_id}` - Get user dashboard
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/users` - Get all users with progress

### Groups
- `POST /api/groups` - Create group
- `GET /api/groups` - Get all groups
- `POST /api/groups/{group_id}/assign/{user_id}` - Assign user to group

## Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py

# Server runs on http://localhost:8080
```

## Deploy to Container Hosting

```bash
# Build and run the Docker image from the backend directory
docker build -t onboarding-api .
docker run -p 8080:8080 onboarding-api
```

## Environment Variables

- `PORT` - Server port (default: 8080)

## Technology Stack

- FastAPI - Web framework
- Pydantic - Data validation
- Uvicorn - ASGI server
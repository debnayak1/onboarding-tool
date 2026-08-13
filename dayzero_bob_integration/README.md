# 🚀 Onboarding Agent - Team-Based Onboarding Platform
> **Bob-a-thon Day Zero** — Bob AI co-pilot integration built with IBM Bob

A comprehensive onboarding platform with **team-based access management** that provides automated workflows, learning modules, access provisioning, and progress tracking with visual analytics.

## 🤖 Bob AI Co-pilot Integration

Bob is embedded directly into the running application as an AI co-pilot. It operates at three layers:

### 1. In-App Chat Widget (`BobCopilot.jsx`)
A floating chat panel appears on every authenticated page (bottom-right corner). Engineers and admins can ask questions in plain English and get answers grounded in **live platform data**.

**Engineer examples:**
- *"What modules do I still need to complete?"*
- *"What should I start with?"*
- *"How do I request GitHub access?"*

**Admin examples:**
- *"Show me all critical pending requests"*
- *"Approve req_0001"*
- *"Approve all critical requests"*
- *"Give me a status report"*

### 2. Backend Chat Endpoint (`POST /bob/chat`)
The chat widget calls `/bob/chat` on the FastAPI backend. The endpoint queries live database state and returns context-aware responses. To upgrade to a real LLM (IBM watsonx.ai, OpenAI), replace the `_resolve_response()` function in `backend/main.py`.

### 3. MCP Server for Bob IDE (`backend/bob_mcp_server.py`)
A Model Context Protocol server that exposes 7 onboarding platform tools to Bob's IDE extension:

| Tool | Description |
|------|-------------|
| `get_engineer_progress` | Query any engineer's onboarding status |
| `list_pending_access_requests` | List pending/critical requests |
| `approve_access_request` | Approve a request by ID |
| `reject_access_request` | Reject with a reason |
| `assign_engineer_to_team` | Trigger the full onboarding workflow |
| `get_system_summary` | Platform-wide stats |
| `generate_learning_path` | Personalised module ordering |

**Register the MCP server in Bob IDE:**
```json
{
  "name": "onboarding-platform",
  "transport": "stdio",
  "command": "python",
  "args": ["backend/bob_mcp_server.py"]
}
```

### Cross-Session Continuity
`.bob/context/session-context.md` is a living handoff document. Bob updates it at the end of each session so the next session can resume without re-reading the entire codebase.

---

## 🆕 What's New: Team-Based Onboarding System

### Key Enhancements
- ✅ **Team Management**: Create and configure teams with custom access requirements
- ✅ **Repository Assignment**: Link repos to teams with automatic language detection
- ✅ **Smart Module Assignment**: Auto-assign learning based on repository languages
- ✅ **Automated Workflows**: Assign engineer → create access requests → assign modules
- ✅ **Progress Tracking**: Monitor engineer onboarding status and completion
- ✅ **Conditional Access**: Grant repository access after requirements are met

## 📋 Features

### For Engineers
- **Personalized Dashboard**: Team-specific view with assigned modules and progress
- **Automatic Onboarding**: Get access requests and modules when assigned to team
- **Learning Path**: Complete required and language-specific modules
- **Progress Tracking**: Track completion percentage and time spent
- **Access Status**: View pending, approved, and rejected access requests
- **Repository Access**: Access team repos after completing requirements
- **Quiz System**: Test knowledge with interactive quizzes

### For Admins
- **Team Management**: Create teams, configure access, assign repositories
- **Access Configuration**: Set platform requirements (GitHub, IBM Cloud, Artifactory, Jira, Access Hub)
- **Engineer Assignment**: Assign engineers to teams with automatic workflow execution
- **Module Configuration**: Set required modules and enable auto-assignment
- **Progress Monitoring**: Track team member onboarding status
- **Access Approval**: Review and approve/reject access requests
- **System Analytics**: Monitor overall system usage and statistics

## 🏗️ Architecture

### Backend (FastAPI)
- RESTful API with JWT authentication
- In-memory data storage (can be upgraded to database)
- 20+ endpoints for complete functionality
- CORS enabled for frontend integration

### Frontend (React + Vite)
- Modern React with hooks
- Recharts for data visualization
- Responsive design with custom CSS
- Client-side routing with React Router

## 🚀 Quick Start

### Prerequisites
- Python 3.9+ (for backend)
- Node.js 18+ (for frontend)
- npm or yarn

### Option 1: Using Startup Scripts (Recommended)

#### Start Backend
```bash
./start-backend.sh
```
Backend will be available at: http://localhost:8080
API Documentation: http://localhost:8080/docs

#### Start Frontend (in a new terminal)
```bash
./start-frontend.sh
```
Frontend will be available at: http://localhost:3000

### Option 2: Manual Setup

#### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8080 --reload
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 👤 Demo Credentials

### Admin Account
- Username: `admin`
- Password: `admin123`
- Access: Full system access, user management, access request approval

### Engineer Account
- Username: `john_doe`
- Password: `password123`
- Access: Learning modules, quizzes, access requests

## 📊 Key Features Demonstration

### 1. Dashboard with Analytics
- Overall progress percentage
- Average quiz score
- Module status distribution (pie chart)
- Quiz performance visualization (pie chart)
- Recent learning activity

### 2. Learning Modules
- Browse available modules
- Track progress per module
- Mark modules as complete
- View learning objectives

### 3. Quiz System
- Take interactive quizzes
- Get instant results with pie charts
- View detailed question-by-question breakdown
- Identify areas to revisit
- Track quiz history

### 4. Access Request Management
- Request access to platforms
- Track request status
- Admin approval workflow
- Urgency levels (low, normal, high, critical)

### 5. Admin Dashboard
- View all users
- Manage access requests
- System statistics
- Approve/reject requests with notes

## 🎯 Use Cases

### New Joiner Onboarding
1. New engineer logs in
2. Completes learning modules
3. Takes quizzes to test knowledge
4. Views progress on dashboard with pie charts
5. Requests access to required platforms
6. Admin approves access

### Knowledge Assessment
1. Engineer takes quiz
2. System shows results with pie chart
3. Identifies weak areas
4. Suggests modules to revisit
5. Engineer reviews and retakes quiz

### Access Management
1. Engineer submits access request
2. Admin receives notification
3. Admin reviews justification
4. Admin approves/rejects with notes
5. Engineer gets notified

## 📁 Project Structure

```
ISL-zSW-Bobathon_dayzero_090626/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   ├── Dockerfile          # Container configuration
│   └── README.md           # Backend documentation
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json        # Node dependencies
│   └── vite.config.js      # Vite configuration
├── docs/
│   ├── agent-architecture-design.md
│   ├── ibm-cloud-free-tier-architecture.md
│   └── 3-hour-implementation-guide.md
├── start-backend.sh        # Backend startup script
├── start-frontend.sh       # Frontend startup script
└── README.md              # This file
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration

### Users
- `GET /users/me` - Get current user
- `PUT /users/{user_id}` - Update user

### Learning
- `GET /learning/modules` - Get all modules
- `GET /learning/modules/{module_id}` - Get module details
- `POST /learning/progress/{user_id}/{module_id}` - Update progress
- `GET /learning/progress/{user_id}` - Get user progress

### Quizzes
- `GET /quizzes` - Get all quizzes
- `GET /quizzes/{quiz_id}` - Get quiz details
- `POST /quizzes/{quiz_id}/submit` - Submit quiz answers
- `GET /quizzes/results/{user_id}` - Get quiz results

### Access Requests
- `POST /access/requests` - Create access request
- `GET /access/requests/user/{user_id}` - Get user requests
- `GET /access/requests` - Get all requests (admin)
- `PUT /access/requests/{request_id}` - Update request status (admin)

### Admin
- `GET /admin/users` - Get all users
- `GET /admin/users/{user_id}/stats` - Get user statistics
- `GET /admin/stats` - Get system statistics

## 🎨 UI Features

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Modern UI**: Clean, professional interface with IBM Carbon-inspired design
- **Data Visualization**: Pie charts for progress and quiz results using Recharts
- **Interactive Elements**: Hover effects, smooth transitions
- **Status Badges**: Color-coded status indicators
- **Progress Bars**: Visual progress tracking

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Protected routes
- Role-based access control (RBAC)
- CORS configuration

## 🚀 Deployment Options

### Local Development (Current)
- Backend: http://localhost:8080
- Frontend: http://localhost:3000

### Production Deployment Options
1. **Docker**: Use provided Dockerfile
2. **IBM Cloud Code Engine**: Deploy as containerized app
3. **Heroku**: Deploy backend and frontend separately
4. **Vercel/Netlify**: Deploy frontend (static)
5. **AWS/Azure**: Deploy on cloud infrastructure

## 📈 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Email notifications
- [ ] Real-time chat support
- [ ] Video tutorials
- [ ] Certificate generation
- [ ] Mobile app
- [ ] SSO integration
- [ ] Advanced analytics
- [ ] Gamification features
- [ ] Multi-language support

## 🐛 Troubleshooting

### Backend Issues
- **Port already in use**: Change port in `start-backend.sh` or kill process on port 8080
- **Module not found**: Ensure virtual environment is activated and dependencies installed
- **CORS errors**: Check CORS configuration in `main.py`

### Frontend Issues
- **Dependencies error**: Delete `node_modules` and run `npm install` again
- **API connection failed**: Ensure backend is running on port 8080
- **Build errors**: Check Node.js version (requires 18+)

## 📝 License

This project is created for internal use and demonstration purposes.

## 👥 Contributors

- Architecture Design
- Backend Development (FastAPI)
- Frontend Development (React)
- UI/UX Design
- Documentation

## 📞 Support

For issues or questions:
1. Check the documentation in `/docs` folder
2. Review API documentation at http://localhost:8080/docs
3. Check troubleshooting section above

---

**Built with ❤️ for seamless onboarding experience**
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const login = (username, password) => 
  api.post('/auth/login', { username, password });

export const register = (userData) => 
  api.post('/auth/register', userData);

// User APIs
export const getCurrentUser = () => 
  api.get('/users/me');

export const updateUser = (userId, userData) => 
  api.put(`/users/${userId}`, userData);

// Learning APIs
export const getModules = () => 
  api.get('/learning/modules');

export const getModuleContent = (moduleId) => 
  api.get(`/learning/modules/${moduleId}`);

export const updateProgress = (userId, moduleId, progressData) => 
  api.post(`/learning/progress/${userId}/${moduleId}`, progressData);

export const getUserProgress = (userId) => 
  api.get(`/learning/progress/${userId}`);

// Quiz APIs
export const getQuizzes = () => 
  api.get('/quizzes');

export const getQuiz = (quizId) => 
  api.get(`/quizzes/${quizId}`);

export const submitQuiz = (userId, quizId, answers) => 
  api.post(`/quizzes/${quizId}/submit`, { user_id: userId, answers });

export const getQuizResults = (userId) => 
  api.get(`/quizzes/results/${userId}`);

// Access Request APIs
export const createAccessRequest = (requestData) => 
  api.post('/access/requests', requestData);

export const getAccessRequests = (userId) => 
  api.get(`/access/requests/user/${userId}`);

export const getAllAccessRequests = () => 
  api.get('/access/requests');

export const updateAccessRequest = (requestId, status, adminNotes = '') => 
  api.put(`/access/requests/${requestId}`, { status, admin_notes: adminNotes });

// Admin APIs
export const getAllUsers = () => 
  api.get('/admin/users');

export const getUserStats = (userId) => 
  api.get(`/admin/users/${userId}/stats`);

export const getSystemStats = () =>
  api.get('/admin/stats');

// ============= ENHANCED V2 APIs =============

// Team Management APIs
export const createTeam = (teamData) =>
  api.post('/api/v2/teams', teamData);

export const getAllTeams = () =>
  api.get('/api/v2/teams');

export const getTeam = (teamId) =>
  api.get(`/api/v2/teams/${teamId}`);

export const updateTeamConfiguration = (teamId, configData) =>
  api.put(`/api/v2/teams/${teamId}/configuration`, configData);

export const getTeamMembersProgress = (teamId) =>
  api.get(`/api/v2/admin/teams/${teamId}/members`);

// Repository Management APIs
export const createRepository = (repoData) =>
  api.post('/api/v2/repositories', repoData);

export const getAllRepositories = () =>
  api.get('/api/v2/repositories');

export const getTeamRepositories = (teamId) =>
  api.get(`/api/v2/repositories/team/${teamId}`);

// Learning Module APIs (Enhanced)
export const createLearningModule = (moduleData) =>
  api.post('/api/v2/modules', moduleData);

export const getAllModules = () =>
  api.get('/api/v2/modules');

export const getModulesByLanguage = (language) =>
  api.get(`/api/v2/modules/language/${language}`);

// Engineer Onboarding APIs
export const assignEngineerToTeam = (userId, teamId) =>
  api.post(`/api/v2/engineers/${userId}/assign-team/${teamId}`);

export const getEngineerDashboard = (userId) =>
  api.get(`/api/v2/engineers/${userId}/dashboard`);

export const updateModuleProgress = (userId, moduleId, progressData) =>
  api.put(`/api/v2/engineers/${userId}/modules/${moduleId}/progress`, progressData);

// Admin Dashboard APIs (Enhanced)
export const getAdminDashboardV2 = () =>
  api.get('/api/v2/admin/dashboard');

export default api;


import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Learning from './pages/Learning';
import Quiz from './pages/Quiz';
import AccessRequest from './pages/AccessRequest';
import AdminDashboard from './pages/AdminDashboard';
import AdminTeamManagement from './pages/AdminTeamManagement';
import AdminTeamManagementSimple from './pages/AdminTeamManagementSimple';
import EngineerDashboard from './pages/EngineerDashboard';
import DiagnosticPage from './pages/DiagnosticPage';
import Header from './components/Header';
import AICopilot from './components/AICopilot';
import { getCurrentUser } from './services/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser()
        .then(response => {
          setUser(response.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      {user && <Header user={user} onLogout={handleLogout} />}
      {user && <AICopilotWrapper user={user} />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === 'admin' ? "/admin" : "/dashboard"} /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={user ? (
            user.role === 'admin' ? <Navigate to="/admin" /> :
            user.role === 'engineer' ? <EngineerDashboard user={user} /> : <Dashboard user={user} />
          ) : <Navigate to="/login" />}
        />
        <Route 
          path="/learning" 
          element={user ? <Learning user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/quiz" 
          element={user ? <Quiz user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/access" 
          element={user ? <AccessRequest user={user} /> : <Navigate to="/login" />} 
        />
        <Route
          path="/admin"
          element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/admin/teams"
          element={user?.role === 'admin' ? <AdminTeamManagement user={user} /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/admin/teams-simple"
          element={user?.role === 'admin' ? <AdminTeamManagementSimple /> : <Navigate to="/dashboard" />}
        />
        <Route
          path="/diagnostic"
          element={<DiagnosticPage />}
        />
        <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? "/admin" : "/dashboard") : "/login"} />} />
      </Routes>
    </Router>
  );
}

/** Wrapper reads the current pathname inside Router context and passes it to AICopilot */
function AICopilotWrapper({ user }) {
  const location = useLocation();
  return <AICopilot user={user} pageContext={location.pathname} />;
}

export default App;


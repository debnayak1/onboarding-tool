import { useState } from 'react';
import { login, register } from '../services/api';

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
    department: '',
    role: 'engineer'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegister) {
        await register(formData);
        setIsRegister(false);
        setError('');
        alert('Registration successful! Please login.');
      } else {
        const response = await login(formData.username, formData.password);
        onLogin(response.data.user, response.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '450px' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '10px', color: '#0f62fe' }}>
          🚀 Onboarding Agent
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '30px' }}>
          {isRegister ? 'Create your account' : 'Welcome back! Please login.'}
        </p>

        {error && <div className="error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <>
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                required
                placeholder="John Doe"
              />

              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="john.doe@company.com"
              />

              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                placeholder="Engineering"
              />
            </>
          )}

          <label>Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            placeholder="johndoe"
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="••••••••"
          />

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Please wait...' : (isRegister ? 'Register' : 'Login')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: '#0f62fe', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isRegister ? 'Already have an account? Login' : "Don't have an account? Register"}
          </button>
        </div>

        <div style={{ marginTop: '30px', padding: '15px', background: '#f4f4f4', borderRadius: '4px' }}>
          <p style={{ fontSize: '12px', color: '#666', margin: '0 0 10px 0' }}>
            <strong>Demo Credentials:</strong>
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
            Admin: <code>admin / admin123</code>
          </p>
          <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
            Engineer: <code>john_doe / password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;


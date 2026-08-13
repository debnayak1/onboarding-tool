import { Link, useLocation } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';

function Header({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="header">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            <h2 style={{ margin: 0, color: '#0f62fe' }}>🚀 Onboarding Agent</h2>
            <nav className="nav">
              {user.role === 'engineer' && (
                <>
                  <Link to="/dashboard" className={isActive('/dashboard') ? 'active' : ''}>
                    Dashboard
                  </Link>
                  <Link to="/learning" className={isActive('/learning') ? 'active' : ''}>
                    Learning
                  </Link>
                  <Link to="/quiz" className={isActive('/quiz') ? 'active' : ''}>
                    Quiz
                  </Link>
                  <Link to="/access" className={isActive('/access') ? 'active' : ''}>
                    Access Requests
                  </Link>
                </>
              )}
              {user.role === 'admin' && (
                <>
                  <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>
                    Dashboard
                  </Link>
                  <Link to="/admin/teams" className={isActive('/admin/teams') ? 'active' : ''}>
                    Teams
                  </Link>
                  <Link to="/access" className={isActive('/access') ? 'active' : ''}>
                    Requests
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} />
              <span style={{ fontWeight: 500 }}>{user.full_name}</span>
              <span className="badge badge-info">{user.role}</span>
            </div>
            <button onClick={onLogout} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;

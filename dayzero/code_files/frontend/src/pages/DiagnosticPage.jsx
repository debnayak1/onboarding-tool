import { useState, useEffect } from 'react';

function DiagnosticPage() {
  const [status, setStatus] = useState({
    backend: 'checking...',
    teams: 'checking...',
    repos: 'checking...',
    modules: 'checking...',
    users: 'checking...'
  });

  useEffect(() => {
    checkBackend();
  }, []);

  const checkBackend = async () => {
    // Check backend connection
    try {
      const response = await fetch('http://localhost:8080/api/v2/teams');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({
          ...prev,
          backend: '✅ Connected',
          teams: `✅ ${data.count || 0} teams found`
        }));
      } else {
        setStatus(prev => ({ ...prev, backend: '❌ Backend error', teams: '❌ Failed' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, backend: '❌ Cannot connect', teams: '❌ Failed' }));
    }

    // Check repositories
    try {
      const response = await fetch('http://localhost:8080/api/v2/repositories');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, repos: `✅ ${data.count || 0} repos found` }));
      } else {
        setStatus(prev => ({ ...prev, repos: '❌ Failed' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, repos: '❌ Failed' }));
    }

    // Check modules
    try {
      const response = await fetch('http://localhost:8080/api/v2/modules');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, modules: `✅ ${data.count || 0} modules found` }));
      } else {
        setStatus(prev => ({ ...prev, modules: '❌ Failed' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, modules: '❌ Failed' }));
    }

    // Check users
    try {
      const response = await fetch('http://localhost:8080/admin/users');
      if (response.ok) {
        const data = await response.json();
        setStatus(prev => ({ ...prev, users: `✅ ${data.length || 0} users found` }));
      } else {
        setStatus(prev => ({ ...prev, users: '❌ Failed' }));
      }
    } catch (error) {
      setStatus(prev => ({ ...prev, users: '❌ Failed' }));
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 System Diagnostic</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h2>Backend Status</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
            <strong>Backend Connection:</strong> {status.backend}
          </div>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
            <strong>Teams API:</strong> {status.teams}
          </div>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
            <strong>Repositories API:</strong> {status.repos}
          </div>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
            <strong>Modules API:</strong> {status.modules}
          </div>
          <div style={{ padding: '10px', background: 'white', borderRadius: '4px' }}>
            <strong>Users API:</strong> {status.users}
          </div>
        </div>
      </div>

      <div style={{ background: '#d0e2ff', padding: '20px', borderRadius: '8px', marginTop: '20px' }}>
        <h3>📋 Next Steps</h3>
        <ol style={{ marginTop: '10px' }}>
          <li>If backend shows ❌, restart backend server</li>
          <li>If teams/repos/modules show 0, run: <code>python3 setup_sample_data.py</code></li>
          <li>Once all show ✅, go to Admin Teams page</li>
          <li>You should see teams and configuration options</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button 
          onClick={checkBackend}
          style={{
            padding: '12px 24px',
            background: '#0f62fe',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          🔄 Recheck Status
        </button>
      </div>
    </div>
  );
}

export default DiagnosticPage;

// Made with Bob

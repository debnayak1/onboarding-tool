import { useState, useEffect } from 'react';

function AdminTeamManagementSimple() {
  const [status, setStatus] = useState('Loading...');
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setStatus('Fetching teams...');
      const response = await fetch('http://localhost:8080/api/v2/teams');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTeams(data.teams || []);
      setStatus(`Loaded ${data.teams?.length || 0} teams`);
    } catch (err) {
      setError(err.message);
      setStatus('Error loading teams');
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>Admin Team Management (Simple Version)</h1>
      
      <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
        <strong>Status:</strong> {status}
        {error && (
          <div style={{ color: 'red', marginTop: '10px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>

      <button 
        onClick={loadTeams}
        style={{
          padding: '10px 20px',
          background: '#0f62fe',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px'
        }}
      >
        🔄 Reload Teams
      </button>

      {teams.length === 0 ? (
        <div style={{ background: '#fff3cd', padding: '20px', borderRadius: '8px' }}>
          <h3>No Teams Found</h3>
          <p>Run this command to create sample teams:</p>
          <code style={{ background: '#f4f4f4', padding: '10px', display: 'block', borderRadius: '4px' }}>
            python3 setup_sample_data.py
          </code>
        </div>
      ) : (
        <div>
          <h2>Teams ({teams.length})</h2>
          {teams.map((team) => (
            <div 
              key={team.id}
              style={{
                background: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '15px',
                border: '1px solid #ddd'
              }}
            >
              <h3>{team.name}</h3>
              <p style={{ color: '#666' }}>{team.description}</p>
              <div style={{ marginTop: '10px' }}>
                <span style={{ 
                  background: '#d0e2ff', 
                  padding: '4px 12px', 
                  borderRadius: '4px',
                  fontSize: '14px'
                }}>
                  {team.department}
                </span>
              </div>
              
              <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => alert(`Team ID: ${team.id}\nName: ${team.name}\n\nTo configure this team, use the full Admin Teams page.`)}
                  style={{
                    padding: '8px 16px',
                    background: '#0f62fe',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '40px', background: '#d0e2ff', padding: '20px', borderRadius: '8px' }}>
        <h3>📋 This is a Simplified Version</h3>
        <p>This page proves the backend is working. If you see teams here, the issue is with the full Admin Teams page.</p>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>If you see teams above, the backend is working ✓</li>
          <li>Check browser console (F12) for JavaScript errors</li>
          <li>The full page at /admin/teams should work once we fix any JS errors</li>
        </ol>
      </div>
    </div>
  );
}

export default AdminTeamManagementSimple;


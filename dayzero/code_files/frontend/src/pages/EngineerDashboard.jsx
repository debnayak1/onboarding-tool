import { useState, useEffect } from 'react';
import { BookOpen, Award, Clock, CheckCircle, AlertCircle, GitBranch, Key } from 'lucide-react';
import { getEngineerDashboard, updateModuleProgress } from '../services/api';

function EngineerDashboard({ user }) {
  const [dashboard, setDashboard] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, [user.id]);

  const loadDashboard = async () => {
    try {
      const response = await getEngineerDashboard(user.id);
      setDashboard(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartModule = (module) => {
    setSelectedModule(module);
  };

  const handleCompleteModule = async () => {
    if (!selectedModule) return;

    try {
      await updateModuleProgress(user.id, selectedModule.module_id, {
        progress_percentage: 100,
        time_spent: 30,
        status: 'completed'
      });
      await loadDashboard();
      setSelectedModule(null);
      alert('Module completed! 🎉');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  const handleUpdateProgress = async (percentage) => {
    if (!selectedModule) return;

    try {
      await updateModuleProgress(user.id, selectedModule.module_id, {
        progress_percentage: percentage,
        time_spent: 10,
        status: percentage >= 100 ? 'completed' : 'in_progress'
      });
      await loadDashboard();
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your dashboard...</div>;
  }

  if (!dashboard) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <h2>Welcome to the Onboarding Platform! 👋</h2>
          <p style={{ color: '#666', marginTop: '10px' }}>
            You haven't been assigned to a team yet. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  // If viewing a module
  if (selectedModule) {
    const moduleDetails = dashboard.assigned_modules.find(m => m.module_id === selectedModule.module_id);
    
    return (
      <div className="container">
        <button 
          onClick={() => setSelectedModule(null)} 
          className="btn btn-secondary"
          style={{ marginBottom: '20px' }}
        >
          ← Back to Dashboard
        </button>

        <div className="card">
          <h1>{selectedModule.module_id}</h1>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <span className={`badge ${
              moduleDetails.status === 'completed' ? 'badge-success' : 
              moduleDetails.status === 'in_progress' ? 'badge-info' : 
              'badge-warning'
            }`}>
              {moduleDetails.status.replace('_', ' ')}
            </span>
            <span className="badge badge-info">
              {moduleDetails.assigned_reason.replace('_', ' ')}
            </span>
          </div>

          <div style={{ 
            padding: '20px', 
            background: '#f4f4f4', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Module Content</h3>
            <p>This is a placeholder for the actual module content. In a real implementation, this would load the full learning material.</p>
            
            <div style={{ marginTop: '20px' }}>
              <h4>Progress: {moduleDetails.progress_percentage}%</h4>
              <div className="progress-bar" style={{ height: '20px' }}>
                <div 
                  className="progress-fill" 
                  style={{ width: `${moduleDetails.progress_percentage}%` }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {moduleDetails.progress_percentage < 100 && (
              <>
                <button 
                  onClick={() => handleUpdateProgress(50)}
                  className="btn btn-secondary"
                >
                  Mark 50% Complete
                </button>
                <button 
                  onClick={() => handleUpdateProgress(75)}
                  className="btn btn-secondary"
                >
                  Mark 75% Complete
                </button>
              </>
            )}
            <button 
              onClick={handleCompleteModule}
              className="btn btn-success"
              style={{ flex: 1 }}
            >
              {moduleDetails.progress_percentage >= 100 ? 'Review Complete' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { team, pending_actions, access_requests, assigned_modules, repositories, progress_summary } = dashboard;

  return (
    <div className="container">
      <h1>Welcome back, {user.full_name}! 👋</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        {team ? `Team: ${team.name}` : 'Not assigned to a team yet'}
      </p>

      {/* Pending Actions Alert */}
      {pending_actions && pending_actions.length > 0 && (
        <div style={{ 
          padding: '20px', 
          background: '#fcf4d6', 
          borderRadius: '8px', 
          marginBottom: '30px',
          border: '1px solid #8e6a00'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <AlertCircle size={24} color="#8e6a00" />
            <h3 style={{ margin: 0 }}>Action Required</h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {pending_actions.map((action, idx) => (
              <li key={idx} style={{ marginBottom: '5px' }}>
                {action.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-4" style={{ marginBottom: '30px' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#d0e2ff', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <BookOpen size={24} color="#0f62fe" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Modules Progress</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{progress_summary.modules_completed}</h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#d4f1d4', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Award size={24} color="#24a148" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Avg Progress</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{progress_summary.average_progress}%</h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#fcf4d6', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <Key size={24} color="#8e6a00" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Access Approved</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{progress_summary.access_approved}</h2>
            </div>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: progress_summary.can_access_repos ? '#d4f1d4' : '#e0e0e0', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <CheckCircle size={24} color={progress_summary.can_access_repos ? '#24a148' : '#666'} />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Onboarding</p>
              <h2 style={{ margin: '5px 0 0 0', textTransform: 'capitalize' }}>
                {progress_summary.onboarding_status.replace('_', ' ')}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Team Information & Statistics */}
      {team && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '20px' }}>Your Team: {team.name} 👥</h3>
          <div className="grid grid-2">
            <div>
              <h4 style={{ marginBottom: '15px' }}>Team Details</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666' }}>Department:</span>
                  <strong style={{ float: 'right' }}>{team.department}</strong>
                </li>
                <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666' }}>Team Members:</span>
                  <strong style={{ float: 'right' }}>{team.member_count || 'N/A'}</strong>
                </li>
                <li style={{ padding: '10px 0' }}>
                  <span style={{ color: '#666' }}>Created:</span>
                  <strong style={{ float: 'right' }}>
                    {team.created_at ? new Date(team.created_at).toLocaleDateString() : 'N/A'}
                  </strong>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: '15px' }}>Your Progress</h4>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666' }}>Learning Modules:</span>
                  <strong style={{ float: 'right' }}>
                    {progress_summary.modules_completed} / {assigned_modules?.length || 0}
                  </strong>
                </li>
                <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                  <span style={{ color: '#666' }}>Access Requests:</span>
                  <strong style={{ float: 'right' }}>
                    <span style={{ color: '#24a148' }}>{progress_summary.access_approved} approved</span>
                    {' / '}
                    <span style={{ color: '#8e6a00' }}>
                      {access_requests?.filter(r => r.status === 'pending').length || 0} pending
                    </span>
                  </strong>
                </li>
                <li style={{ padding: '10px 0' }}>
                  <span style={{ color: '#666' }}>Repositories Access:</span>
                  <strong style={{ float: 'right' }}>
                    {progress_summary.can_access_repos ? (
                      <span style={{ color: '#24a148' }}>✓ Granted</span>
                    ) : (
                      <span style={{ color: '#8e6a00' }}>⏳ Pending</span>
                    )}
                  </strong>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Overall Progress Bar */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f4f4f4', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontWeight: 500 }}>Overall Onboarding Progress</span>
              <span style={{ fontWeight: 600, color: '#0f62fe' }}>{progress_summary.average_progress}%</span>
            </div>
            <div className="progress-bar" style={{ height: '12px' }}>
              <div
                className="progress-fill"
                style={{ width: `${progress_summary.average_progress}%` }}
              />
            </div>
            <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              Status: <strong style={{ textTransform: 'capitalize' }}>
                {progress_summary.onboarding_status.replace('_', ' ')}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Learning Modules */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>Your Learning Path 📚</h3>
        {assigned_modules && assigned_modules.length > 0 ? (
          <div className="grid grid-2">
            {assigned_modules.map((assignment) => (
              <div key={assignment.module_id} style={{ 
                padding: '20px', 
                background: '#f4f4f4', 
                borderRadius: '8px',
                border: assignment.status === 'in_progress' ? '2px solid #0f62fe' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0' }}>{assignment.module_id}</h4>
                    <span className={`badge ${
                      assignment.status === 'completed' ? 'badge-success' : 
                      assignment.status === 'in_progress' ? 'badge-info' : 
                      'badge-warning'
                    }`}>
                      {assignment.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    background: assignment.status === 'completed' ? '#d4f1d4' : '#d0e2ff',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    {assignment.status === 'completed' ? (
                      <CheckCircle size={20} color="#24a148" />
                    ) : (
                      <BookOpen size={20} color="#0f62fe" />
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '14px', color: '#666' }}>Progress</span>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>{assignment.progress_percentage}%</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${assignment.progress_percentage}%` }}
                    />
                  </div>
                </div>

                <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                  Assigned: {assignment.assigned_reason.replace('_', ' ')}
                </div>

                <button 
                  onClick={() => handleStartModule(assignment)}
                  className={`btn ${assignment.status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ width: '100%' }}
                >
                  {assignment.status === 'completed' ? 'Review Module' : 
                   assignment.status === 'in_progress' ? 'Continue Learning' : 
                   'Start Module'}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No modules assigned yet.
          </p>
        )}
      </div>

      {/* Access Requests */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>Access Requests 🔐</h3>
        {access_requests && access_requests.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Platform</th>
                <th>Access Type</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {access_requests.map((request) => (
                <tr key={request.id}>
                  <td style={{ textTransform: 'capitalize' }}>
                    {request.platform.replace('_', ' ')}
                  </td>
                  <td>
                    <span className="badge badge-info">{request.access_type}</span>
                  </td>
                  <td>
                    <span className={`badge ${
                      request.status === 'pending' ? 'badge-warning' :
                      request.status === 'approved' ? 'badge-success' :
                      'badge-danger'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{new Date(request.requested_at).toLocaleDateString()}</td>
                  <td>
                    {request.admin_notes ? (
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {request.admin_notes}
                      </span>
                    ) : (
                      <span style={{ fontSize: '12px', color: '#999' }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No access requests yet.
          </p>
        )}
      </div>

      {/* Team Repositories */}
      {repositories && repositories.length > 0 && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Team Repositories 📦</h3>
          <div className="grid grid-3">
            {repositories.map((repo) => (
              <div key={repo.id} style={{ 
                padding: '15px', 
                background: '#f4f4f4', 
                borderRadius: '8px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <GitBranch size={20} color="#0f62fe" />
                  <strong>{repo.name}</strong>
                </div>
                <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#666' }}>
                  {repo.description}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span className="badge badge-info">{repo.language}</span>
                  {progress_summary.can_access_repos ? (
                    <span style={{ fontSize: '12px', color: '#24a148' }}>✓ Access granted</span>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#8e6a00' }}>⏳ Pending</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default EngineerDashboard;


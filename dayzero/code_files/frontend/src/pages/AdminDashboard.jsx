import { useState, useEffect } from 'react';
import { Users, Award, Clock, CheckCircle } from 'lucide-react';
import { getAllUsers, getAllAccessRequests, updateAccessRequest, getSystemStats } from '../services/api';

function AdminDashboard({ user }) {
  const [users, setUsers] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersRes, requestsRes, statsRes] = await Promise.all([
        getAllUsers(),
        getAllAccessRequests(),
        getSystemStats()
      ]);
      setUsers(usersRes.data.users || []);
      setAccessRequests(requestsRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccessRequestUpdate = async (requestId, status) => {
    const notes = prompt(`Enter admin notes for this ${status} request:`);
    if (notes === null) return;

    try {
      await updateAccessRequest(requestId, status, notes);
      await loadData();
      alert(`Request ${status} successfully!`);
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Error updating request');
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  return (
    <div className="container">
      <h1>Admin Dashboard 👨‍💼</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Manage users, access requests, and monitor system performance
      </p>

      {/* Stats Cards */}
      <div className="grid grid-3" style={{ marginBottom: '30px' }}>
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
              <Users size={24} color="#0f62fe" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Total Users</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{stats?.total_users || 0}</h2>
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
              <Clock size={24} color="#8e6a00" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Pending Requests</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{pendingRequests.length}</h2>
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
              <CheckCircle size={24} color="#24a148" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Active Modules</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{stats?.total_modules || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '20px', borderBottom: '2px solid #e0e0e0' }}>
        <button
          onClick={() => setSelectedTab('overview')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: selectedTab === 'overview' ? '2px solid #0f62fe' : 'none',
            fontWeight: selectedTab === 'overview' ? 600 : 400,
            color: selectedTab === 'overview' ? '#0f62fe' : '#666'
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => setSelectedTab('users')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: selectedTab === 'users' ? '2px solid #0f62fe' : 'none',
            fontWeight: selectedTab === 'users' ? 600 : 400,
            color: selectedTab === 'users' ? '#0f62fe' : '#666'
          }}
        >
          Users
        </button>
        <button
          onClick={() => setSelectedTab('requests')}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderBottom: selectedTab === 'requests' ? '2px solid #0f62fe' : 'none',
            fontWeight: selectedTab === 'requests' ? 600 : 400,
            color: selectedTab === 'requests' ? '#0f62fe' : '#666'
          }}
        >
          Access Requests {pendingRequests.length > 0 && (
            <span className="badge badge-warning" style={{ marginLeft: '5px' }}>
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div>
          <div className="card">
            <h3 style={{ marginBottom: '20px' }}>System Overview</h3>
            <div className="grid grid-2">
              <div>
                <h4>User Statistics</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ color: '#666' }}>Total Engineers:</span>
                    <strong style={{ float: 'right' }}>
                      {users.filter(u => u.role === 'engineer').length}
                    </strong>
                  </li>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ color: '#666' }}>Total Admins:</span>
                    <strong style={{ float: 'right' }}>
                      {users.filter(u => u.role === 'admin').length}
                    </strong>
                  </li>
                  <li style={{ padding: '10px 0' }}>
                    <span style={{ color: '#666' }}>Active Users:</span>
                    <strong style={{ float: 'right' }}>{users.length}</strong>
                  </li>
                </ul>
              </div>
              <div>
                <h4>Request Statistics</h4>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ color: '#666' }}>Pending:</span>
                    <strong style={{ float: 'right', color: '#8e6a00' }}>
                      {accessRequests.filter(r => r.status === 'pending').length}
                    </strong>
                  </li>
                  <li style={{ padding: '10px 0', borderBottom: '1px solid #e0e0e0' }}>
                    <span style={{ color: '#666' }}>Approved:</span>
                    <strong style={{ float: 'right', color: '#24a148' }}>
                      {accessRequests.filter(r => r.status === 'approved').length}
                    </strong>
                  </li>
                  <li style={{ padding: '10px 0' }}>
                    <span style={{ color: '#666' }}>Rejected:</span>
                    <strong style={{ float: 'right', color: '#da1e28' }}>
                      {accessRequests.filter(r => r.status === 'rejected').length}
                    </strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Team-wise Statistics */}
          {stats?.team_stats && stats.team_stats.length > 0 && (
            <div className="card" style={{ marginTop: '20px' }}>
              <h3 style={{ marginBottom: '20px' }}>Team-wise Statistics</h3>
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Team Name</th>
                      <th>Department</th>
                      <th>Members</th>
                      <th>Total Requests</th>
                      <th>Pending</th>
                      <th>Approved</th>
                      <th>Required Access</th>
                      <th>Repositories</th>
                      <th>Learning Modules</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.team_stats.map((team) => (
                      <tr key={team.team_id}>
                        <td><strong>{team.team_name}</strong></td>
                        <td>{team.department}</td>
                        <td>
                          <span className="badge" style={{
                            background: team.member_count > 0 ? '#d0e2ff' : '#e0e0e0',
                            color: team.member_count > 0 ? '#0f62fe' : '#666'
                          }}>
                            {team.member_count}
                          </span>
                        </td>
                        <td>{team.total_requests}</td>
                        <td>
                          {team.pending_requests > 0 ? (
                            <span className="badge badge-warning">{team.pending_requests}</span>
                          ) : (
                            <span style={{ color: '#666' }}>0</span>
                          )}
                        </td>
                        <td>
                          {team.approved_requests > 0 ? (
                            <span className="badge badge-success">{team.approved_requests}</span>
                          ) : (
                            <span style={{ color: '#666' }}>0</span>
                          )}
                        </td>
                        <td>{team.required_access}</td>
                        <td>{team.repositories}</td>
                        <td>{team.learning_modules}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {selectedTab === 'users' && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>All Users</h3>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Email</th>
                <th>Department</th>
                <th>Role</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.username}</td>
                  <td>{u.email}</td>
                  <td>{u.department}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-danger' : 'badge-info'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Access Requests Tab */}
      {selectedTab === 'requests' && (
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Access Requests Management</h3>
          {accessRequests.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Platform</th>
                  <th>Access Type</th>
                  <th>Urgency</th>
                  <th>Justification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessRequests.map((request) => {
                  const requestUser = users.find(u => u.id === request.user_id);
                  return (
                    <tr key={request.id}>
                      <td>{requestUser?.full_name || 'Unknown'}</td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {request.platform.replace('_', ' ')}
                      </td>
                      <td>
                        <span className="badge badge-info">{request.access_type}</span>
                      </td>
                      <td>
                        <span className={`badge ${
                          request.urgency === 'critical' ? 'badge-danger' :
                          request.urgency === 'high' ? 'badge-warning' :
                          'badge-info'
                        }`}>
                          {request.urgency}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {request.justification}
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
                      <td>
                        {request.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '5px' }}>
                            <button
                              onClick={() => handleAccessRequestUpdate(request.id, 'approved')}
                              className="btn btn-success"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleAccessRequestUpdate(request.id, 'rejected')}
                              className="btn btn-danger"
                              style={{ padding: '5px 10px', fontSize: '12px' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No access requests yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

// Made with Bob

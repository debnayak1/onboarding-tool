import { useState, useEffect } from 'react';
import { Key, GitBranch, Cloud, Package } from 'lucide-react';
import { createAccessRequest, getAccessRequests, getAllAccessRequests } from '../services/api';

function AccessRequest({ user }) {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'github',
    access_type: 'read',
    justification: '',
    urgency: 'normal'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, [user.id]);

  const loadRequests = async () => {
    try {
      const response = user.role === 'admin'
        ? await getAllAccessRequests()
        : await getAccessRequests(user.id);
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await createAccessRequest({
        ...formData,
        user_id: user.id
      });
      setShowForm(false);
      setFormData({
        platform: 'github',
        access_type: 'read',
        justification: '',
        urgency: 'normal'
      });
      await loadRequests();
      alert('Access request submitted successfully!');
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Error submitting request');
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform.toLowerCase()) {
      case 'github':
        return <GitBranch size={20} />;
      case 'cloud_platform':
        return <Cloud size={20} />;
      case 'artifactory':
        return <Package size={20} />;
      default:
        return <Key size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      approved: 'badge-success',
      rejected: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  if (loading) {
    return <div className="loading">Loading access requests...</div>;
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Access Requests 🔐</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            Request access to platforms and track your requests
          </p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ New Request'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '30px' }}>
          <h3 style={{ marginBottom: '20px' }}>New Access Request</h3>
          <form onSubmit={handleSubmit}>
            <label>Platform</label>
            <select
              name="platform"
              value={formData.platform}
              onChange={handleChange}
              required
            >
              <option value="github">GitHub</option>
              <option value="cloud_platform">Cloud Platform</option>
              <option value="artifactory">Artifactory</option>
            </select>

            <label>Access Type</label>
            <select
              name="access_type"
              value={formData.access_type}
              onChange={handleChange}
              required
            >
              <option value="read">Read Only</option>
              <option value="write">Read & Write</option>
              <option value="admin">Admin</option>
            </select>

            <label>Urgency</label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              required
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>

            <label>Justification</label>
            <textarea
              name="justification"
              value={formData.justification}
              onChange={handleChange}
              required
              rows="4"
              placeholder="Please explain why you need this access..."
            />

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              Submit Request
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '20px' }}>
          {user.role === 'admin' ? 'All Access Requests' : 'Your Access Requests'}
        </h3>
        {requests.length > 0 ? (
          <table>
            <thead>
              <tr>
                {user.role === 'admin' && <th>User</th>}
                <th>Platform</th>
                <th>Access Type</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  {user.role === 'admin' && (
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: '500', fontSize: '14px' }}>
                          {request.user_name || 'Unknown User'}
                        </span>
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {request.user_email || request.user_id}
                        </span>
                      </div>
                    </td>
                  )}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getPlatformIcon(request.platform)}
                      <span style={{ textTransform: 'capitalize' }}>
                        {request.platform.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-info">
                      {request.access_type}
                    </span>
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
                  <td>
                    <span className={`badge ${getStatusBadge(request.status)}`}>
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
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Key size={48} color="#999" style={{ marginBottom: '15px' }} />
            <p style={{ color: '#666' }}>
              No access requests yet. Click "New Request" to get started.
            </p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '20px', background: '#f4f4f4' }}>
        <h4 style={{ marginBottom: '15px' }}>📋 Request Guidelines</h4>
        <ul style={{ paddingLeft: '20px', color: '#666', fontSize: '14px' }}>
          <li style={{ marginBottom: '8px' }}>
            Provide clear justification for your access request
          </li>
          <li style={{ marginBottom: '8px' }}>
            Select appropriate urgency level based on your project timeline
          </li>
          <li style={{ marginBottom: '8px' }}>
            Requests are typically processed within 24-48 hours
          </li>
          <li style={{ marginBottom: '8px' }}>
            Critical requests are prioritized and reviewed immediately
          </li>
        </ul>
      </div>
    </div>
  );
}

export default AccessRequest;


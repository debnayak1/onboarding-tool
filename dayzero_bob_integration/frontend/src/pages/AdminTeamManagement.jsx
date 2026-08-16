import { useState, useEffect } from 'react';
import { Users, Plus, Settings, GitBranch, BookOpen, Key } from 'lucide-react';
import {
  getAllTeams,
  getTeam,
  createTeam,
  updateTeamConfiguration,
  getAllRepositories,
  getAllModules,
  assignEngineerToTeam,
  getTeamMembersProgress,
  getAllUsers
} from '../services/api';

function AdminTeamManagement({ user }) {
  const [teams, setTeams] = useState([]);
  const [repositories, setRepositories] = useState([]);
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamDetails, setTeamDetails] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showConfigureTeam, setShowConfigureTeam] = useState(false);
  const [showAssignEngineer, setShowAssignEngineer] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newTeam, setNewTeam] = useState({
    id: '',
    name: '',
    description: '',
    department: ''
  });

  const [teamConfig, setTeamConfig] = useState({
    access_requirements: [],
    repositories: [],
    required_modules: [],
    auto_assigned_modules: []
  });

  const [selectedEngineer, setSelectedEngineer] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teamsRes, reposRes, modulesRes, usersRes] = await Promise.all([
        getAllTeams(),
        getAllRepositories(),
        getAllModules(),
        getAllUsers()
      ]);
      
      console.log('Teams API Response:', teamsRes.data);
      console.log('Repos API Response:', reposRes.data);
      console.log('Modules API Response:', modulesRes.data);
      console.log('Users API Response:', usersRes.data);
      
      setTeams(teamsRes.data.teams || []);
      setRepositories(reposRes.data.repositories || []);
      setModules(modulesRes.data.modules || []);
      setUsers(usersRes.data.users || []);
      
      console.log('State updated - Teams:', teamsRes.data.teams?.length || 0);
      console.log('State updated - Repos:', reposRes.data.repositories?.length || 0);
      console.log('State updated - Modules:', modulesRes.data.modules?.length || 0);
      console.log('State updated - Users:', usersRes.data.users?.length || 0);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error loading data: ${error.message}\nCheck console for details.`);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (teamId) => {
    try {
      const response = await getTeam(teamId);
      setTeamDetails(response.data);
      setSelectedTeam(teamId);
      
      // Load team configuration
      if (response.data.configuration) {
        setTeamConfig(response.data.configuration);
      }
    } catch (error) {
      console.error('Error loading team details:', error);
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      const response = await createTeam({
        ...newTeam,
        created_by: user.id
      });
      console.log('Team created:', response.data);
      setShowCreateTeam(false);
      setNewTeam({ id: '', name: '', description: '', department: '' });
      // Reload data to show new team
      await loadData();
      alert('Team created successfully! Refreshing list...');
    } catch (error) {
      console.error('Error creating team:', error);
      alert(`Error creating team: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleUpdateConfiguration = async (e) => {
    e.preventDefault();
    try {
      const response = await updateTeamConfiguration(selectedTeam, {
        team_id: selectedTeam,
        ...teamConfig
      });
      console.log('Configuration updated:', response.data);
      setShowConfigureTeam(false);
      await loadTeamDetails(selectedTeam);
      await loadData(); // Refresh teams list
      alert('Team configuration updated!');
    } catch (error) {
      console.error('Error updating configuration:', error);
      alert(`Error updating configuration: ${error.response?.data?.detail || error.message}`);
    }
  };

  const handleAssignEngineer = async (e) => {
    e.preventDefault();
    try {
      const response = await assignEngineerToTeam(selectedEngineer, selectedTeam);
      console.log('Engineer assigned:', response.data);
      setShowAssignEngineer(false);
      setSelectedEngineer('');
      await loadTeamDetails(selectedTeam);
      await loadData(); // Refresh data
      alert(`Engineer assigned successfully!\n\n✅ ${response.data.access_requests_created} access requests created\n✅ ${response.data.modules_assigned} modules assigned`);
    } catch (error) {
      console.error('Error assigning engineer:', error);
      alert(`Error assigning engineer: ${error.response?.data?.detail || error.message}`);
    }
  };

  const addAccessRequirement = () => {
    setTeamConfig({
      ...teamConfig,
      access_requirements: [
        ...teamConfig.access_requirements,
        { platform: 'github', access_type: 'read', required: true, auto_approve: false }
      ]
    });
  };

  const updateAccessRequirement = (index, field, value) => {
    const updated = [...teamConfig.access_requirements];
    updated[index][field] = value;
    setTeamConfig({ ...teamConfig, access_requirements: updated });
  };

  const removeAccessRequirement = (index) => {
    const updated = teamConfig.access_requirements.filter((_, i) => i !== index);
    setTeamConfig({ ...teamConfig, access_requirements: updated });
  };

  const toggleRepository = (repoId) => {
    const repos = teamConfig.repositories.includes(repoId)
      ? teamConfig.repositories.filter(id => id !== repoId)
      : [...teamConfig.repositories, repoId];
    setTeamConfig({ ...teamConfig, repositories: repos });
  };

  const toggleModule = (moduleId, type) => {
    const field = type === 'required' ? 'required_modules' : 'auto_assigned_modules';
    const modules = teamConfig[field].includes(moduleId)
      ? teamConfig[field].filter(id => id !== moduleId)
      : [...teamConfig[field], moduleId];
    setTeamConfig({ ...teamConfig, [field]: modules });
  };

  const engineers = users.filter(u => u.role === 'engineer');
  const availableEngineers = engineers.filter(e => !e.team_id || e.team_id !== selectedTeam);
  
  console.log('DEBUG - Total users:', users.length);
  console.log('DEBUG - Engineers:', engineers.length);
  console.log('DEBUG - Available engineers:', availableEngineers.length);
  console.log('DEBUG - Engineers list:', engineers.map(e => e.full_name));

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading team management...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Team Management 👥</h1>
          <p style={{ color: '#666', margin: '5px 0 0 0' }}>
            Create and manage teams, configure access, and assign engineers
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setLoading(true);
              loadData();
            }}
            className="btn btn-secondary"
            title="Refresh teams list"
          >
            🔄 Refresh
          </button>
          <button onClick={() => setShowCreateTeam(true)} className="btn btn-primary">
            <Plus size={20} style={{ marginRight: '8px' }} />
            Create Team
          </button>
        </div>
      </div>

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="card" style={{ marginBottom: '30px', background: '#f4f4f4' }}>
          <h3>Create New Team</h3>
          <form onSubmit={handleCreateTeam}>
            <label>Team ID</label>
            <input
              type="text"
              value={newTeam.id}
              onChange={(e) => setNewTeam({ ...newTeam, id: e.target.value })}
              placeholder="team_backend"
              required
            />

            <label>Team Name</label>
            <input
              type="text"
              value={newTeam.name}
              onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
              placeholder="Backend Engineering"
              required
            />

            <label>Description</label>
            <textarea
              value={newTeam.description}
              onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
              placeholder="Team description..."
              rows="3"
              required
            />

            <label>Department</label>
            <input
              type="text"
              value={newTeam.department}
              onChange={(e) => setNewTeam({ ...newTeam, department: e.target.value })}
              placeholder="Engineering"
              required
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Create Team</button>
              <button type="button" onClick={() => setShowCreateTeam(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <Users size={48} color="#999" style={{ marginBottom: '15px' }} />
          <p style={{ color: '#666' }}>
            No teams created yet. Click "Create Team" to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-2">
          {teams.map((team) => (
          <div key={team.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{team.name}</h3>
                <span className="badge badge-info">{team.department}</span>
              </div>
              <Users size={24} color="#0f62fe" />
            </div>

            <p style={{ color: '#666', marginBottom: '15px' }}>{team.description}</p>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => loadTeamDetails(team.id)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                View Details
              </button>
              <button
                onClick={() => {
                  setSelectedTeam(team.id);
                  setShowConfigureTeam(true);
                  loadTeamDetails(team.id);
                }}
                className="btn btn-secondary"
              >
                <Settings size={16} />
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {/* Team Details */}
      {teamDetails && !showConfigureTeam && (
        <div className="card" style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>{teamDetails.team.name}</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowAssignEngineer(true)}
                className="btn btn-primary"
              >
                <Plus size={16} style={{ marginRight: '5px' }} />
                Assign Engineer
              </button>
              <button
                onClick={() => setShowConfigureTeam(true)}
                className="btn btn-secondary"
              >
                <Settings size={16} style={{ marginRight: '5px' }} />
                Configure
              </button>
            </div>
          </div>

          {/* Team Configuration Summary */}
          <div className="grid grid-3" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '15px', background: '#f4f4f4', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Key size={20} color="#0f62fe" />
                <strong>Access Requirements</strong>
              </div>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                {teamDetails.configuration?.access_requirements?.length || 0}
              </p>
            </div>

            <div style={{ padding: '15px', background: '#f4f4f4', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <GitBranch size={20} color="#24a148" />
                <strong>Repositories</strong>
              </div>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                {teamDetails.configuration?.repositories?.length || 0}
              </p>
            </div>

            <div style={{ padding: '15px', background: '#f4f4f4', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <BookOpen size={20} color="#8e6a00" />
                <strong>Learning Modules</strong>
              </div>
              <p style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>
                {(teamDetails.configuration?.required_modules?.length || 0) + 
                 (teamDetails.configuration?.auto_assigned_modules?.length || 0)}
              </p>
            </div>
          </div>

          {/* Team Members */}
          <h3>Team Members ({teamDetails.member_count})</h3>
          {teamDetails.members && teamDetails.members.length > 0 ? (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {teamDetails.members.map((member) => (
                  <tr key={member.id}>
                    <td>{member.full_name}</td>
                    <td>{member.email}</td>
                    <td>
                      <span className="badge badge-info">{member.role}</span>
                    </td>
                    <td>{new Date(member.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No team members yet. Assign engineers to get started.
            </p>
          )}
        </div>
      )}

      {/* Configure Team Modal */}
      {showConfigureTeam && selectedTeam && (
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>Configure Team</h2>
          <form onSubmit={handleUpdateConfiguration}>
            {/* Access Requirements */}
            <h3>Access Requirements</h3>
            {teamConfig.access_requirements.map((req, index) => (
              <div key={index} style={{ padding: '15px', background: '#f4f4f4', borderRadius: '8px', marginBottom: '10px' }}>
                <div className="grid grid-3" style={{ gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label>Platform</label>
                    <select
                      value={req.platform}
                      onChange={(e) => updateAccessRequirement(index, 'platform', e.target.value)}
                    >
                      <option value="github">GitHub</option>
                      <option value="cloud_platform">Cloud Platform</option>
                      <option value="artifactory">Artifactory</option>
                      <option value="jira">Jira</option>
                      <option value="access_hub">Access Hub</option>
                    </select>
                  </div>
                  <div>
                    <label>Access Type</label>
                    <select
                      value={req.access_type}
                      onChange={(e) => updateAccessRequirement(index, 'access_type', e.target.value)}
                    >
                      <option value="read">Read</option>
                      <option value="write">Write</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => removeAccessRequirement(index)}
                      className="btn btn-danger"
                      style={{ width: '100%' }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={req.required}
                      onChange={(e) => updateAccessRequirement(index, 'required', e.target.checked)}
                    />
                    Required
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={req.auto_approve}
                      onChange={(e) => updateAccessRequirement(index, 'auto_approve', e.target.checked)}
                    />
                    Auto-approve
                  </label>
                </div>
              </div>
            ))}
            <button type="button" onClick={addAccessRequirement} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
              + Add Access Requirement
            </button>

            {/* Repositories */}
            <h3>Team Repositories</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {repositories.map((repo) => (
                <label key={repo.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f4f4f4', borderRadius: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={teamConfig.repositories.includes(repo.id)}
                    onChange={() => toggleRepository(repo.id)}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{repo.name}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{repo.language}</div>
                  </div>
                </label>
              ))}
            </div>

            {/* Learning Modules */}
            <h3>Required Learning Modules</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px', marginBottom: '20px' }}>
              {modules.map((module) => (
                <label key={module.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#f4f4f4', borderRadius: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={teamConfig.required_modules.includes(module.id)}
                    onChange={() => toggleModule(module.id, 'required')}
                  />
                  <div>
                    <div style={{ fontWeight: 500 }}>{module.title}</div>
                    <div style={{ fontSize: '12px', color: '#666' }}>{module.difficulty}</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary">Save Configuration</button>
              <button type="button" onClick={() => setShowConfigureTeam(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Assign Engineer Modal */}
      {showAssignEngineer && teamDetails && (
        <div className="card" style={{ marginTop: '30px', background: '#f4f4f4' }}>
          <h3>Assign Engineer to {teamDetails.team?.name || 'Team'}</h3>
          <form onSubmit={handleAssignEngineer}>
            <label>Select Engineer</label>
            <select
              value={selectedEngineer}
              onChange={(e) => setSelectedEngineer(e.target.value)}
              required
            >
              <option value="">-- Select Engineer --</option>
              {availableEngineers.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.full_name} ({eng.email})
                </option>
              ))}
            </select>

            {/* Team Activities Overview */}
            <div style={{ marginTop: '20px', padding: '20px', background: 'white', borderRadius: '8px', border: '2px solid #0f62fe' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#0f62fe' }}>📋 Activities for This Engineer</h4>
              
              {/* Access Requirements */}
              {teamDetails.configuration?.access_requirements?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Key size={18} color="#0f62fe" />
                    Access Requests ({teamDetails.configuration.access_requirements.length})
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {teamDetails.configuration.access_requirements.map((req, idx) => (
                      <div key={idx} style={{ padding: '10px', background: '#f4f4f4', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong>{req.platform}</strong> - {req.access_type}
                          {req.required && <span className="badge badge-warning" style={{ marginLeft: '8px' }}>Required</span>}
                        </div>
                        {req.auto_approve && <span className="badge badge-success">Auto-approve</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Repositories */}
              {teamDetails.configuration?.repositories?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <GitBranch size={18} color="#0f62fe" />
                    Repository Access ({teamDetails.configuration.repositories.length})
                  </h5>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {teamDetails.configuration.repositories.map((repoId) => {
                      const repo = repositories.find(r => r.id === repoId);
                      return repo ? (
                        <span key={repoId} className="badge badge-info" style={{ padding: '8px 12px' }}>
                          {repo.name} ({repo.language})
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Learning Modules */}
              {(teamDetails.configuration?.required_modules?.length > 0 || teamDetails.configuration?.auto_assigned_modules?.length > 0) && (
                <div>
                  <h5 style={{ margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <BookOpen size={18} color="#0f62fe" />
                    Learning Modules ({(teamDetails.configuration.required_modules?.length || 0) + (teamDetails.configuration.auto_assigned_modules?.length || 0)})
                  </h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {teamDetails.configuration.required_modules?.map((moduleId) => {
                      const module = modules.find(m => m.id === moduleId);
                      return module ? (
                        <div key={moduleId} style={{ padding: '10px', background: '#f4f4f4', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{module.title}</strong>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {module.difficulty} • {module.estimated_duration} min
                              </div>
                            </div>
                            <span className="badge badge-warning">Required</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                    {teamDetails.configuration.auto_assigned_modules?.map((moduleId) => {
                      const module = modules.find(m => m.id === moduleId);
                      return module ? (
                        <div key={moduleId} style={{ padding: '10px', background: '#f4f4f4', borderRadius: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <strong>{module.title}</strong>
                              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                {module.difficulty} • {module.estimated_duration} min
                              </div>
                            </div>
                            <span className="badge badge-info">Auto-assigned</span>
                          </div>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!teamDetails.configuration?.access_requirements?.length &&
                !teamDetails.configuration?.repositories?.length &&
                !teamDetails.configuration?.required_modules?.length &&
                !teamDetails.configuration?.auto_assigned_modules?.length) && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                  <p>⚠️ No activities configured for this team yet.</p>
                  <p style={{ fontSize: '14px', marginTop: '10px' }}>
                    Configure team requirements, repositories, and learning modules first.
                  </p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button type="submit" className="btn btn-primary" disabled={!selectedEngineer}>
                Assign Engineer & Create Activities
              </button>
              <button type="button" onClick={() => setShowAssignEngineer(false)} className="btn btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AdminTeamManagement;


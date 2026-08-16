import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Clock } from 'lucide-react';
import { getModules, getUserProgress, updateProgress } from '../services/api';

function Learning({ user }) {
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [modulesRes, progressRes] = await Promise.all([
        getModules(),
        getUserProgress(user.id)
      ]);
      setModules(modulesRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId) => {
    return progress.find(p => p.module_id === moduleId) || {
      progress_percentage: 0,
      status: 'not_started'
    };
  };

  const handleStartModule = (module) => {
    setSelectedModule(module);
  };

  const handleCompleteModule = async () => {
    if (!selectedModule) return;

    try {
      await updateProgress(user.id, selectedModule.id, {
        progress_percentage: 100,
        status: 'completed',
        time_spent: 30
      });
      await loadData();
      setSelectedModule(null);
      alert('Module completed! 🎉');
    } catch (error) {
      console.error('Error updating progress:', error);
      alert('Error updating progress');
    }
  };

  if (loading) {
    return <div className="loading">Loading modules...</div>;
  }

  if (selectedModule) {
    return (
      <div className="container">
        <button 
          onClick={() => setSelectedModule(null)} 
          className="btn btn-secondary"
          style={{ marginBottom: '20px' }}
        >
          ← Back to Modules
        </button>

        <div className="card">
          <h1>{selectedModule.title}</h1>
          <p style={{ color: '#666', marginBottom: '20px' }}>{selectedModule.description}</p>

          <div style={{ 
            padding: '20px', 
            background: '#f4f4f4', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3>Module Content</h3>
            <div dangerouslySetInnerHTML={{ __html: selectedModule.content }} />
          </div>

          <div style={{ 
            padding: '15px', 
            background: '#d0e2ff', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4>Key Takeaways:</h4>
            <ul>
              {selectedModule.learning_objectives?.map((obj, idx) => (
                <li key={idx}>{obj}</li>
              ))}
            </ul>
          </div>

          <button 
            onClick={handleCompleteModule}
            className="btn btn-success"
            style={{ width: '100%' }}
          >
            Mark as Complete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Learning Modules 📚</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Explore our comprehensive learning modules to get up to speed
      </p>

      <div className="grid grid-2">
        {modules.map((module) => {
          const moduleProgress = getModuleProgress(module.id);
          return (
            <div key={module.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 10px 0' }}>{module.title}</h3>
                  <span className={`badge ${
                    moduleProgress.status === 'completed' ? 'badge-success' : 
                    moduleProgress.status === 'in_progress' ? 'badge-info' : 
                    'badge-warning'
                  }`}>
                    {moduleProgress.status.replace('_', ' ')}
                  </span>
                </div>
                <div style={{ 
                  width: '50px', 
                  height: '50px', 
                  borderRadius: '50%', 
                  background: moduleProgress.status === 'completed' ? '#d4f1d4' : '#d0e2ff',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}>
                  {moduleProgress.status === 'completed' ? (
                    <CheckCircle size={24} color="#24a148" />
                  ) : (
                    <BookOpen size={24} color="#0f62fe" />
                  )}
                </div>
              </div>

              <p style={{ color: '#666', marginBottom: '15px' }}>{module.description}</p>

              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Progress</span>
                  <span style={{ fontSize: '14px', fontWeight: 500 }}>{moduleProgress.progress_percentage}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${moduleProgress.progress_percentage}%` }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
                <Clock size={16} color="#666" />
                <span style={{ fontSize: '14px', color: '#666' }}>
                  {module.estimated_duration} minutes
                </span>
              </div>

              <button 
                onClick={() => handleStartModule(module)}
                className={`btn ${moduleProgress.status === 'completed' ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%' }}
              >
                {moduleProgress.status === 'completed' ? 'Review Module' : 
                 moduleProgress.status === 'in_progress' ? 'Continue Learning' : 
                 'Start Module'}
              </button>
            </div>
          );
        })}
      </div>

      {modules.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: '#666' }}>No modules available yet.</p>
        </div>
      )}
    </div>
  );
}

export default Learning;


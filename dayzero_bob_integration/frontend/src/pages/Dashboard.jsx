import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { BookOpen, Award, Clock, CheckCircle } from 'lucide-react';
import { getUserProgress, getQuizResults } from '../services/api';

function Dashboard({ user }) {
  const [progress, setProgress] = useState([]);
  const [quizResults, setQuizResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user.id]);

  const loadData = async () => {
    try {
      const [progressRes, quizRes] = await Promise.all([
        getUserProgress(user.id),
        getQuizResults(user.id)
      ]);
      setProgress(progressRes.data);
      setQuizResults(quizRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateOverallProgress = () => {
    if (progress.length === 0) return 0;
    const total = progress.reduce((sum, p) => sum + p.progress_percentage, 0);
    return Math.round(total / progress.length);
  };

  const calculateAverageScore = () => {
    if (quizResults.length === 0) return 0;
    const total = quizResults.reduce((sum, r) => sum + r.score, 0);
    return Math.round(total / quizResults.length);
  };

  const getModuleStatusData = () => {
    const completed = progress.filter(p => p.status === 'completed').length;
    const inProgress = progress.filter(p => p.status === 'in_progress').length;
    const notStarted = progress.filter(p => p.status === 'not_started').length;

    return [
      { name: 'Completed', value: completed, color: '#24a148' },
      { name: 'In Progress', value: inProgress, color: '#0f62fe' },
      { name: 'Not Started', value: notStarted, color: '#e0e0e0' }
    ];
  };

  const getQuizPerformanceData = () => {
    if (quizResults.length === 0) return [];
    
    const avgScore = calculateAverageScore();
    const excellent = avgScore >= 80 ? avgScore : 0;
    const good = avgScore >= 60 && avgScore < 80 ? avgScore : 0;
    const needsImprovement = avgScore < 60 ? avgScore : 0;
    const remaining = 100 - avgScore;

    return [
      { name: 'Score', value: avgScore, color: avgScore >= 80 ? '#24a148' : avgScore >= 60 ? '#0f62fe' : '#da1e28' },
      { name: 'Remaining', value: remaining, color: '#e0e0e0' }
    ];
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const overallProgress = calculateOverallProgress();
  const averageScore = calculateAverageScore();
  const moduleStatusData = getModuleStatusData();
  const quizPerformanceData = getQuizPerformanceData();

  return (
    <div className="container">
      <h1>Welcome back, {user.full_name}! 👋</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Here's your learning progress overview
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
              <BookOpen size={24} color="#0f62fe" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Overall Progress</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{overallProgress}%</h2>
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
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Average Quiz Score</p>
              <h2 style={{ margin: '5px 0 0 0' }}>{averageScore}%</h2>
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
              <CheckCircle size={24} color="#8e6a00" />
            </div>
            <div>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Modules Completed</p>
              <h2 style={{ margin: '5px 0 0 0' }}>
                {progress.filter(p => p.status === 'completed').length} / {progress.length}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Module Status Distribution</h3>
          {moduleStatusData.some(d => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={moduleStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {moduleStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No module data available yet. Start learning!
            </p>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '20px' }}>Quiz Performance</h3>
          {quizPerformanceData.length > 0 && quizPerformanceData[0].value > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quizPerformanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => value > 0 ? `${name}: ${value}%` : ''}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {quizPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
              No quiz results yet. Take your first quiz!
            </p>
          )}
          {averageScore > 0 && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#666' }}>
                {averageScore >= 80 ? '🎉 Excellent performance!' : 
                 averageScore >= 60 ? '👍 Good job! Keep it up!' : 
                 '📚 Keep learning to improve your score'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '20px' }}>Recent Learning Activity</h3>
        {progress.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Module</th>
                <th>Progress</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {progress.slice(0, 5).map((p) => (
                <tr key={p.module_id}>
                  <td>{p.module_id}</td>
                  <td>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${p.progress_percentage}%` }}
                      />
                    </div>
                    <span style={{ fontSize: '12px', color: '#666' }}>
                      {p.progress_percentage}%
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      p.status === 'completed' ? 'badge-success' : 
                      p.status === 'in_progress' ? 'badge-info' : 
                      'badge-warning'
                    }`}>
                      {p.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{new Date(p.last_accessed).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No learning activity yet. Start your first module!
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

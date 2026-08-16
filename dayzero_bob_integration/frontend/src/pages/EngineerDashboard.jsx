import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, AlertCircle, GitBranch, Key } from 'lucide-react';
import { getEngineerDashboard, updateModuleProgress } from '../services/api';

/* ── SVG Donut ring ──────────────────────────────────────────── */
function DonutRing({ value = 0, size = 96, stroke = 10, color = '#0f62fe' }) {
  const r      = (size - stroke) / 2;
  const circ   = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.2, fontWeight: 700, fill: '#1f2328' }}>
        {value}%
      </text>
    </svg>
  );
}

/* ── Status badge for modules ────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    completed:   { bg: '#d1fae5', color: '#065f46', label: 'Completed' },
    in_progress: { bg: '#dbeafe', color: '#1e40af', label: 'In Progress' },
    not_started: { bg: '#f3f4f6', color: '#6b7280', label: 'Not Started' },
  };
  const s = map[status] || map.not_started;
  return (
    <span style={{ background: s.bg, color: s.color, borderRadius: 10,
      padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {s.label}
    </span>
  );
}

/* ── Main ────────────────────────────────────────────────────── */
export default function EngineerDashboard({ user }) {
  const [dashboard,      setDashboard]      = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => { loadDashboard(); }, [user.id]);

  const loadDashboard = async () => {
    try {
      const res = await getEngineerDashboard(user.id);
      setDashboard(res.data);
    } catch (e) {
      console.error('Error loading dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteModule = async () => {
    if (!selectedModule) return;
    try {
      await updateModuleProgress(user.id, selectedModule.module_id, {
        progress_percentage: 100, time_spent: 30, status: 'completed'
      });
      await loadDashboard();
      setSelectedModule(null);
    } catch (e) { console.error(e); }
  };

  const handleUpdateProgress = async (pct) => {
    if (!selectedModule) return;
    try {
      await updateModuleProgress(user.id, selectedModule.module_id, {
        progress_percentage: pct, time_spent: 10,
        status: pct >= 100 ? 'completed' : 'in_progress'
      });
      await loadDashboard();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="loading">Loading your dashboard…</div>;

  if (!dashboard) return (
    <div className="container">
      <div className="card" style={{ textAlign: 'center', padding: 40 }}>
        <h2>Welcome to the Onboarding Platform! 👋</h2>
        <p style={{ color: '#666', marginTop: 10 }}>
          You haven't been assigned to a team yet. Please contact your administrator.
        </p>
      </div>
    </div>
  );

  /* ── Module detail view ── */
  if (selectedModule) {
    const md = dashboard.assigned_modules.find(m => m.module_id === selectedModule.module_id);
    return (
      <div className="container">
        <button onClick={() => setSelectedModule(null)} className="btn btn-secondary" style={{ marginBottom: 20 }}>
          ← Back to Dashboard
        </button>
        <div className="card">
          <h1>{selectedModule.module_id.replace(/_/g, ' ')}</h1>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <StatusBadge status={md.status} />
            <span className="badge badge-info">{md.assigned_reason?.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ padding: 20, background: '#f4f4f4', borderRadius: 8, marginBottom: 20 }}>
            <h3>Module Content</h3>
            <p>Work through this module at your own pace. Mark milestones as you go.</p>
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontWeight: 500 }}>Progress</span>
                <span style={{ fontWeight: 700, color: '#0f62fe' }}>{md.progress_percentage}%</span>
              </div>
              <div className="progress-bar" style={{ height: 14 }}>
                <div className="progress-fill" style={{ width: `${md.progress_percentage}%` }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {md.progress_percentage < 100 && (
              <>
                <button onClick={() => handleUpdateProgress(50)}  className="btn btn-secondary">Mark 50%</button>
                <button onClick={() => handleUpdateProgress(75)}  className="btn btn-secondary">Mark 75%</button>
              </>
            )}
            <button onClick={handleCompleteModule} className="btn btn-success" style={{ flex: 1 }}>
              {md.progress_percentage >= 100 ? 'Review Complete' : 'Mark as Complete ✓'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { team, pending_actions, access_requests, assigned_modules, repositories, progress_summary } = dashboard;

  const overallPct  = progress_summary.average_progress || 0;
  const scoreColor  = overallPct >= 70 ? '#10b981' : overallPct >= 40 ? '#f59e0b' : '#ef4444';

  const initials = (name = '') => name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="container">

      {/* ── Pending actions alert ── */}
      {pending_actions?.length > 0 && (
        <div style={{ padding: '14px 20px', background: '#fffbeb', border: '1px solid #fcd34d',
          borderLeft: '4px solid #f59e0b', borderRadius: 8, marginBottom: 20,
          display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong style={{ fontSize: 14, color: '#92400e' }}>Action Required</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {pending_actions.map((a, i) => (
                <li key={i} style={{ fontSize: 13, color: '#78350f', marginBottom: 3 }}>{a.message}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Row 1: Profile card + Score ring ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16, marginBottom: 16 }}>

        {/* Profile card */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#0f62fe',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: 20, fontWeight: 700, flexShrink: 0 }}>
              {initials(user.full_name)}
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {team?.name || 'Unassigned'}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1f2328' }}>{user.full_name}</div>
              {team && <div style={{ fontSize: 12, color: '#6b7280' }}>{team.department}</div>}
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Modules</span>
            <strong>{progress_summary.modules_completed} / {assigned_modules?.length || 0} done</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Access</span>
            <strong>
              <span style={{ color: '#059669' }}>{progress_summary.access_approved} approved</span>
              {' · '}
              <span style={{ color: '#d97706' }}>{access_requests?.filter(r => r.status === 'pending').length || 0} pending</span>
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: '#6b7280' }}>Repo Access</span>
            <strong style={{ color: progress_summary.can_access_repos ? '#059669' : '#d97706' }}>
              {progress_summary.can_access_repos ? '✓ Granted' : '⏳ Pending'}
            </strong>
          </div>
        </div>

        {/* Onboarding score ring */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 12, padding: 24 }}>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Onboarding Score
          </p>
          <DonutRing value={overallPct} size={100} stroke={11} color={scoreColor} />
          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2328' }}>{progress_summary.modules_completed}</div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Completed</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2328' }}>
                {assigned_modules?.filter(m => m.status === 'in_progress').length || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>In Progress</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2328' }}>
                {assigned_modules?.filter(m => m.status === 'not_started').length || 0}
              </div>
              <div style={{ fontSize: 11, color: '#6b7280' }}>Not Started</div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Module breakdown table ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Learning Path — Module Breakdown</h3>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Click a row to open the module</span>
        </div>
        {assigned_modules?.length > 0 ? (
          <table style={{ marginBottom: 0 }}>
            <thead>
              <tr>
                <th style={{ width: 32 }}></th>
                <th>Module</th>
                <th style={{ width: 130 }}>Status</th>
                <th style={{ width: 200 }}>Progress</th>
                <th style={{ width: 130 }}>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              {assigned_modules.map((m) => {
                const pct = m.progress_percentage || 0;
                const lastAccessed = m.last_accessed
                  ? (() => {
                      const days = Math.floor((Date.now() - new Date(m.last_accessed)) / 86400000);
                      return days === 0 ? 'Today' : days === 1 ? 'Yesterday' : `${days} days ago`;
                    })()
                  : 'Not started';
                return (
                  <tr key={m.module_id} style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedModule(m)}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ width: 28, height: 28, borderRadius: 6,
                        background: m.status === 'completed' ? '#d1fae5' : m.status === 'in_progress' ? '#dbeafe' : '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {m.status === 'completed'
                          ? <CheckCircle size={14} color="#059669" />
                          : <BookOpen size={14} color={m.status === 'in_progress' ? '#3b82f6' : '#9ca3af'} />}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 14, color: '#1f2328' }}>
                        {m.module_id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>
                        {m.assigned_reason?.replace(/_/g, ' ')}
                      </div>
                    </td>
                    <td><StatusBadge status={m.status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ flex: 1, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`,
                            background: m.status === 'completed' ? '#10b981' : '#3b82f6',
                            borderRadius: 4, transition: 'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 32, color: '#1f2328' }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>{lastAccessed}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: '#6b7280', padding: 40 }}>
            No modules assigned yet.
          </p>
        )}
      </div>

      {/* ── Row 3: Access requests + Repositories ── */}
      <div style={{ display: 'grid', gridTemplateColumns: access_requests?.length > 0 && repositories?.length > 0 ? '1fr 1fr' : '1fr', gap: 16 }}>

        {/* Access requests */}
        {access_requests?.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0 }}>Access Requests 🔐</h3>
            </div>
            <table style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Admin Notes</th>
                </tr>
              </thead>
              <tbody>
                {access_requests.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Key size={14} color="#6b7280" />
                        <span style={{ textTransform: 'capitalize', fontSize: 13 }}>{r.platform?.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-info" style={{ fontSize: 11 }}>{r.access_type}</span></td>
                    <td>
                      <span className={`badge ${r.status === 'approved' ? 'badge-success' : r.status === 'pending' ? 'badge-warning' : 'badge-danger'}`}
                        style={{ fontSize: 11 }}>{r.status}</span>
                    </td>
                    <td style={{ fontSize: 12, color: '#6b7280' }}>
                      {r.admin_notes || <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Repositories */}
        {repositories?.length > 0 && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0 }}>Team Repositories 📦</h3>
            </div>
            <table style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Repository</th>
                  <th>Language</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {repositories.map(repo => (
                  <tr key={repo.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <GitBranch size={14} color="#0f62fe" />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{repo.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{repo.description}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="badge badge-info" style={{ fontSize: 11 }}>{repo.language}</span></td>
                    <td>
                      {progress_summary.can_access_repos
                        ? <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>✓ Granted</span>
                        : <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>⏳ Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


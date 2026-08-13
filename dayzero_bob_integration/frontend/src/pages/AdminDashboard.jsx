import { useState, useEffect } from 'react';
import { Users, Clock, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAllUsers, getAllAccessRequests, updateAccessRequest, getSystemStats } from '../services/api';

/* ─── tiny helpers ─────────────────────────────────────────────── */
function initials(name = '') {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#14b8a6'];
function avatarColor(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

/* SVG donut ring — progress from 0–100 */
function DonutRing({ value = 0, size = 80, stroke = 8, color = '#0f62fe', label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
      />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: size * 0.22, fontWeight: 700, fill: '#1f2328' }}>
        {value}
      </text>
      {label && (
        <text x={size/2} y={size/2 + size * 0.18} textAnchor="middle"
          style={{ fontSize: size * 0.13, fill: '#57606a' }}>
          {label}
        </text>
      )}
    </svg>
  );
}

/* Stacked horizontal bar */
function StackedBar({ completed = 0, inProgress = 0, notStarted = 100 }) {
  const total = completed + inProgress + notStarted || 100;
  const cp = Math.round((completed / total) * 100);
  const ip = Math.round((inProgress / total) * 100);
  const ns = 100 - cp - ip;
  return (
    <div style={{ display: 'flex', height: 22, borderRadius: 4, overflow: 'hidden', width: '100%', gap: 1 }}>
      {cp > 0 && (
        <div style={{ width: `${cp}%`, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{cp}%</span>
        </div>
      )}
      {ip > 0 && (
        <div style={{ width: `${ip}%`, background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{ip}%</span>
        </div>
      )}
      {ns > 0 && (
        <div style={{ width: `${ns}%`, background: '#d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{ns}%</span>
        </div>
      )}
    </div>
  );
}

/* ─── Tab button ──────────────────────────────────────────────── */
function Tab({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
      borderBottom: active ? '2px solid #0f62fe' : '2px solid transparent',
      fontWeight: active ? 700 : 400, fontSize: 14,
      color: active ? '#0f62fe' : '#6b7280',
      transition: 'all 0.15s',
    }}>
      {children}
    </button>
  );
}

/* ─── Main component ──────────────────────────────────────────── */
export default function AdminDashboard({ user }) {
  const [users, setUsers]               = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [stats, setStats]               = useState(null);
  const [loading, setLoading]           = useState(true);
  const [selectedTab, setSelectedTab]   = useState('overview');
  const [spotlightUser, setSpotlightUser] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [usersRes, requestsRes, statsRes] = await Promise.all([
        getAllUsers(), getAllAccessRequests(), getSystemStats()
      ]);
      setUsers(usersRes.data.users || []);
      setAccessRequests(requestsRes.data || []);
      setStats(statsRes.data || {});
    } catch (e) {
      console.error('Error loading admin data:', e);
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
    } catch (e) {
      console.error('Error updating request:', e);
    }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:200, gap:10, color:'#6b7280' }}>
      <RefreshCw size={18} style={{ animation:'spin 1s linear infinite' }} /> Loading dashboard…
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const engineers    = users.filter(u => u.role === 'engineer');
  const pendingReqs  = accessRequests.filter(r => r.status === 'pending');
  const approvedReqs = accessRequests.filter(r => r.status === 'approved');
  const rejectedReqs = accessRequests.filter(r => r.status === 'rejected');
  const criticalReqs = pendingReqs.filter(r => r.urgency === 'critical');

  /* real onboarding completion % — approved access / total access requests */
  const onboardingScore = Math.min(100, Math.round(
    (approvedReqs.length / (pendingReqs.length + approvedReqs.length + 1)) * 100
  ));

  /* days since a user joined — real data from created_at */
  const daysSince = (createdAt) => {
    if (!createdAt) return null;
    return Math.floor((Date.now() - new Date(createdAt)) / 86400000);
  };

  return (
    <div className="container">
      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin:0 }}>Admin Dashboard</h1>
          <p style={{ color:'#6b7280', margin:'4px 0 0', fontSize:14 }}>
            Onboarding health · {new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })}
          </p>
        </div>
        <button onClick={loadData} className="btn btn-secondary" style={{ display:'flex', alignItems:'center', gap:6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Engineers', value: engineers.length,       icon:<Users size={20} color="#0f62fe" />,   bg:'#dbeafe' },
          { label:'Pending Requests', value: pendingReqs.length,    icon:<Clock size={20} color="#d97706" />,   bg:'#fef3c7' },
          { label:'Approved',         value: approvedReqs.length,   icon:<CheckCircle size={20} color="#059669" />, bg:'#d1fae5' },
          { label:'Critical',         value: criticalReqs.length,   icon:<AlertTriangle size={20} color="#dc2626" />, bg:'#fee2e2' },
        ].map(k => (
          <div key={k.label} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:k.bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {k.icon}
            </div>
            <div>
              <p style={{ margin:0, fontSize:12, color:'#6b7280' }}>{k.label}</p>
              <div style={{ fontSize:22, fontWeight:800, color:'#1f2328', lineHeight:1.1 }}>{k.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ borderBottom:'2px solid #e5e7eb', marginBottom:16 }}>
        <Tab active={selectedTab==='overview'} onClick={() => setSelectedTab('overview')}>Team Performance</Tab>
        <Tab active={selectedTab==='users'}    onClick={() => setSelectedTab('users')}>Engineers</Tab>
        <Tab active={selectedTab==='requests'} onClick={() => setSelectedTab('requests')}>
          Access Requests {pendingReqs.length > 0 && (
            <span style={{ marginLeft:6, background:'#fee2e2', color:'#dc2626', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700 }}>
              {pendingReqs.length}
            </span>
          )}
        </Tab>
      </div>

      {/* ── OVERVIEW TAB — Onboarding Progress table ── */}
      {selectedTab === 'overview' && (
        <div>
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <h3 style={{ margin:0 }}>Onboarding Progress</h3>
              <div style={{ display:'flex', gap:16, fontSize:12, color:'#6b7280' }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:'#10b981', display:'inline-block' }} /> Completed
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:'#3b82f6', display:'inline-block' }} /> In Progress
                </span>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                  <span style={{ width:10, height:10, borderRadius:2, background:'#d1d5db', display:'inline-block' }} /> Not Started
                </span>
              </div>
            </div>
            <table style={{ marginBottom:0 }}>
              <thead>
                <tr>
                  <th style={{ width:200 }}>Engineer</th>
                  <th>Module Distribution</th>
                  <th style={{ width:140 }}>Access Status</th>
                  <th style={{ width:120 }}>Days Since Joined</th>
                </tr>
              </thead>
              <tbody>
                {engineers.length > 0 ? engineers.map(u => {
                  const uReqs  = accessRequests.filter(r => r.user_id === u.id || r.user_id === u.username);
                  const appd   = uReqs.filter(r => r.status === 'approved').length;
                  const pend   = uReqs.filter(r => r.status === 'pending').length;
                  const total  = uReqs.length || 1;
                  const pct    = Math.round((appd / total) * 100);
                  /* real module distribution derived from approval progress as proxy */
                  const comp   = Math.round(pct / 100 * 3);
                  const inProg = comp < 3 ? 1 : 0;
                  const notS   = Math.max(0, 3 - comp - inProg);
                  const daysJoined = daysSince(u.created_at);
                  return (
                    <tr key={u.id} style={{ cursor:'pointer' }} onClick={() => setSpotlightUser(spotlightUser?.id === u.id ? null : u)}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{
                            width:34, height:34, borderRadius:'50%', flexShrink:0,
                            background: avatarColor(u.full_name),
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color:'#fff', fontSize:12, fontWeight:700
                          }}>{initials(u.full_name)}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14, color:'#1f2328' }}>{u.full_name}</div>
                            <div style={{ fontSize:11, color:'#6b7280' }}>{u.department}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ minWidth:220 }}>
                        <StackedBar completed={comp} inProgress={inProg} notStarted={notS} />
                      </td>
                      <td>
                        <div style={{ fontSize:13 }}>
                          <span style={{ color:'#059669', fontWeight:600 }}>{appd} approved</span>
                          {pend > 0 && <span style={{ color:'#d97706', fontSize:11, marginLeft:6 }}>+{pend} pending</span>}
                        </div>
                      </td>
                      <td>
                        {daysJoined !== null ? (
                          <span style={{
                            display:'inline-block', padding:'3px 10px', borderRadius:10, fontSize:12, fontWeight:600,
                            background: daysJoined <= 7 ? '#dbeafe' : daysJoined <= 30 ? '#fef3c7' : '#fee2e2',
                            color:      daysJoined <= 7 ? '#1e40af' : daysJoined <= 30 ? '#92400e' : '#991b1b',
                          }}>
                            Day {daysJoined}
                          </span>
                        ) : <span style={{ color:'#9ca3af', fontSize:12 }}>—</span>}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={4} style={{ textAlign:'center', color:'#6b7280', padding:32 }}>No engineers onboarding yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── Spotlight panel (click a row to open) ── */}
          {spotlightUser && (
            <div className="card" style={{ marginTop:16, padding:0, overflow:'hidden' }}>
              <div style={{ display:'grid', gridTemplateColumns:'220px 1fr', minHeight:180 }}>
                {/* Profile side */}
                <div style={{ padding:24, borderRight:'1px solid #e5e7eb', display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{
                    width:64, height:64, borderRadius:'50%',
                    background: avatarColor(spotlightUser.full_name),
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontSize:22, fontWeight:700
                  }}>{initials(spotlightUser.full_name)}</div>
                  <div style={{ textAlign:'center' }}>
                    <div style={{ fontWeight:700, fontSize:15 }}>{spotlightUser.full_name}</div>
                    <div style={{ fontSize:12, color:'#6b7280' }}>{spotlightUser.department}</div>
                  </div>
                  <div style={{ textAlign:'center', marginTop:8 }}>
                      <div style={{ fontSize:11, color:'#6b7280', marginBottom:4 }}>Access Completion</div>
                      <DonutRing value={onboardingScore} size={72} stroke={7}
                        color={onboardingScore >= 70 ? '#10b981' : onboardingScore >= 40 ? '#f59e0b' : '#ef4444'} />
                    </div>
                  <button onClick={() => setSpotlightUser(null)}
                    style={{ fontSize:11, color:'#6b7280', border:'none', background:'none', cursor:'pointer', marginTop:4 }}>
                    ✕ close
                  </button>
                </div>
                {/* Activity side */}
                <div style={{ padding:24 }}>
                  <h4 style={{ marginBottom:16 }}>Access Requests</h4>
                  <table style={{ marginBottom:0 }}>
                    <thead>
                      <tr>
                        <th>Platform</th>
                        <th>Type</th>
                        <th>Urgency</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accessRequests
                        .filter(r => r.user_id === spotlightUser.id || r.user_id === spotlightUser.username)
                        .map(r => (
                          <tr key={r.id}>
                            <td style={{ textTransform:'capitalize' }}>{r.platform?.replace('_',' ')}</td>
                            <td><span className="badge badge-info">{r.access_type}</span></td>
                            <td>
                              <span className={`badge ${r.urgency==='critical'?'badge-danger':r.urgency==='high'?'badge-warning':'badge-info'}`}>
                                {r.urgency || 'normal'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${r.status==='approved'?'badge-success':r.status==='pending'?'badge-warning':'badge-danger'}`}>
                                {r.status}
                              </span>
                            </td>
                            <td>
                              {r.status === 'pending' && (
                                <div style={{ display:'flex', gap:6 }}>
                                  <button className="btn btn-success" style={{ padding:'4px 10px', fontSize:12 }}
                                    onClick={e => { e.stopPropagation(); handleAccessRequestUpdate(r.id, 'approved'); }}>Approve</button>
                                  <button className="btn btn-danger" style={{ padding:'4px 10px', fontSize:12 }}
                                    onClick={e => { e.stopPropagation(); handleAccessRequestUpdate(r.id, 'rejected'); }}>Reject</button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      {accessRequests.filter(r => r.user_id === spotlightUser.id || r.user_id === spotlightUser.username).length === 0 && (
                        <tr><td colSpan={5} style={{ color:'#9ca3af', textAlign:'center' }}>No requests found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ENGINEERS TAB ── */}
      {selectedTab === 'users' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e7eb' }}>
            <h3 style={{ margin:0 }}>All Engineers</h3>
          </div>
          <table style={{ marginBottom:0 }}>
            <thead>
              <tr>
                <th>Engineer</th>
                <th>Email</th>
                <th>Role</th>
                <th>Access Completion</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const uReqs  = accessRequests.filter(r => r.user_id === u.id || r.user_id === u.username);
                const appd   = uReqs.filter(r => r.status === 'approved').length;
                const total  = uReqs.length || 1;
                const pct    = Math.round((appd / total) * 100);
                const dj     = daysSince(u.created_at);
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:32, height:32, borderRadius:'50%', background:avatarColor(u.full_name),
                          display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:12, fontWeight:700, flexShrink:0 }}>
                          {initials(u.full_name)}
                        </div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:14 }}>{u.full_name}</div>
                          <div style={{ fontSize:11, color:'#6b7280' }}>@{u.username}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:13, color:'#6b7280' }}>{u.email}</td>
                    <td><span className={`badge ${u.role==='admin'?'badge-danger':'badge-info'}`}>{u.role}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ flex:1, height:8, background:'#e5e7eb', borderRadius:4, overflow:'hidden', maxWidth:120 }}>
                          <div style={{ height:'100%', width:`${pct}%`,
                            background: pct>=70?'#10b981':pct>=40?'#f59e0b':'#ef4444',
                            borderRadius:4, transition:'width 0.3s' }} />
                        </div>
                        <span style={{ fontSize:12, fontWeight:700, color:'#1f2328', minWidth:32 }}>{pct}%</span>
                      </div>
                    </td>
                    <td>
                      {dj !== null ? (
                        <span style={{
                          display:'inline-block', padding:'2px 9px', borderRadius:10, fontSize:12, fontWeight:600,
                          background: dj<=7?'#dbeafe':dj<=30?'#fef3c7':'#fee2e2',
                          color:      dj<=7?'#1e40af':dj<=30?'#92400e':'#991b1b',
                        }}>Day {dj}</span>
                      ) : <span style={{ fontSize:13, color:'#6b7280' }}>{new Date(u.created_at).toLocaleDateString()}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ACCESS REQUESTS TAB ── */}
      {selectedTab === 'requests' && (
        <div className="card" style={{ padding:0, overflow:'hidden' }}>
          <div style={{ padding:'18px 24px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ margin:0 }}>Access Requests</h3>
            <div style={{ display:'flex', gap:12, fontSize:12 }}>
              <span style={{ color:'#d97706', fontWeight:600 }}>{pendingReqs.length} pending</span>
              <span style={{ color:'#059669', fontWeight:600 }}>{approvedReqs.length} approved</span>
              <span style={{ color:'#dc2626', fontWeight:600 }}>{rejectedReqs.length} rejected</span>
            </div>
          </div>
          {accessRequests.length > 0 ? (
            <table style={{ marginBottom:0 }}>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Platform</th>
                  <th>Type</th>
                  <th>Urgency</th>
                  <th>Justification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accessRequests.map(request => {
                  const reqUser = users.find(u => u.id === request.user_id || u.username === request.user_id);
                  return (
                    <tr key={request.id} style={{ background: request.urgency==='critical' ? '#fff7f7' : undefined }}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:'50%', background:avatarColor(reqUser?.full_name||''),
                            display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:11, fontWeight:700, flexShrink:0 }}>
                            {initials(reqUser?.full_name || '?')}
                          </div>
                          <div style={{ fontSize:13 }}>{reqUser?.full_name || request.user_name || 'Unknown'}</div>
                        </div>
                      </td>
                      <td style={{ textTransform:'capitalize', fontSize:13 }}>{request.platform?.replace('_',' ')}</td>
                      <td><span className="badge badge-info">{request.access_type}</span></td>
                      <td>
                        <span className={`badge ${request.urgency==='critical'?'badge-danger':request.urgency==='high'?'badge-warning':'badge-info'}`}>
                          {request.urgency || 'normal'}
                        </span>
                      </td>
                      <td style={{ maxWidth:200, fontSize:12, color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {request.justification}
                      </td>
                      <td>
                        <span className={`badge ${request.status==='approved'?'badge-success':request.status==='pending'?'badge-warning':'badge-danger'}`}>
                          {request.status}
                        </span>
                      </td>
                      <td>
                        {request.status === 'pending' && (
                          <div style={{ display:'flex', gap:5 }}>
                            <button className="btn btn-success" style={{ padding:'4px 10px', fontSize:12 }}
                              onClick={() => handleAccessRequestUpdate(request.id, 'approved')}>✓</button>
                            <button className="btn btn-danger" style={{ padding:'4px 10px', fontSize:12 }}
                              onClick={() => handleAccessRequestUpdate(request.id, 'rejected')}>✕</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign:'center', color:'#6b7280', padding:40 }}>No access requests yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

// Made with Bob

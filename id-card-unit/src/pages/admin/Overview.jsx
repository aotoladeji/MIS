import { useState, useEffect } from 'react';

export default function Overview({ user }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCards: 0,
    pendingApprovals: 0,
    cardsToday: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch users count
      const usersRes = await fetch('http://localhost:5000/api/users', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const usersData = await usersRes.json();

      // Fetch cards count
      const cardsRes = await fetch('http://localhost:5000/api/cards', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const cardsData = await cardsRes.json();

      // Fetch recent logs
      const logsRes = await fetch('http://localhost:5000/api/logs', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const logsData = await logsRes.json();

      setStats({
        totalUsers: usersData.users?.length || 0,
        totalCards: cardsData.cards?.length || 0,
        pendingApprovals: cardsData.cards?.filter(c => c.status === 'pending')?.length || 0,
        cardsToday: cardsData.cards?.filter(c => {
          const today = new Date().toDateString();
          const cardDate = new Date(c.created_at).toDateString();
          return today === cardDate;
        })?.length || 0
      });

      setRecentActivity(logsData.logs?.slice(0, 5) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <>
      <div className="header">
        <h1>Welcome back, {user?.name}! 👋</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          Here's what's happening in your system today
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">👥 Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">🎴 Total Cards</div>
          <div className="stat-value">{stats.totalCards}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⏳ Pending Approvals</div>
          <div className="stat-value">{stats.pendingApprovals}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📅 Cards Today</div>
          <div className="stat-value">{stats.cardsToday}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          {recentActivity.length > 0 ? (
            <div>
              {recentActivity.map((log, index) => (
                <div 
                  key={log.id || index}
                  style={{
                    padding: '1rem',
                    borderBottom: index < recentActivity.length - 1 ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong>{log.action}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                    {log.username || 'System'} - {log.details}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ padding: '1rem', color: 'var(--text-dim)' }}>No recent activity</p>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              ➕ Create New User
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              📊 View Reports
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>
              📄 Export Data
            </button>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3 className="card-title">System Status</h3>
        </div>
        <div className="grid-2">
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Database Connection</span>
              <span className="badge badge-success">Healthy</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>API Server</span>
              <span className="badge badge-success">Running</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Storage</span>
              <span className="badge badge-success">78% Used</span>
            </div>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Last Backup</span>
              <span style={{ color: 'var(--text-dim)' }}>2 hours ago</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span>Active Sessions</span>
              <span style={{ color: 'var(--text-dim)' }}>3 users</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Uptime</span>
              <span style={{ color: 'var(--text-dim)' }}>99.9%</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
import { useState, useEffect } from 'react';

export default function SupervisorOverview({ user }) {
  const [stats, setStats] = useState({
    pendingReprints: 0,
    pendingMaterials: 0,
    pendingReports: 0,
    totalStaff: 0
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all data
      const [reprintsRes, materialsRes, reportsRes, usersRes] = await Promise.all([
        fetch('http://localhost:5000/api/reprint', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/material', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/daily-reports', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/users', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      const [reprints, materials, reports, users] = await Promise.all([
        reprintsRes.json(),
        materialsRes.json(),
        reportsRes.json(),
        usersRes.json()
      ]);

      setStats({
        pendingReprints: reprints.requests?.filter(r => r.status === 'pending').length || 0,
        pendingMaterials: materials.requests?.filter(m => m.status === 'pending').length || 0,
        pendingReports: reports.reports?.filter(r => r.verification_status === 'pending').length || 0,
        totalStaff: users.users?.filter(u => u.role === 'staff').length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  return (
    <>
      <div className="header">
        <h1>Welcome back, {user?.name}! 👋</h1>
        <p style={{ color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          Supervisor Dashboard - Manage your team and approvals
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">⏳ Pending Reprint Requests</div>
          <div className="stat-value">{stats.pendingReprints}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📦 Pending Material Requests</div>
          <div className="stat-value">{stats.pendingMaterials}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">📊 Pending Daily Reports</div>
          <div className="stat-value">{stats.pendingReports}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">👥 Total Staff</div>
          <div className="stat-value">{stats.totalStaff}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              ➕ Create Staff Account
            </button>
            <button className="btn btn-secondary" style={{ width: '100%', marginBottom: '0.75rem' }}>
              ✓ Review Approvals
            </button>
            <button className="btn btn-secondary" style={{ width: '100%' }}>
              📊 View Reports
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Supervisor Responsibilities</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0,
              color: 'var(--text-dim)'
            }}>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                ✓ Approve/Reject reprint requests
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                ✓ Manage material requisitions
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                ✓ Verify daily reports
              </li>
              <li style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                ✓ Manage staff accounts & permissions
              </li>
              <li style={{ padding: '0.5rem 0' }}>
                ✓ Monitor collection statistics
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
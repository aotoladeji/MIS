import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ChangePasswordModal from '../components/ChangePasswordModal';

export default function UserProfile() {
  const { user } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <>
      <div className="header">
        <h1>👤 My Profile</h1>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Account Information</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                color: 'var(--text-dim)', 
                marginBottom: '0.5rem' 
              }}>
                Full Name
              </label>
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--bg)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {user?.name}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                color: 'var(--text-dim)', 
                marginBottom: '0.5rem' 
              }}>
                Staff ID
              </label>
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--bg)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {user?.staff_id}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                color: 'var(--text-dim)', 
                marginBottom: '0.5rem' 
              }}>
                Username
              </label>
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--bg)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {user?.username}
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                color: 'var(--text-dim)', 
                marginBottom: '0.5rem' 
              }}>
                Role
              </label>
              <div>
                <span className={`badge badge-${
                  user?.role === 'admin' ? 'danger' : 
                  user?.role === 'supervisor' ? 'warning' : 
                  'info'
                }`}>
                  {user?.role?.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                fontSize: '0.9rem', 
                color: 'var(--text-dim)', 
                marginBottom: '0.5rem' 
              }}>
                Account Created
              </label>
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--bg)', 
                borderRadius: '8px',
                border: '1px solid var(--border)'
              }}>
                {new Date(user?.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Security Settings</h3>
          </div>
          <div style={{ padding: '1rem' }}>
            <div style={{ 
              padding: '1.5rem', 
              background: 'var(--bg)', 
              borderRadius: '10px',
              marginBottom: '1.5rem'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔒</div>
              <h4 style={{ marginBottom: '0.5rem' }}>Password</h4>
              <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
                Keep your account secure by using a strong password
              </p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowChangePassword(true)}
              >
                🔒 Change Password
              </button>
            </div>

            {user?.role === 'staff' && (
              <div style={{ 
                padding: '1.5rem', 
                background: 'var(--bg)', 
                borderRadius: '10px'
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔑</div>
                <h4 style={{ marginBottom: '0.5rem' }}>Permissions</h4>
                <p style={{ color: 'var(--text-dim)', marginBottom: '1rem' }}>
                  You have {user?.permissions?.length || 0} active permissions
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {user?.permissions?.map((perm, index) => (
                    <span key={index} className="badge badge-info">
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showChangePassword && (
        <ChangePasswordModal 
          onSuccess={() => setShowChangePassword(false)}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </>
  );
}
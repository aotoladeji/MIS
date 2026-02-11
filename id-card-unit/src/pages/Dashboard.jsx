import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ChangePasswordModal from '../components/ChangePasswordModal';
import UserProfile from './UserProfile';

// Admin imports
import Overview from './admin/Overview';
import UserManagement from './admin/UserManagement';
import SystemLogs from './admin/SystemLogs';
import Analytics from './admin/Analytics';
import AllReports from './admin/AllReports';
import InventoryManagement from './admin/InventoryManagement';
import FaultyDeliveryManagement from './admin/FaultyDeliveryManagement';
import MaterialRequestManagement from './admin/MaterialRequestManagement';


// Supervisor imports
import SupervisorOverview from './supervisor/SupervisorOverview';
import ReprintApproval from './supervisor/ReprintApproval';
import MaterialRequestsApproval from './supervisor/MaterialRequestsApproval';
import DailyReportsReview from './supervisor/DailyReportsReview';
import StaffManagement from './supervisor/StaffManagement';
import CollectionStats from './supervisor/CollectionStats';
import FaultyDeliveryReview from './supervisor/FaultyDeliveryReview';
import InventoryOverview from './supervisor/InventoryOverview';

// Staff imports
import StaffOverview from './staff/StaffOverview';
import InventoryLog from './staff/InventoryLog';
import ReprintRequests from './staff/ReprintRequests';
import MaterialRequests from './staff/MaterialRequests';
import DailyReportSubmission from './staff/DailyReportSubmission';
import CardCollection from './staff/CardCollection';
import CardApproval from './staff/CardApproval';
import PrintQueue from './staff/PrintQueue';

import '../styles/dashboard.css';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePasswordChanged = () => {
    setShowChangePassword(false);
    // Optionally, you can logout and require re-login
    logout();
    navigate('/login');
  };

  // Define tabs based on user role
  const getTabs = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'overview', label: '🏠 Overview' },
        { id: 'users', label: '👥 User Management' },
        { id: 'inventory', label: '📦 Inventory' },
        { id: 'faulty-deliveries', label: '⚠️ Faulty Deliveries' },
        { id: 'material-requests', label: '📦 Material Requests' },
        { id: 'logs', label: '📋 System Logs' },
        { id: 'analytics', label: '📊 Analytics' },
        { id: 'reports', label: '📄 All Reports' }
      ];
    } else if (user?.role === 'supervisor') {
      return [
        { id: 'overview', label: '🏠 Overview' },
        { id: 'inventory-overview', label: '📦 Inventory' },
        { id: 'faulty-deliveries', label: '⚠️ Faulty Deliveries' },
        { id: 'reprint', label: '🔄 Reprint Approvals' },
        { id: 'material', label: '📦 Material Requests' },
        { id: 'daily-reports', label: '📊 Daily Reports' },
        { id: 'staff', label: '👥 Staff Management' },
        { id: 'collections', label: '📈 Collections' }
      ];
    } else {
      // Staff permissions
      const permissions = user?.permissions || [];
      const tabs = [{ id: 'overview', label: '🏠 Dashboard' }];

      if (permissions.includes('inventory')) {
        tabs.push({ id: 'inventory', label: '📦 Inventory' });
      }
      if (permissions.includes('reprint')) {
        tabs.push({ id: 'reprint', label: '🔄 Reprint Requests' });
      }
      if (permissions.includes('material')) {
        tabs.push({ id: 'material', label: '📦 Material Requests' });
      }
      if (permissions.includes('daily-report')) {
        tabs.push({ id: 'daily-report', label: '📊 Daily Reports' });
      }
      if (permissions.includes('collection')) {
        tabs.push({ id: 'collection', label: '🎴 Collection' });
      }
      if (permissions.includes('approval')) {
        tabs.push({ id: 'approval', label: '✓ Card Approval' });
      }
      if (permissions.includes('printing')) {
        tabs.push({ id: 'print-queue', label: '🖨️ Print Queue' });
        tabs.push({ id: 'profile', label: '👤 Profile' });
      }

      return tabs;
    }
  };

  const renderContent = () => {
    //common profile tab for all users
    if (user?.role === 'admin') {
      switch (activeTab) {
        case 'overview':
          return <Overview user={user} />;
        case 'users':
          return <UserManagement />;
        case 'inventory':
          return <InventoryManagement />;
        case 'faulty-deliveries':
          return <FaultyDeliveryManagement />;
        case 'material-requests':
          return <MaterialRequestManagement />;
        case 'logs':
          return <SystemLogs />;
        case 'analytics':
          return <Analytics />;
        case 'reports':
          return <AllReports />;
        default:
          return <div>Content for {activeTab} coming soon...</div>;
      }
    }

    // Supervisor content
    if (user?.role === 'supervisor') {
      switch (activeTab) {
        case 'overview':
         return <SupervisorOverview user={user} />;
        case 'inventory-overview':
          return <InventoryOverview />;
        case 'faulty-deliveries':
          return <FaultyDeliveryReview />;
        case 'reprint':
          return <ReprintApproval />;
        case 'material':
          return <MaterialRequestsApproval />;
        case 'daily-reports':
          return <DailyReportsReview />;
        case 'staff':
          return <StaffManagement />;
        case 'collections':
          return <CollectionStats />;
        default:
          return <div>Content for {activeTab} coming soon...</div>;
      }
    }   

    // Staff content
    switch (activeTab) {
      case 'overview':
        return <StaffOverview user={user} />;
      case 'inventory':
        return <InventoryLog />;
      case 'reprint':
        return <ReprintRequests />;
      case 'material':
        return <MaterialRequests />;
      case 'daily-report':
        return <DailyReportSubmission />;
      case 'collection':
        return <CardCollection />;
      case 'approval':
        return <CardApproval />;
      case 'print-queue':
        return <PrintQueue />;
      default:
        return (
          <div>
            <div className="header">
              <h1>Access Denied</h1>
            </div>
            <div className="card">
              <p>You don't have permission to access this feature.</p>
              <p>Please contact your supervisor to request access.</p>
            </div>
          </div>
        );
    }
  };

  const tabs = getTabs();

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <h1>🎴 MIS ID Card System</h1>
       
        <div className="user-info">
          <span style={{ color: 'var(--text-dim)' }}>
            {user?.name}
          </span>
          <span className={`badge badge-${
            user?.role === 'admin' ? 'danger' : 
            user?.role === 'supervisor' ? 'warning' : 
            'info'
          }`}>
            {user?.role?.toUpperCase()}
          </span>
          <button 
            onClick={() => setShowChangePassword(true)} 
            className="btn btn-secondary btn-sm"
            style={{ marginRight: '0.5rem' }}
          >
            🔒 Change Password
          </button>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm">
            🚪 Logout
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="dashboard-nav">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      <main className="dashboard-content">
        {renderContent()}
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <ChangePasswordModal 
          onSuccess={handlePasswordChanged}
          onClose={() => setShowChangePassword(false)}
        />
      )}
    </div>
  );
}
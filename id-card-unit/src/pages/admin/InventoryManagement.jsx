import { useState, useEffect } from 'react';
import { showNotification } from '../../utils/errorHandler';

export default function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('weekly');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setInventory(data.inventory);
      } else {
        showNotification(data.message || 'Failed to fetch inventory', 'error');
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const approveItem = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/inventory/${id}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'approved' })
      });

      const data = await response.json();

      if (response.ok) {
        setInventory(inventory.map(item => 
          item.id === id ? { ...item, status: 'approved' } : item
        ));
        showNotification('Item approved successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to approve item', 'error');
      }
    } catch (error) {
      console.error('Error approving item:', error);
      showNotification('Unable to connect to server', 'error');
    }
  };

  const printReport = () => {
    const now = new Date();
    let startDate, endDate = now;

    if (reportType === 'weekly') {
      startDate = new Date(now.setDate(now.getDate() - 7));
    } else if (reportType === 'monthly') {
      startDate = new Date(now.setMonth(now.getMonth() - 1));
    } else if (reportType === 'annually') {
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
    }

    const filteredInventory = inventory.filter(item => {
      const itemDate = new Date(item.created_at);
      return itemDate >= startDate && itemDate <= endDate;
    });

    // Generate report content
    let reportContent = `
      <h1>Inventory Report - ${reportType.toUpperCase()}</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Period: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}</p>
      <hr>
      <h2>Summary</h2>
      <p>Total Items: ${filteredInventory.length}</p>
      <p>Total Quantity: ${filteredInventory.reduce((sum, item) => sum + parseInt(item.quantity), 0)}</p>
      <hr>
      <h2>Details</h2>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Unit</th>
            <th>Added By</th>
            <th>Date Added</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${filteredInventory.map(item => `
            <tr>
              <td>${item.item_name}</td>
              <td>${item.quantity}</td>
              <td>${item.unit}</td>
              <td>${item.added_by_name || 'N/A'}</td>
              <td>${new Date(item.created_at).toLocaleDateString()}</td>
              <td>${item.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Report - ${reportType}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { margin-top: 20px; }
            th { background: #f0f0f0; padding: 10px; text-align: left; }
            td { padding: 8px; }
          </style>
        </head>
        <body>
          ${reportContent}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const totalItems = inventory.reduce((sum, item) => sum + parseInt(item.quantity), 0);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px' 
      }}>
        <div style={{ textAlign: 'center', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading inventory...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>📦 Inventory Management</h1>
        <div className="btn-group">
          <select 
            className="btn btn-secondary btn-sm"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            style={{ marginRight: '0.5rem' }}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
          <button className="btn btn-primary btn-sm" onClick={printReport}>
            🖨️ Print {reportType} Report
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Items in Store</div>
          <div className="stat-value">{totalItems}</div>
          <div className="stat-change">Across {inventory.length} categories</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value">
            {inventory.filter(i => i.status === 'pending').length}
          </div>
          <div className="stat-change">Awaiting review</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved Items</div>
          <div className="stat-value">
            {inventory.filter(i => i.status === 'approved').length}
          </div>
          <div className="stat-change positive">Ready to use</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Item Name</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Added By</th>
              <th>Date Added</th>
              <th>Last Restocked</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map(item => (
              <tr key={item.id}>
                <td>{item.item_name}</td>
                <td>{item.quantity}</td>
                <td>{item.unit}</td>
                <td>{item.added_by_name || 'N/A'}</td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
                <td>
                  {item.last_restocked 
                    ? new Date(item.last_restocked).toLocaleDateString() 
                    : 'Never'}
                </td>
                <td>
                  <span className={`badge badge-${
                    item.status === 'approved' ? 'success' : 
                    item.status === 'rejected' ? 'danger' : 
                    'warning'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td>
                  {item.status === 'pending' && (
                    <button 
                      className="btn btn-success btn-sm"
                      onClick={() => approveItem(item.id)}
                    >
                      ✓ Approve
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
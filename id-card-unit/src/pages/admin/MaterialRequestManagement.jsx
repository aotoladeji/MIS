import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { showNotification } from '../../utils/errorHandler';

export default function MaterialRequestManagement() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/material', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(data.requests);
      } else {
        showNotification(data.message || 'Failed to fetch requests', 'error');
      }
    } catch (error) {
      console.error('Error fetching material requests:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addressRequest = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const handleAddressSubmit = async (status) => {
    const responseMessage = prompt('Enter response message:');
    const actionTaken = prompt('Describe action taken:');

    if (!responseMessage) {
      showNotification('Response message is required', 'warning');
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/material/${selectedRequest.id}/address`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status,
          responseMessage,
          actionTaken
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(requests.map(req => 
          req.id === selectedRequest.id ? data.request : req
        ));
        setModalOpen(false);
        showNotification('Material request addressed successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to address request', 'error');
      }
    } catch (error) {
      console.error('Error addressing request:', error);
      showNotification('Unable to connect to server', 'error');
    }
  };

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
          <div>Loading requests...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>📦 Material Request Management</h1>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
            <p>No material requests found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Urgency</th>
                <th>Requested By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Responded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.item_name}</td>
                  <td>{req.quantity}</td>
                  <td>
                    <span className={`badge badge-${
                      req.urgency === 'urgent' ? 'danger' : 
                      req.urgency === 'high' ? 'warning' : 
                      'info'
                    }`}>
                      {req.urgency}
                    </span>
                  </td>
                  <td>{req.requested_by_username}</td>
                  <td>{new Date(req.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${
                      req.status === 'approved' || req.status === 'fulfilled' ? 'success' : 
                      req.status === 'rejected' ? 'danger' : 
                      'warning'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td>{req.responded_by_username || '-'}</td>
                  <td>
                    <div className="btn-group">
                      {req.status === 'pending' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => addressRequest(req)}
                        >
                          📝 Address
                        </button>
                      )}
                      {req.response_message && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => alert(`Response:\n\n${req.response_message}\n\nResponded by: ${req.responded_by_username || 'N/A'}\nDate: ${req.responded_at ? new Date(req.responded_at).toLocaleString() : 'N/A'}`)}
                        >
                          👁️ View Response
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Address Material Request"
        size="medium"
      >
        {selectedRequest && (
          <div>
            <div style={{ 
              padding: '1rem', 
              background: 'var(--bg)', 
              borderRadius: '10px', 
              marginBottom: '1.5rem' 
            }}>
              <h4>Request Details</h4>
              <p><strong>Item:</strong> {selectedRequest.item_name}</p>
              <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
              <p><strong>Urgency:</strong> <span className={`badge badge-${
                selectedRequest.urgency === 'urgent' ? 'danger' : 
                selectedRequest.urgency === 'high' ? 'warning' : 
                'info'
              }`}>{selectedRequest.urgency}</span></p>
              <p><strong>Requested By:</strong> {selectedRequest.requested_by_username}</p>
              {selectedRequest.response_message && (
                <p><strong>Forwarding Notes:</strong> {selectedRequest.response_message}</p>
              )}
            </div>

            <div className="btn-group" style={{ display: 'flex', gap: '1rem' }}>
              <button 
                className="btn btn-success" 
                style={{ flex: 1 }}
                onClick={() => handleAddressSubmit('approved')}
              >
                ✓ Approve
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                onClick={() => handleAddressSubmit('fulfilled')}
              >
                ✓ Fulfill
              </button>
              <button 
                className="btn btn-danger" 
                style={{ flex: 1 }}
                onClick={() => handleAddressSubmit('rejected')}
              >
                ✗ Reject
              </button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
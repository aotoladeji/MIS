import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import RespondForm from '../../components/supervisor/RespondForm';
import { showNotification } from '../../utils/errorHandler';

export default function MaterialRequestsApproval() {
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

  const respondToRequest = (request) => {
    setSelectedRequest(request);
    setModalOpen(true);
  };

  const forwardToAdmin = async (request) => {
    const urgency = prompt('Set urgency level (normal/high/urgent):', request.urgency);
    
    if (!urgency || !['normal', 'high', 'urgent'].includes(urgency.toLowerCase())) {
      showNotification('Invalid urgency level', 'error');
      return;
    }

    const notes = prompt('Add forwarding notes for admin:');

    try {
      const response = await fetch(`http://localhost:5000/api/material/${request.id}/forward`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          urgency: urgency.toLowerCase(),
          forwardNotes: notes || 'Forwarded for admin review'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setRequests(requests.map(req => 
          req.id === request.id ? data.request : req
        ));
        showNotification('Request forwarded to admin successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to forward request', 'error');
      }
    } catch (error) {
      console.error('Error forwarding request:', error);
      showNotification('Unable to connect to server', 'error');
    }
  };

  const handleResponseSubmit = (updatedRequest) => {
    setRequests(requests.map(req => 
      req.id === updatedRequest.id ? updatedRequest : req
    ));
    showNotification('Response submitted successfully', 'success');
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
        <h1>📦 Material Requests</h1>
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
                      req.status === 'approved' ? 'success' : 
                      req.status === 'rejected' ? 'danger' : 
                      'warning'
                    }`}>
                      {req.status}
                    </span>
                  </td>
                  <td>
                    <div className="btn-group">
                      {req.status === 'pending' && (
                        <>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => respondToRequest(req)}
                          >
                            💬 Respond
                          </button>
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => forwardToAdmin(req)}
                          >
                            ➡️ Forward to Admin
                          </button>
                        </>
                      )}
                      {req.status !== 'pending' && req.response_message && (
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
        title="Respond to Material Request"
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
              <p><strong>Item:</strong> {selectedRequest.item_name}</p>
              <p><strong>Quantity:</strong> {selectedRequest.quantity}</p>
              <p><strong>Urgency:</strong> {selectedRequest.urgency}</p>
              <p><strong>Requested By:</strong> {selectedRequest.requested_by_username}</p>
            </div>
            <RespondForm
              requestId={selectedRequest.id}
              onSubmit={handleResponseSubmit}
              onClose={() => setModalOpen(false)}
            />
          </div>
        )}
      </Modal>
    </>
  );
}
import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import SubmitReprintForm from '../../components/staff/SubmitReprintForm';
import { showNotification } from '../../utils/errorHandler';

export default function ReprintRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/reprint', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Filter to show only current user's requests
        const userId = JSON.parse(localStorage.getItem('user')).id;
        const myRequests = data.requests.filter(r => r.requested_by === userId);
        setRequests(myRequests);
      } else {
        showNotification(data.message || 'Failed to fetch requests', 'error');
      }
    } catch (error) {
      console.error('Error fetching reprint requests:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = () => {
    setModalOpen(true);
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
        <h1>🔄 Reprint Requests</h1>
        <button className="btn btn-primary btn-sm" onClick={submitRequest}>
          ➕ Submit Reprint Request
        </button>
      </div>

      <div className="card">
        {requests.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔄</div>
            <p>No reprint requests yet. Submit your first request!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Matric Number</th>
                <th>Student Name</th>
                <th>Reason</th>
                <th>Date</th>
                <th>Status</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {requests.map(req => (
                <tr key={req.id}>
                  <td>{req.matric_number}</td>
                  <td>{req.student_name}</td>
                  <td style={{ maxWidth: '200px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {req.reason}
                    </div>
                  </td>
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
                  <td>{req.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Submit Reprint Request"
        size="medium"
      >
        <SubmitReprintForm
          onSubmit={(newRequest) => {
            setRequests([newRequest, ...requests]);
            showNotification('Reprint request submitted successfully', 'success');
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}
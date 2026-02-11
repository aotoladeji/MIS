import { useState, useEffect } from 'react';
import { showNotification } from '../../utils/errorHandler';

export default function FaultyDeliveryReview() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const fetchDeliveries = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/inventory/faulty', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setDeliveries(data.deliveries);
      } else {
        showNotification(data.message || 'Failed to fetch deliveries', 'error');
      }
    } catch (error) {
      console.error('Error fetching faulty deliveries:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const attestDelivery = async (id) => {
    const notes = prompt('Enter attestation notes (optional):');
    
    try {
      const response = await fetch(`http://localhost:5000/api/inventory/faulty/${id}/attest`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'acknowledged',
          resolutionNotes: notes || 'Acknowledged by supervisor'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setDeliveries(deliveries.map(d => 
          d.id === id ? data.delivery : d
        ));
        showNotification('Faulty delivery attested successfully', 'success');
      } else {
        showNotification(data.message || 'Failed to attest delivery', 'error');
      }
    } catch (error) {
      console.error('Error attesting delivery:', error);
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
          <div>Loading faulty deliveries...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>⚠️ Faulty Delivery Reports</h1>
      </div>

      <div className="card">
        {deliveries.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <p>No faulty delivery reports</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Issue</th>
                <th>Reported By</th>
                <th>Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveries.map(delivery => (
                <tr key={delivery.id}>
                  <td>{delivery.item_name}</td>
                  <td>{delivery.quantity}</td>
                  <td style={{ maxWidth: '250px' }}>
                    <div style={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap' 
                    }}>
                      {delivery.issue_description}
                    </div>
                  </td>
                  <td>{delivery.reported_by_name}</td>
                  <td>{new Date(delivery.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${
                      delivery.status === 'resolved' ? 'success' : 
                      delivery.status === 'acknowledged' ? 'warning' : 
                      'danger'
                    }`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td>
                    {delivery.status === 'pending' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => attestDelivery(delivery.id)}
                      >
                        ✓ Attest
                      </button>
                    )}
                    {delivery.status !== 'pending' && delivery.resolution_notes && (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => alert(`Notes: ${delivery.resolution_notes}`)}
                      >
                        👁️ View Notes
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
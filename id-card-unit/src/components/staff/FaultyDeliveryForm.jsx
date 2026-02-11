import { useState } from 'react';

export default function FaultyDeliveryForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    issueDescription: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/inventory/faulty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          itemName: formData.itemName,
          quantity: parseInt(formData.quantity),
          issueDescription: formData.issueDescription
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit(data.report);
        onClose();
      } else {
        setError(data.message || 'Failed to log faulty delivery');
      }
    } catch (err) {
      console.error('Faulty delivery error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="alert alert-danger">
          {error}
        </div>
      )}

      <div className="alert alert-warning">
        <strong>⚠️ Important:</strong> Please provide detailed information about the faulty or damaged delivery.
      </div>

      <div className="form-group">
        <label>Item Name *</label>
        <input 
          type="text" 
          className="form-control" 
          value={formData.itemName}
          onChange={(e) => setFormData({...formData, itemName: e.target.value})}
          placeholder="e.g., Blank PVC Cards"
          required
        />
      </div>

      <div className="form-group">
        <label>Quantity Affected *</label>
        <input 
          type="number" 
          className="form-control" 
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
          placeholder="e.g., 50"
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label>Issue Description *</label>
        <textarea 
          className="form-control" 
          rows="5"
          value={formData.issueDescription}
          onChange={(e) => setFormData({...formData, issueDescription: e.target.value})}
          placeholder="Describe the damage or fault in detail..."
          required
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn btn-danger" 
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Logging...' : '⚠️ Log Faulty Delivery'}
      </button>
    </form>
  );
}
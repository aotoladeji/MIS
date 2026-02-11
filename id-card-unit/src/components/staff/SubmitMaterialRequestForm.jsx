import { useState } from 'react';

export default function SubmitMaterialRequestForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    itemName: '',
    quantity: '',
    urgency: 'normal'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/material', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit(data.request);
        onClose();
      } else {
        setError(data.message || 'Failed to submit material request');
      }
    } catch (err) {
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
        <label>Quantity *</label>
        <input 
          type="number" 
          className="form-control" 
          value={formData.quantity}
          onChange={(e) => setFormData({...formData, quantity: e.target.value})}
          placeholder="e.g., 100"
          min="1"
          required
        />
      </div>

      <div className="form-group">
        <label>Urgency Level *</label>
        <select 
          className="form-control"
          value={formData.urgency}
          onChange={(e) => setFormData({...formData, urgency: e.target.value})}
          required
        >
          <option value="normal">Normal</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      <div className="alert alert-info">
        <strong>ℹ️ Note:</strong> Your request will be reviewed by your supervisor.
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Submitting...' : 'Submit Material Request'}
      </button>
    </form>
  );
}
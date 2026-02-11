import { useState } from 'react';

export default function SubmitDailyReportForm({ onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    cardsCaptured: '',
    cardsApproved: '',
    cardsPrinted: '',
    cardsCollected: '',
    issuesEncountered: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/daily-reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reportDate: formData.reportDate,
          cardsCaptured: parseInt(formData.cardsCaptured),
          cardsApproved: parseInt(formData.cardsApproved),
          cardsPrinted: parseInt(formData.cardsPrinted),
          cardsCollected: parseInt(formData.cardsCollected),
          issuesEncountered: formData.issuesEncountered
        })
      });

      const data = await response.json();

      if (response.ok) {
        onSubmit(data.report);
        onClose();
      } else {
        setError(data.message || 'Failed to submit daily report');
      }
    } catch (err) {
      console.error('Daily report error:', err);
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

      <div className="alert alert-info">
        <strong>ℹ️ Daily Report:</strong> Submit your daily activity summary for supervisor review.
      </div>

      <div className="form-group">
        <label>Report Date *</label>
        <input 
          type="date" 
          className="form-control" 
          value={formData.reportDate}
          onChange={(e) => setFormData({...formData, reportDate: e.target.value})}
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      <div className="grid-2" style={{ gap: '1rem' }}>
        <div className="form-group">
          <label>Cards Captured *</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.cardsCaptured}
            onChange={(e) => setFormData({...formData, cardsCaptured: e.target.value})}
            placeholder="0"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Cards Approved *</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.cardsApproved}
            onChange={(e) => setFormData({...formData, cardsApproved: e.target.value})}
            placeholder="0"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Cards Printed *</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.cardsPrinted}
            onChange={(e) => setFormData({...formData, cardsPrinted: e.target.value})}
            placeholder="0"
            min="0"
            required
          />
        </div>

        <div className="form-group">
          <label>Cards Collected *</label>
          <input 
            type="number" 
            className="form-control" 
            value={formData.cardsCollected}
            onChange={(e) => setFormData({...formData, cardsCollected: e.target.value})}
            placeholder="0"
            min="0"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Issues/Challenges Encountered</label>
        <textarea 
          className="form-control" 
          rows="4"
          value={formData.issuesEncountered}
          onChange={(e) => setFormData({...formData, issuesEncountered: e.target.value})}
          placeholder="Describe any challenges or issues..."
        ></textarea>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary" 
        disabled={loading}
        style={{ width: '100%' }}
      >
        {loading ? 'Submitting...' : 'Submit Report'}
      </button>
    </form>
  );
}
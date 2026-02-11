import { useState, useEffect } from 'react';
import { showNotification } from '../../utils/errorHandler';

export default function CardCollection() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cards', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Show only printed cards that are ready for collection
        const readyCards = data.cards.filter(c => 
          c.status === 'printed' || c.status === 'collected'
        );
        setCards(readyCards);
      } else {
        showNotification(data.message || 'Failed to fetch cards', 'error');
      }
    } catch (error) {
      console.error('Error fetching cards:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const markCollected = async (cardId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/cards/${cardId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'collected',
          notes: 'Card collected by student/staff'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setCards(cards.map(card => 
          card.id === cardId ? data.card : card
        ));
        showNotification('Card marked as collected', 'success');
      } else {
        showNotification(data.message || 'Failed to update card', 'error');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      showNotification('Unable to connect to server', 'error');
    }
  };

  const filteredCards = cards.filter(card => 
    card.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <div>Loading cards...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>🎴 ID Card Collection</h1>
      </div>

      <div className="card">
        <div style={{ 
          position: 'relative', 
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          borderRadius: '10px'
        }}>
          <span style={{ fontSize: '1.25rem' }}>🔍</span>
          <input 
            type="text"
            placeholder="Search by matric number or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '1rem',
              color: 'var(--text)'
            }}
          />
        </div>

        {filteredCards.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎴</div>
            <p>
              {searchTerm 
                ? 'No cards found matching your search' 
                : 'No cards ready for collection yet'}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Matric/Staff No.</th>
                <th>Name</th>
                <th>Faculty</th>
                <th>Status</th>
                <th>Collection Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.map(card => (
                <tr key={card.id}>
                  <td>{card.matric_number}</td>
                  <td>{card.full_name}</td>
                  <td>{card.faculty}</td>
                  <td>
                    <span className={`badge badge-${
                      card.status === 'collected' ? 'success' : 'warning'
                    }`}>
                      {card.status === 'collected' ? 'Collected' : 'Ready'}
                    </span>
                  </td>
                  <td>
                    {card.status === 'collected' 
                      ? new Date(card.updated_at).toLocaleDateString() 
                      : '-'}
                  </td>
                  <td>
                    {card.status !== 'collected' && (
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => markCollected(card.id)}
                      >
                        ✓ Mark Collected
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
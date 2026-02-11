import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import CardReviewForm from '../../components/staff/CardReviewForm';
import { showNotification } from '../../utils/errorHandler';

export default function CardApproval() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cards?status=pending', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCards(data.cards || []);
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

  const viewCard = (card) => {
    setSelectedCard(card);
    setModalOpen(true);
  };

  const handleApprove = (updatedCard) => {
    setCards(cards.filter(c => c.id !== updatedCard.id));
    showNotification('Card approved successfully', 'success');
  };

  const handleReject = (updatedCard) => {
    setCards(cards.filter(c => c.id !== updatedCard.id));
    showNotification('Card rejected - recapture required', 'warning');
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
          <div>Loading approval queue...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>✓ Card Approval Queue</h1>
      </div>

      <div className="card">
        {cards.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✓</div>
            <p>No cards pending approval. Great job!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Matric/Staff No.</th>
                <th>Name</th>
                <th>Faculty</th>
                <th>Captured Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id}>
                  <td>{card.matric_number}</td>
                  <td>{card.full_name}</td>
                  <td>{card.faculty}</td>
                  <td>{new Date(card.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className="badge badge-warning">
                      {card.status}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => viewCard(card)}
                    >
                      👁️ Review & Approve
                    </button>
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
        title="Review ID Card"
        size="large"
      >
        {selectedCard && (
          <CardReviewForm
            card={selectedCard}
            onApprove={handleApprove}
            onReject={handleReject}
            onClose={() => setModalOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}
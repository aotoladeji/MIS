import { useState, useEffect } from 'react';
import { showNotification } from '../../utils/errorHandler';

export default function PrintQueue() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCards, setSelectedCards] = useState([]);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    fetchPrintQueue();
  }, []);

  const fetchPrintQueue = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/cards?status=approved', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setCards(data.cards || []);
      } else {
        showNotification(data.message || 'Failed to fetch print queue', 'error');
      }
    } catch (error) {
      console.error('Error fetching print queue:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleCardSelection = (cardId) => {
    if (selectedCards.includes(cardId)) {
      setSelectedCards(selectedCards.filter(id => id !== cardId));
    } else {
      setSelectedCards([...selectedCards, cardId]);
    }
  };

  const selectAll = () => {
    if (selectedCards.length === cards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map(c => c.id));
    }
  };

  const printCards = async (cardIds) => {
    setPrinting(true);

    try {
      // Print each card
      for (const cardId of cardIds) {
        const response = await fetch(`http://localhost:5000/api/cards/${cardId}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            status: 'printed',
            notes: 'Printed by staff'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to update card status');
        }
      }

      // Remove printed cards from queue
      setCards(cards.filter(c => !cardIds.includes(c.id)));
      setSelectedCards([]);
      
      showNotification(
        `Successfully printed ${cardIds.length} card${cardIds.length > 1 ? 's' : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Error printing cards:', error);
      showNotification('Failed to print cards', 'error');
    } finally {
      setPrinting(false);
    }
  };

  const printSelected = () => {
    if (selectedCards.length === 0) {
      showNotification('Please select at least one card to print', 'warning');
      return;
    }

    if (confirm(`Print ${selectedCards.length} selected card(s)?`)) {
      printCards(selectedCards);
    }
  };

  const printSingle = (cardId) => {
    if (confirm('Print this card?')) {
      printCards([cardId]);
    }
  };

  const printAll = () => {
    if (cards.length === 0) {
      showNotification('No cards in print queue', 'warning');
      return;
    }

    if (confirm(`Print all ${cards.length} cards in queue?`)) {
      printCards(cards.map(c => c.id));
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
          <div>Loading print queue...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>🖨️ Print Queue</h1>
        <div className="btn-group">
          <button 
            className="btn btn-secondary btn-sm"
            onClick={selectAll}
          >
            {selectedCards.length === cards.length ? '☐ Deselect All' : '☑ Select All'}
          </button>
          <button 
            className="btn btn-primary btn-sm"
            onClick={printSelected}
            disabled={selectedCards.length === 0 || printing}
          >
            🖨️ Print Selected ({selectedCards.length})
          </button>
          <button 
            className="btn btn-success btn-sm"
            onClick={printAll}
            disabled={cards.length === 0 || printing}
          >
            🖨️ Print All ({cards.length})
          </button>
        </div>
      </div>

      {printing && (
        <div className="alert alert-info">
          <strong>🖨️ Printing...</strong> Please wait while cards are being printed.
        </div>
      )}

      <div className="card">
        {cards.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🖨️</div>
            <p>No cards in print queue. All caught up!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '50px' }}>
                  <input 
                    type="checkbox"
                    checked={selectedCards.length === cards.length}
                    onChange={selectAll}
                    style={{ cursor: 'pointer' }}
                  />
                </th>
                <th>Matric Number</th>
                <th>Full Name</th>
                <th>Faculty</th>
                <th>Department</th>
                <th>Level</th>
                <th>Approved Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id}>
                  <td>
                    <input 
                      type="checkbox"
                      checked={selectedCards.includes(card.id)}
                      onChange={() => toggleCardSelection(card.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                  <td>{card.matric_number}</td>
                  <td>{card.full_name}</td>
                  <td>{card.faculty}</td>
                  <td>{card.department}</td>
                  <td>{card.level}</td>
                  <td>{new Date(card.updated_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => printSingle(card.id)}
                      disabled={printing}
                    >
                      🖨️ Print
                    </button>
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
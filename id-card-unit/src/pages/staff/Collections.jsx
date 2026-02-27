import { useState, useEffect } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useConfirmDialog } from '../../hooks/useConfirmDialog';
import { showNotification } from '../../utils/errorHandler';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('awaiting_collection');
  const [search, setSearch] = useState('');
  const [collecting, setCollecting] = useState({});
  const { dialogState, showDialog, closeDialog } = useConfirmDialog();

  useEffect(() => {
    fetchCollections();
    fetchStats();
  }, [filter]);

  const fetchCollections = async () => {
    try {
      const params = new URLSearchParams({
        ...(filter && { status: filter }),
        ...(search && { search })
      });

      const response = await fetch(`http://localhost:5000/api/collections?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      console.log('[Collections] API Response:', { status: response.status, ok: response.ok, data });
      
      if (response.ok) {
        console.log('[Collections] Setting collections:', data.collections?.length, 'cards');
        setCollections(data.collections || []);
      } else {
        console.error('[Collections] API Error:', data);
        showNotification(data.message || 'Error fetching collections', 'error');
      }
    } catch (error) {
      console.error('[Collections] Fetch error:', error);
      showNotification('Error fetching collections', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/collections/stats', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const markAsCollected = async (id) => {
    const notes = await showDialog({
      type: 'prompt',
      title: 'Collection Notes',
      message: 'Add any notes (optional):'
    });
    
    if (notes === null) return;
    
    setCollecting(prev => ({ ...prev, [id]: true }));
    try {
      const response = await fetch(`http://localhost:5000/api/collections/${id}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notes })
      });

      const data = await response.json();
      if (response.ok) {
        showNotification('Card marked as collected!', 'success');
        fetchCollections();
        fetchStats();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Error marking as collected', 'error');
    } finally {
      setCollecting(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCollections();
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Loading collections...</div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>🎴 Card Collections</h1>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="stats-grid" style={{ marginBottom: '2rem' }}>
          <div className="stat-card">
            <div className="stat-label">Total Printed</div>
            <div className="stat-value">{stats.total_printed}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Collected</div>
            <div className="stat-value" style={{ color: 'var(--success)' }}>
              {stats.total_collected}
            </div>
            <div className="stat-change">
              {((stats.total_collected / stats.total_printed) * 100).toFixed(1)}% collection rate
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Awaiting Collection</div>
            <div className="stat-value" style={{ color: 'var(--warning)' }}>
              {stats.awaiting_collection}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Collected Today</div>
            <div className="stat-value">{stats.collected_today}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'end' }}>
          <div style={{ flex: 1 }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID, or card number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="btn btn-primary">
                🔍 Search
              </button>
            </form>
          </div>
          <div className="btn-group">
            <button
              className={`btn btn-sm ${filter === 'awaiting_collection' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('awaiting_collection')}
            >
              Awaiting ({stats?.awaiting_collection || 0})
            </button>
            <button
              className={`btn btn-sm ${filter === 'collected' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('collected')}
            >
              Collected ({stats?.total_collected || 0})
            </button>
            <button
              className={`btn btn-sm ${filter === '' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter('')}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Collections Table */}
      <div className="card">
        {collections.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-dim)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            No {filter === 'awaiting_collection' ? 'pending' : filter === 'collected' ? 'collected' : ''} cards found
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>ID Number</th>
                <th>Card Number</th>
                <th>Faculty/Department</th>
                <th>Printed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map(card => (
                <tr key={card.id}>
                  <td>
                    <strong>{card.surname}</strong> {card.other_names}
                  </td>
                  <td>{card.matric_no || card.staff_id || '—'}</td>
                  <td>{card.card_number || '—'}</td>
                  <td>
                    <div>{card.department}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                      {card.faculty}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>
                    {new Date(card.printed_at).toLocaleDateString()}
                  </td>
                  <td>
                    {card.status === 'awaiting_collection' ? (
                      <span className="badge badge-warning">Awaiting Collection</span>
                    ) : (
                      <span className="badge badge-success">
                        Collected
                        {card.collected_at && (
                          <span style={{ display: 'block', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            {new Date(card.collected_at).toLocaleDateString()}
                          </span>
                        )}
                      </span>
                    )}
                  </td>
                  <td>
                    {card.status === 'awaiting_collection' ? (
                      <button
                        className="btn btn-success btn-sm"
                        onClick={() => markAsCollected(card.id)}
                        disabled={collecting[card.id]}
                      >
                        {collecting[card.id] ? '⏳ Processing...' : '✓ Mark Collected'}
                      </button>
                    ) : (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                        Collected by: {card.collected_by_name || '—'}
                        {card.notes && (
                          <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Note: {card.notes}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        title={dialogState.title}
        message={dialogState.message}
        onConfirm={dialogState.onConfirm}
        onCancel={closeDialog}
      />
    </>
  );
}
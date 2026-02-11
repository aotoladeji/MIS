import { useState, useEffect } from 'react';

export default function CollectionStats() {
  const [stats, setStats] = useState({
    today: 0,
    week: 0,
    month: 0,
    rate: 0
  });
  const [recentCollections, setRecentCollections] = useState([]);

  useEffect(() => {
    fetchCollectionData();
  }, []);

  const fetchCollectionData = async () => {
    try {
      // Fetch cards that have been collected
      const response = await fetch('http://localhost:5000/api/cards?status=collected', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const cards = data.cards || [];
        const now = new Date();
        const today = now.toDateString();
        const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

        // Calculate stats
        const todayCount = cards.filter(c => 
          new Date(c.updated_at).toDateString() === today
        ).length;

        const weekCount = cards.filter(c => 
          new Date(c.updated_at) >= weekAgo
        ).length;

        const monthCount = cards.filter(c => 
          new Date(c.updated_at) >= monthAgo
        ).length;

        setStats({
          today: todayCount,
          week: weekCount,
          month: monthCount,
          rate: cards.length > 0 ? Math.round((cards.length / (cards.length + 10)) * 100) : 0
        });

        setRecentCollections(cards.slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching collection data:', error);
    }
  };

  const printReport = () => {
    alert('Print report feature coming soon!');
  };

  return (
    <>
      <div className="header">
        <h1>📈 Collection Statistics</h1>
        <button className="btn btn-secondary btn-sm" onClick={printReport}>
          📄 Print Report
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Today's Collections</div>
          <div className="stat-value">{stats.today}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Week</div>
          <div className="stat-value">{stats.week}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">This Month</div>
          <div className="stat-value">{stats.month}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Collection Rate</div>
          <div className="stat-value">{stats.rate}%</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Collections</h3>
        </div>
        {recentCollections.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <p>No collection records found</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Matric Number</th>
                <th>Full Name</th>
                <th>Faculty</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentCollections.map((card, index) => (
                <tr key={card.id || index}>
                  <td>{new Date(card.updated_at).toLocaleDateString()}</td>
                  <td>{card.matric_number}</td>
                  <td>{card.full_name}</td>
                  <td>{card.faculty}</td>
                  <td>{new Date(card.updated_at).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
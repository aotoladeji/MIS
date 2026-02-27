import { useState, useEffect } from 'react';

export default function StaffOverview({ user }) {
  const [stats, setStats] = useState({
    totalCards: 0,
    totalInventory: 0,
    pendingReprints: 0,
    approvedReprints: 0,
    dailyPrints: 0,
    cardsCollected: 0,
    collectionRate: 0,
    inventoryItems: 0
  });
  const [recentInventory, setRecentInventory] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      // Fetch all data in parallel
      const [cardsRes, reprintsRes, inventoryRes, printHistoryRes, collectionsRes] = await Promise.all([
        fetch('http://localhost:5000/api/cards', { headers }),
        fetch('http://localhost:5000/api/reprint', { headers }),
        fetch('http://localhost:5000/api/inventory', { headers }),
        fetch('http://localhost:5000/api/print-history', { headers }),
        fetch('http://localhost:5000/api/collections', { headers })
      ]);

      const [cardsData, reprintsData, inventoryData, printHistoryData, collectionsData] = await Promise.all([
        cardsRes.json(),
        reprintsRes.json(),
        inventoryRes.json(),
        printHistoryRes.json(),
        collectionsRes.json()
      ]);

      const cards = cardsData.cards || [];
      const reprints = reprintsData.requests || [];
      const inventory = inventoryData.inventory || [];
      const printHistory = printHistoryData.history || [];
      const collections = collectionsData.collections || [];

      const today = new Date().toDateString();
      
      // Daily prints from print_history table (actual prints today)
      const todayPrints = printHistory.filter(p => 
        new Date(p.printed_at).toDateString() === today
      );

      // Cards collected from card_collections table
      const collectedCards = collections.filter(c => c.status === 'collected');
      
      // Collection rate based on collections table
      const awaitingCollection = collections.filter(c => c.status === 'awaiting_collection').length;
      const totalPrinted = collections.length;
      const collectionRate = totalPrinted > 0 
        ? Math.round((collectedCards.length / totalPrinted) * 100) 
        : 0;

      // Calculate total inventory items
      const totalInventoryItems = inventory.reduce((sum, item) => 
        sum + (parseInt(item.quantity) || 0), 0
      );

      setStats({
        totalCards: cards.length,
        totalInventory: totalInventoryItems,
        pendingReprints: reprints.filter(r => r.status === 'pending').length,
        approvedReprints: reprints.filter(r => r.status === 'approved').length,
        dailyPrints: todayPrints.length,
        cardsCollected: collectedCards.length,
        collectionRate,
        inventoryItems: inventory.length
      });

      setRecentInventory(inventory.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  return (
    <>
      <div className="header">
        <h1>📊 Dashboard & Stock Overview</h1>
        <button className="btn btn-secondary btn-sm">
          📅 {new Date().toLocaleDateString()}
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Cards Issued</div>
          <div className="stat-value">{stats.totalCards}</div>
          <div className="stat-change positive">Active system cards</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Inventory Items</div>
          <div className="stat-value">{stats.totalInventory}</div>
          <div className="stat-change">{stats.inventoryItems} different items</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Pending Reprints</div>
          <div className="stat-value">{stats.pendingReprints}</div>
          <div className="stat-change">Awaiting approval</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Approved Reprints</div>
          <div className="stat-value">{stats.approvedReprints}</div>
          <div className="stat-change positive">Ready to print</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Daily Prints</div>
          <div className="stat-value">{stats.dailyPrints}</div>
          <div className="stat-change">Today's count</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Cards Collected</div>
          <div className="stat-value">{stats.cardsCollected}</div>
          <div className="stat-change positive">{stats.collectionRate}% collection rate</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Inventory</h3>
          <button className="btn btn-secondary btn-sm">View All</button>
        </div>
        {recentInventory.length === 0 ? (
          <div style={{ 
            padding: '2rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <p>No inventory items yet</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Date Added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentInventory.map(item => (
                <tr key={item.id}>
                  <td>{item.item_name}</td>
                  <td>{item.quantity} {item.unit}</td>
                  <td>{new Date(item.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge badge-${
                      item.status === 'approved' ? 'success' : 
                      item.status === 'rejected' ? 'danger' : 
                      'warning'
                    }`}>
                      {item.status}
                    </span>
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
export default function Analytics() {
  const generateReport = () => {
    alert('Generate report feature coming soon!');
  };

  return (
    <>
      <div className="header">
        <h1>Analytics Dashboard</h1>
        <button className="btn btn-secondary btn-sm" onClick={generateReport}>
          📄 Generate Report
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total System Users</div>
          <div className="stat-value">12</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Sessions</div>
          <div className="stat-value">3</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Cards Processed (MTD)</div>
          <div className="stat-value">1,250</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Avg. Processing Time</div>
          <div className="stat-value">4.2m</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Performance Metrics</h3>
        </div>
        <div className="grid-2">
          <div>
            <h4>Top Performers</h4>
            <table>
              <tbody>
                <tr>
                  <td>staff1</td>
                  <td>423 cards</td>
                </tr>
                <tr>
                  <td>staff2</td>
                  <td>387 cards</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h4>Recent Issues</h4>
            <table>
              <tbody>
                <tr>
                  <td>Faulty Deliveries</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>Reprint Requests</td>
                  <td>3</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
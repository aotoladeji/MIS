export default function AllReports() {
  const reportCategories = [
    'Inventory Reports',
    'Activity Reports',
    'Reprint Reports',
    'Collection Reports',
    'Material Request Reports',
    'Daily Activity Summaries'
  ];

  const viewReport = (category) => {
    alert(`Viewing ${category} - Feature coming soon!`);
  };

  return (
    <>
      <div className="header">
        <h1>Reports & Analytics</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Reports</div>
          <div className="stat-value">156</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Approvals</div>
          <div className="stat-value">8</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Approved This Month</div>
          <div className="stat-value">142</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Report Categories</h3>
        </div>
        <div className="btn-group" style={{flexWrap: 'wrap'}}>
          {reportCategories.map((category, index) => (
            <button 
              key={index}
              className="btn btn-secondary"
              onClick={() => viewReport(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
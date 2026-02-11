import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import SubmitDailyReportForm from '../../components/staff/SubmitDailyReportForm';
import { showNotification } from '../../utils/errorHandler';

export default function DailyReportSubmission() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/daily-reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Filter to show only current user's reports
        const userId = JSON.parse(localStorage.getItem('user')).id;
        const myReports = data.reports.filter(r => r.submitted_by === userId);
        setReports(myReports);
      } else {
        showNotification(data.message || 'Failed to fetch reports', 'error');
      }
    } catch (error) {
      console.error('Error fetching daily reports:', error);
      showNotification('Unable to connect to server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const submitReport = () => {
    setModalOpen(true);
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
          <div>Loading reports...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>📊 Daily Report Submission</h1>
        <button className="btn btn-primary btn-sm" onClick={submitReport}>
          ➕ Submit Daily Report
        </button>
      </div>

      <div className="card">
        {reports.length === 0 ? (
          <div style={{ 
            padding: '3rem', 
            textAlign: 'center', 
            color: 'var(--text-dim)' 
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
            <p>No daily reports yet. Submit your first report!</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Captured</th>
                <th>Approved</th>
                <th>Printed</th>
                <th>Collected</th>
                <th>Status</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reports.map(report => (
                <tr key={report.id}>
                  <td>{new Date(report.report_date).toLocaleDateString()}</td>
                  <td>{report.cards_captured}</td>
                  <td>{report.cards_approved}</td>
                  <td>{report.cards_printed}</td>
                  <td>{report.cards_collected}</td>
                  <td>
                    <span className={`badge badge-${
                      report.verification_status === 'verified' ? 'success' : 
                      report.verification_status === 'rejected' ? 'danger' : 
                      'warning'
                    }`}>
                      {report.verification_status}
                    </span>
                  </td>
                  <td>
                    {report.supervisor_remarks ? (
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => alert(`Supervisor Remarks:\n\n${report.supervisor_remarks}`)}
                      >
                        👁️ View
                      </button>
                    ) : (
                      '-'
                    )}
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
        title="Submit Daily Report"
        size="large"
      >
        <SubmitDailyReportForm
          onSubmit={(newReport) => {
            setReports([newReport, ...reports]);
            showNotification('Daily report submitted successfully', 'success');
          }}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </>
  );
}
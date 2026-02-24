import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import { showNotification } from '../../utils/errorHandler';
import { useAuth } from '../../hooks/useAuth';

export default function SchedulingManagement() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [configDetails, setConfigDetails] = useState(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/scheduling', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setConfigs(data.configs);
      }
    } catch (error) {
      showNotification('Error fetching scheduling configs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const viewDetails = async (config) => {
    try {
      const response = await fetch(`http://localhost:5000/api/scheduling/${config.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        setConfigDetails(data);
        setShowDetailsModal(true);
      }
    } catch (error) {
      showNotification('Error fetching details', 'error');
    }
  };

  const toggleConfig = async (id, isClosed) => {
    try {
      const response = await fetch(`http://localhost:5000/api/scheduling/${id}/toggle`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_closed: !isClosed })
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(data.message, 'success');
        fetchConfigs();
      }
    } catch (error) {
      showNotification('Error toggling scheduling', 'error');
    }
  };

  const sendEmails = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/scheduling/${id}/send-emails`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await response.json();
      if (response.ok) {
        showNotification(data.message, 'success');
        fetchConfigs();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Error sending emails', 'error');
    }
  };

  const deleteConfig = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?\n\nThis will permanently delete:\n- All student records\n- All appointments\n- All time slots\n\nThis action CANNOT be undone!`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/scheduling/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        showNotification(
          `Deleted: ${data.deleted.config} (${data.deleted.students} students, ${data.deleted.appointments} appointments)`,
          'success'
        );
        fetchConfigs();
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Error deleting scheduling configuration', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>Loading scheduling configurations...</div>
      </div>
    );
  }

  return (
    <>
      <div className="header">
        <h1>📅 Scheduling Management</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          ➕ Create New Schedule
        </button>
      </div>

      {configs.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
          <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
            No scheduling configurations yet
          </p>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            Create Your First Schedule
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {configs.map(config => (
            <div key={config.id} className="card">
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {config.title}
                      {config.is_closed ? (
                        <span className="badge badge-danger">Closed</span>
                      ) : (
                        <span className="badge badge-success">Open</span>
                      )}
                      <span className="badge badge-info">{config.type}</span>
                    </h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                      {config.description || 'No description'}
                    </p>
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1rem',
                  padding: '1rem',
                  background: 'var(--bg)',
                  borderRadius: '8px',
                  marginBottom: '1rem'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      Total Students
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                      {config.total_students || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      Scheduled
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--success)' }}>
                      {config.scheduled_count || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      Slots/Period
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                      {config.slots_per_period}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                      End Time
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>
                      {config.daily_end_time?.substring(0, 5) || '14:00'}
                    </div>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: '6px' }}>
                    📅 Start: {new Date(config.start_date).toLocaleDateString()}
                  </div>
                  {config.end_date && (
                    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: '6px' }}>
                      🏁 End: {new Date(config.end_date).toLocaleDateString()}
                    </div>
                  )}
                  {config.exclude_weekends && (
                    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: '6px' }}>
                      🚫 No Weekends
                    </div>
                  )}
                </div>

                <div className="btn-group">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => viewDetails(config)}
                  >
                    👁️ View Details
                  </button>
                  <button
                    className={`btn btn-sm ${config.is_closed ? 'btn-success' : 'btn-warning'}`}
                    onClick={() => toggleConfig(config.id, config.is_closed)}
                  >
                    {config.is_closed ? '🔓 Reopen' : '🔒 Close'}
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => sendEmails(config.id)}
                    disabled={config.total_students === 0}
                  >
                    📧 Send Emails
                  </button>
                  {/* Only show delete button for supervisor and admin */}
            {(user?.role === 'supervisor' || user?.role === 'admin') && (
                <button
                className="btn btn-danger btn-sm"
                onClick={() => deleteConfig(config.id, config.title)}
                >
                🗑️ Delete
                </button>
            )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Scheduling Configuration"
        size="large"
      >
        <CreateSchedulingForm
          onSuccess={() => {
            setShowCreateModal(false);
            fetchConfigs();
          }}
        />
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Scheduling Details"
        size="large"
      >
        {configDetails && <SchedulingDetails details={configDetails} />}
      </Modal>
    </>
  );
}

function CreateSchedulingForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'weekly',
    slotsPerPeriod: 50,
    startDate: '',
    endDate: '',
    dailyEndTime: '14:00',
    excludeWeekends: true,
    location: 'Mcarthur Building university of Ibadan',
    importantMessage: `Please arrive 10 minutes before your scheduled time
Bring a valid ID for verification
Dress appropriately for your ID photo`
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create config
      const response = await fetch('http://localhost:5000/api/scheduling', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      const configId = data.config.id;

      // Upload student list if provided
      if (file) {
        const formDataFile = new FormData();
        formDataFile.append('file', file);

        const uploadResponse = await fetch(`http://localhost:5000/api/scheduling/${data.config.id}/students`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
          body: formDataFile
        });

        const uploadData = await uploadResponse.json();
        
        if (uploadResponse.ok) {
          showNotification(
            `Scheduling created! ${uploadData.imported} student(s) imported successfully.`,
            'success'
          );
        } else {
          showNotification(
            `Scheduling created but upload failed: ${uploadData.message}`,
            'warning'
          );
        }
      } else {
        showNotification('Scheduling created successfully', 'success');
      }

      onSuccess(); // This will refresh the list
    } catch (error) {
      showNotification(error.message || 'Error creating scheduling', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="form-group">
        <label>Title *</label>
        <input
          type="text"
          className="form-control"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          className="form-control"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows="3"
        />
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Scheduling Type *</label>
          <select
            className="form-control"
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group">
          <label>Slots Per Period * (20-100)</label>
          <input
            type="number"
            className="form-control"
            value={formData.slotsPerPeriod}
            onChange={(e) => setFormData({ ...formData, slotsPerPeriod: parseInt(e.target.value) })}
            min="20"
            max="100"
            required
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Start Date *</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label>End Date (Optional)</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="grid-2">
        <div className="form-group">
          <label>Daily End Time *</label>
          <input
            type="time"
            className="form-control"
            value={formData.dailyEndTime}
            onChange={(e) => setFormData({ ...formData, dailyEndTime: e.target.value })}
            required
          />
        </div>

        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={formData.excludeWeekends}
              onChange={(e) => setFormData({ ...formData, excludeWeekends: e.target.checked })}
            />
            Exclude Weekends
          </label>
        </div>
      </div>

      <div className="form-group">
        <label>Appointment Location</label>
        <input
          type="text"
          className="form-control"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="e.g., ID Card Unit, MIS Department"
        />
        <small style={{ color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>
          This will be shown to students on their confirmation page
        </small>
      </div>

      <div className="form-group">
        <label>Important Message (Instructions for Students)</label>
        <textarea
          className="form-control"
          value={formData.importantMessage}
          onChange={(e) => setFormData({ ...formData, importantMessage: e.target.value })}
          rows="5"
          placeholder="Enter important instructions (one per line)"
        />
        <small style={{ color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>
          Each line will be shown as a separate bullet point
        </small>
      </div>

      <div className="form-group">
        <label>Upload Student List (Excel/CSV) *</label>
        <input
          type="file"
          className="form-control"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files[0])}
          required
        />
        <small style={{ color: 'var(--text-dim)', marginTop: '0.5rem', display: 'block' }}>
          Required columns: <strong>full_name</strong>, <strong>email</strong>, and either <strong>jamb_number</strong> or <strong>pg_reg_number</strong>
          <br />
          Optional: faculty, department, level, phone
        </small>
      </div>

      <div className="btn-group">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : '✓ Create Schedule & Import Students'}
        </button>
      </div>
    </form>
  );
}

function SchedulingDetails({ details }) {
  const [activeTab, setActiveTab] = useState('students');

  return (
    <div>
      <div style={{
        display: 'flex',
        gap: '0',
        marginBottom: '1.5rem',
        background: 'var(--bg)',
        borderRadius: '10px',
        padding: '0.25rem'
      }}>
        <button
          onClick={() => setActiveTab('students')}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'students' ? '600' : '400',
            background: activeTab === 'students' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'students' ? 'white' : 'var(--text-dim)'
          }}
        >
          👥 Students ({details.students?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: activeTab === 'slots' ? '600' : '400',
            background: activeTab === 'slots' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'slots' ? 'white' : 'var(--text-dim)'
          }}
        >
          📅 Time Slots ({details.slots?.length || 0})
        </button>
      </div>

      {activeTab === 'students' && (
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          {details.students?.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>
              No students added yet
            </p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Full Name</th>
                  <th>Student ID</th>
                  <th>Email</th>
                  <th>Login Code</th>
                  <th>Scheduled</th>
                  <th>Appointment</th>
                </tr>
              </thead>
              <tbody>
                {details.students?.map(student => (
                  <tr key={student.id}>
                    <td>{student.full_name}</td>
                    <td>{student.jamb_number || student.pg_reg_number}</td>
                    <td>{student.email}</td>
                    <td><code>{student.login_code}</code></td>
                    <td>
                      <span className={`badge badge-${student.has_scheduled ? 'success' : 'warning'}`}>
                        {student.has_scheduled ? '✓ Yes' : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      {student.appointment_date ? (
                        <span style={{ fontSize: '0.85rem' }}>
                          {new Date(student.appointment_date).toLocaleDateString()} at {student.appointment_time?.substring(0, 5)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'slots' && (
        <div style={{ maxHeight: '500px', overflow: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {details.slots?.map(slot => (
                <tr key={slot.id}>
                  <td>{new Date(slot.slot_date).toLocaleDateString()}</td>
                  <td>{slot.slot_time.substring(0, 5)}</td>
                  <td>{slot.capacity}</td>
                  <td>{slot.booked}</td>
                  <td>
                    <span className={`badge badge-${slot.booked >= slot.capacity ? 'danger' : 'success'}`}>
                      {slot.booked >= slot.capacity ? 'Full' : 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
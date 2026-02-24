import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { showNotification } from '../../utils/errorHandler';

export default function StudentScheduling() {
  const { configId } = useParams();
  const [step, setStep] = useState('login'); // login, schedule, confirmation
  const [studentId, setStudentId] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [student, setStudent] = useState(null);
  const [config, setConfig] = useState(null);
  const [slots, setSlots] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/public/scheduling/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ configId, studentId, loginCode })
      });

      const data = await response.json();
      
      if (response.ok) {
        setStudent(data.student);
        setConfig(data.config);
        
        if (data.student.hasScheduled) {
          setStep('confirmation');
        } else {
          await fetchSlots();
          setStep('schedule');
        }
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/public/scheduling/${configId}/available-slots`);
      const data = await response.json();
      if (response.ok) {
        setSlots(data.slots);
      }
    } catch (error) {
      showNotification('Error loading slots', 'error');
    }
  };

  const handleBookSlot = async () => {
    if (!selectedSlot) {
      showNotification('Please select a time slot', 'warning');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/public/scheduling/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: student.id,
          slotId: selectedSlot.id,
          configId
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification('Appointment booked successfully!', 'success');
        setStep('confirmation');
        setStudent({ ...student, appointment: data.appointment });
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Error booking appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/api/public/scheduling/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });

      const data = await response.json();
      
      if (response.ok) {
        showNotification('Appointment cancelled', 'success');
        setStudent({ ...student, hasScheduled: false, appointment: null });
        await fetchSlots();
        setStep('schedule');
      } else {
        showNotification(data.message, 'error');
      }
    } catch (error) {
      showNotification('Error cancelling appointment', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2.5rem',
        maxWidth: '900px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        {step === 'login' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: '#333' }}>
                📅 Schedule Your ID Card Capture
              </h1>
              <p style={{ color: '#666' }}>
                Enter your credentials to book an appointment
              </p>
            </div>

            <form onSubmit={handleLogin} style={{ maxWidth: '400px', margin: '0 auto' }}>
              <div className="form-group">
                <label>Student ID (JAMB Number or PG Reg Number)</label>
                <input
                  type="text"
                  className="form-control"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g., 12345678 or PG/2024/001"
                  required
                />
              </div>

              <div className="form-group">
                <label>Login Code</label>
                <input
                  type="text"
                  className="form-control"
                  value={loginCode}
                  onChange={(e) => setLoginCode(e.target.value)}
                  placeholder="6-digit code from email"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Continue →'}
              </button>
            </form>
          </>
        )}

        {step === 'schedule' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                Welcome, {student?.fullName}! 👋
              </h2>
              <p style={{ color: '#666' }}>
                Select a date and time for your ID card capture appointment
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f0f0', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                📧 {student?.email} • {student?.faculty} • {student?.department}
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Available Time Slots</h3>
              
              {Object.keys(slots).length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
                  No available slots at the moment
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                  {Object.entries(slots).map(([date, dateSlots]) => (
                    <div key={date}>
                      <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: '#333' }}>
                        {new Date(date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                        gap: '0.5rem'
                      }}>
                        {dateSlots.map(slot => (
                          <button
                            key={slot.id}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            style={{
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: selectedSlot?.id === slot.id ? '2px solid #667eea' : '1px solid #ddd',
                              background: selectedSlot?.id === slot.id ? '#667eea' : 'white',
                              color: selectedSlot?.id === slot.id ? 'white' : '#333',
                              cursor: 'pointer',
                              fontSize: '0.9rem',
                              fontWeight: selectedSlot?.id === slot.id ? '600' : '400',
                              transition: 'all 0.2s'
                            }}
                          >
                            ⏰ {slot.slot_time.substring(0, 5)}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleBookSlot}
                disabled={!selectedSlot || loading}
              >
                {loading ? 'Booking...' : '✓ Confirm Appointment'}
              </button>
            </div>
          </>
        )}

        {step === 'confirmation' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#333' }}>
                Appointment Confirmed!
              </h2>
              <p style={{ color: '#666' }}>
                Your ID card capture has been scheduled
              </p>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '15px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#333' }}>
                Appointment Details
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Name:</span>
                  <strong>{student?.fullName}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Date:</span>
                  <strong>
                    {student?.appointment?.appointment_date && 
                      new Date(student.appointment.appointment_date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })
                    }
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Time:</span>
                  <strong>{student?.appointment?.appointment_time?.substring(0, 5)}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Location:</span>
                  <strong>ID Card Unit, MIS Department</strong>
                </div>
              </div>
            </div>

            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '10px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <strong style={{ color: '#856404' }}>⚠️ Important:</strong>
              <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#856404' }}>
                <li>Please arrive 10 minutes before your scheduled time</li>
                <li>Bring a valid ID for verification</li>
                <li>Dress appropriately for your ID photo</li>
              </ul>
            </div>

            <button
              className="btn btn-danger"
              style={{ width: '100%' }}
              onClick={handleCancelAppointment}
              disabled={loading}
            >
              {loading ? 'Cancelling...' : 'Cancel Appointment'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
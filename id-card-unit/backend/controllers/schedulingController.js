const pool = require('../config/database');
const crypto = require('crypto');
const XLSX = require('xlsx');
const nodemailer = require('nodemailer');

// Generate random 6-digit login code
const generateLoginCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Generate time slots for a date
const generateTimeSlotsForDate = (date, dailyEndTime, slotsPerDay) => {
  const slots = [];
  const startHour = 9; // Start at 9 AM
  const endHour = parseInt(dailyEndTime.split(':')[0]);
  
  const totalMinutes = (endHour - startHour) * 60;
  const intervalMinutes = Math.floor(totalMinutes / slotsPerDay);
  
  for (let i = 0; i < slotsPerDay; i++) {
    const minutes = startHour * 60 + (i * intervalMinutes);
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
  }
  
  return slots;
};

// Create scheduling configuration
const createSchedulingConfig = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      slotsPerPeriod,
      startDate,
      endDate,
      dailyEndTime,
      excludeWeekends
    } = req.body;

    // Validate
    if (!title || !type || !slotsPerPeriod || !startDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (slotsPerPeriod < 20 || slotsPerPeriod > 100) {
      return res.status(400).json({ message: 'Slots per period must be between 20 and 100' });
    }

    const result = await pool.query(
      `INSERT INTO scheduling_config 
       (title, description, type, slots_per_period, start_date, end_date, 
        daily_end_time, exclude_weekends, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        title,
        description,
        type,
        slotsPerPeriod,
        startDate,
        endDate || null,
        dailyEndTime || '14:00:00',
        excludeWeekends !== false,
        req.user.id
      ]
    );

    const config = result.rows[0];

    // Generate time slots
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + (type === 'weekly' ? 7 : 30) * 24 * 60 * 60 * 1000);
    
    const currentDate = new Date(start);
    const slotsPerDay = type === 'weekly' ? Math.ceil(slotsPerPeriod / 5) : Math.ceil(slotsPerPeriod / 20);
    
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      
      // Skip weekends if configured
      if (excludeWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) {
        currentDate.setDate(currentDate.getDate() + 1);
        continue;
      }

      const dateStr = currentDate.toISOString().split('T')[0];
      const timeSlots = generateTimeSlotsForDate(dateStr, dailyEndTime || '14:00:00', slotsPerDay);
      
      for (const time of timeSlots) {
        await pool.query(
          `INSERT INTO time_slots (config_id, slot_date, slot_time, capacity)
           VALUES ($1, $2, $3, 1)
           ON CONFLICT (config_id, slot_date, slot_time) DO NOTHING`,
          [config.id, dateStr, time]
        );
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'SCHEDULING_CREATED', `Created scheduling: ${title}`]
    );

    res.status(201).json({
      success: true,
      message: 'Scheduling configuration created successfully',
      config
    });
  } catch (error) {
    console.error('Error creating scheduling config:', error);
    res.status(500).json({ message: 'Error creating scheduling configuration' });
  }
};

// Get all configs
const getAllConfigs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.*, u.name as created_by_name,
        (SELECT COUNT(*) FROM scheduled_students WHERE config_id = sc.id) as total_students,
        (SELECT COUNT(*) FROM scheduled_students WHERE config_id = sc.id AND has_scheduled = true) as scheduled_count
      FROM scheduling_config sc
      LEFT JOIN users u ON sc.created_by = u.id
      ORDER BY sc.created_at DESC
    `);

    res.json({
      success: true,
      configs: result.rows
    });
  } catch (error) {
    console.error('Error fetching configs:', error);
    res.status(500).json({ message: 'Error fetching scheduling configurations' });
  }
};

// Get config by ID with details
const getConfigById = async (req, res) => {
  try {
    const { id } = req.params;

    const configResult = await pool.query(
      'SELECT * FROM scheduling_config WHERE id = $1',
      [id]
    );

    if (configResult.rows.length === 0) {
      return res.status(404).json({ message: 'Scheduling configuration not found' });
    }

    const studentsResult = await pool.query(
      'SELECT * FROM scheduled_students WHERE config_id = $1 ORDER BY created_at DESC',
      [id]
    );

    const slotsResult = await pool.query(
      'SELECT * FROM time_slots WHERE config_id = $1 ORDER BY slot_date, slot_time',
      [id]
    );

    res.json({
      success: true,
      config: configResult.rows[0],
      students: studentsResult.rows,
      slots: slotsResult.rows
    });
  } catch (error) {
    console.error('Error fetching config details:', error);
    res.status(500).json({ message: 'Error fetching configuration details' });
  }
};

// Update config
const updateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, dailyEndTime, endDate } = req.body;

    const result = await pool.query(
      `UPDATE scheduling_config 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           daily_end_time = COALESCE($3, daily_end_time),
           end_date = COALESCE($4, end_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [title, description, dailyEndTime, endDate, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    res.json({
      success: true,
      message: 'Configuration updated successfully',
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating config:', error);
    res.status(500).json({ message: 'Error updating configuration' });
  }
};

// Close/reopen scheduling
const closeReopenConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_closed } = req.body;

    const result = await pool.query(
      `UPDATE scheduling_config 
       SET is_closed = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [is_closed, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'SCHEDULING_TOGGLED', `${is_closed ? 'Closed' : 'Reopened'} scheduling ID: ${id}`]
    );

    res.json({
      success: true,
      message: `Scheduling ${is_closed ? 'closed' : 'reopened'} successfully`,
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Error toggling config:', error);
    res.status(500).json({ message: 'Error toggling scheduling status' });
  }
};

// Upload student list
const uploadStudentList = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Parse Excel file
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const students = XLSX.utils.sheet_to_json(worksheet);

    let imported = 0;
    let errors = [];

    for (const student of students) {
      try {
        const loginCode = generateLoginCode();
        
        await pool.query(
          `INSERT INTO scheduled_students 
           (config_id, jamb_number, pg_reg_number, full_name, email, phone, 
            faculty, department, level, login_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            id,
            student.jamb_number || student.JAMB || null,
            student.pg_reg_number || student.PG_REG || null,
            student.full_name || student.name || `${student.surname} ${student.other_names}`,
            student.email,
            student.phone || null,
            student.faculty || null,
            student.department || null,
            student.level || null,
            loginCode
          ]
        );
        imported++;
      } catch (err) {
        errors.push({ student: student.email, error: err.message });
      }
    }

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'STUDENTS_IMPORTED', `Imported ${imported} students for scheduling ID: ${id}`]
    );

    res.json({
      success: true,
      message: `Successfully imported ${imported} students`,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error uploading student list:', error);
    res.status(500).json({ message: 'Error uploading student list' });
  }
};

// Get scheduled students
const getScheduledStudents = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT ss.*, 
        a.appointment_date, a.appointment_time, a.status as appointment_status
      FROM scheduled_students ss
      LEFT JOIN appointments a ON ss.id = a.student_id
      WHERE ss.config_id = $1
      ORDER BY ss.has_scheduled DESC, ss.created_at DESC
    `, [id]);

    res.json({
      success: true,
      students: result.rows
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Error fetching students' });
  }
};

// Get time slots
const getTimeSlots = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT * FROM time_slots
      WHERE config_id = $1 AND is_available = true AND booked < capacity
      ORDER BY slot_date, slot_time
    `, [id]);

    res.json({
      success: true,
      slots: result.rows
    });
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Error fetching time slots' });
  }
};

// Send scheduling emails
const sendSchedulingEmails = async (req, res) => {
  try {
    const { id } = req.params;

    const config = await pool.query(
      'SELECT * FROM scheduling_config WHERE id = $1',
      [id]
    );

    if (config.rows.length === 0) {
      return res.status(404).json({ message: 'Configuration not found' });
    }

    const students = await pool.query(
      'SELECT * FROM scheduled_students WHERE config_id = $1 AND email_sent = false',
      [id]
    );

    let sent = 0;
    const schedulingUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/schedule/${id}`;

    for (const student of students.rows) {
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"ID Card Unit" <noreply@university.edu>',
          to: student.email,
          subject: `Schedule Your ID Card Capture - ${config.rows[0].title}`,
          html: `
            <h2>Hello ${student.full_name},</h2>
            <p>You have been invited to schedule your ID card capture appointment.</p>
            <h3>Your Login Credentials:</h3>
            <p><strong>Student ID:</strong> ${student.jamb_number || student.pg_reg_number}</p>
            <p><strong>Login Code:</strong> ${student.login_code}</p>
            <p><a href="${schedulingUrl}" style="background: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Schedule Appointment</a></p>
            <p>This scheduling closes on ${config.rows[0].end_date || 'TBD'}.</p>
            <p>Best regards,<br>ID Card Management Unit</p>
          `
        });

        await pool.query(
          'UPDATE scheduled_students SET email_sent = true WHERE id = $1',
          [student.id]
        );
        sent++;
      } catch (err) {
        console.error(`Failed to send email to ${student.email}:`, err.message);
      }
    }

    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'EMAILS_SENT', `Sent ${sent} scheduling emails for config ID: ${id}`]
    );

    res.json({
      success: true,
      message: `Successfully sent ${sent} emails`,
      sent
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    res.status(500).json({ message: 'Error sending scheduling emails' });
  }
};

// Delete scheduling configuration
const deleteConfig = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    // Check if config exists
    const configCheck = await client.query(
      'SELECT * FROM scheduling_config WHERE id = $1',
      [id]
    );

    if (configCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Scheduling configuration not found' });
    }

    const config = configCheck.rows[0];

    await client.query('BEGIN');

    // Get counts before deletion
    const studentCount = await client.query(
      'SELECT COUNT(*) FROM scheduled_students WHERE config_id = $1',
      [id]
    );
    
    const appointmentCount = await client.query(
      'SELECT COUNT(*) FROM appointments WHERE config_id = $1',
      [id]
    );

    // Delete will cascade to all related tables due to ON DELETE CASCADE
    // This includes: scheduled_students, appointments, time_slots
    await client.query(
      'DELETE FROM scheduling_config WHERE id = $1',
      [id]
    );

    await client.query('COMMIT');

    // Log the deletion
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [
        req.user.id, 
        'SCHEDULING_DELETED', 
        `Deleted scheduling: ${config.title} (${studentCount.rows[0].count} students, ${appointmentCount.rows[0].count} appointments)`
      ]
    );

    console.log(`Scheduling config ${id} deleted successfully`);

    res.json({
      success: true,
      message: 'Scheduling configuration and all related data deleted successfully',
      deleted: {
        config: config.title,
        students: parseInt(studentCount.rows[0].count),
        appointments: parseInt(appointmentCount.rows[0].count)
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting scheduling config:', error);
    res.status(500).json({ 
      message: 'Error deleting scheduling configuration',
      error: error.message 
    });
  } finally {
    client.release();
  }
};

// Export the new function
module.exports = {
  createSchedulingConfig,
  getAllConfigs,
  getConfigById,
  updateConfig,
  closeReopenConfig,
  uploadStudentList,
  getScheduledStudents,
  getTimeSlots,
  sendSchedulingEmails,
  deleteConfig
};
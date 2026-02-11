const pool = require('../config/database');

// Get all material requests
const getAllMaterialRequests = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        m.*,
        u1.username as requested_by_username,
        u1.name as requested_by_name,
        u2.username as responded_by_username,
        u2.name as responded_by_name
      FROM material_requests m
      LEFT JOIN users u1 ON m.requested_by = u1.id
      LEFT JOIN users u2 ON m.responded_by = u2.id
      ORDER BY m.created_at DESC
    `);

    res.json({
      success: true,
      requests: result.rows
    });
  } catch (error) {
    console.error('Error fetching material requests:', error);
    res.status(500).json({ message: 'Error fetching material requests' });
  }
};

// Create material request
const createMaterialRequest = async (req, res) => {
  try {
    const { itemName, quantity, urgency } = req.body;

    console.log('Received material request data:', { itemName, quantity, urgency }); // Debug log

    // Validation
    if (!itemName || !quantity) {
      return res.status(400).json({ message: 'Item name and quantity are required' });
    }

    const result = await pool.query(
      `INSERT INTO material_requests 
       (item_name, quantity, urgency, requested_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [itemName, parseInt(quantity), urgency || 'normal', req.user.id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'MATERIAL_REQUEST_CREATED', `Requested ${quantity} ${itemName}`]
    );

    res.status(201).json({
      success: true,
      message: 'Material request created successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating material request:', error);
    res.status(500).json({ 
      message: 'Error creating material request',
      error: error.message 
    });
  }
};

// Respond to material request
const respondToMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseMessage } = req.body;

    const result = await pool.query(
      `UPDATE material_requests 
       SET status = $1, response_message = $2, responded_by = $3, responded_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [status, responseMessage, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'MATERIAL_REQUEST_RESPONDED', `Responded to request ID: ${id} - ${status}`]
    );

    res.json({
      success: true,
      message: 'Response submitted successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error responding to material request:', error);
    res.status(500).json({ message: 'Error responding to material request' });
  }
};

// Forward material request to admin (Supervisor only)
const forwardMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { urgency, forwardNotes } = req.body;

    // Update urgency if provided
    const result = await pool.query(
      `UPDATE material_requests 
       SET urgency = $1, response_message = $2
       WHERE id = $3 
       RETURNING *`,
      [urgency, `Forwarded to admin: ${forwardNotes || 'Please review'}`, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'MATERIAL_REQUEST_FORWARDED', `Forwarded request ID: ${id} with urgency: ${urgency}`]
    );

    res.json({
      success: true,
      message: 'Request forwarded to admin successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error forwarding material request:', error);
    res.status(500).json({ message: 'Error forwarding material request' });
  }
};

// Address material request (Admin only)
const addressMaterialRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responseMessage, actionTaken } = req.body;

    const result = await pool.query(
      `UPDATE material_requests 
       SET status = $1, response_message = $2, responded_by = $3, responded_at = CURRENT_TIMESTAMP 
       WHERE id = $4 
       RETURNING *`,
      [status, `${responseMessage}\n\nAction Taken: ${actionTaken || 'N/A'}`, req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'MATERIAL_REQUEST_ADDRESSED', `Addressed request ID: ${id} - ${status}`]
    );

    res.json({
      success: true,
      message: 'Material request addressed successfully',
      request: result.rows[0]
    });
  } catch (error) {
    console.error('Error addressing material request:', error);
    res.status(500).json({ message: 'Error addressing material request' });
  }
};

// Update module.exports
module.exports = {
  getAllMaterialRequests,
  createMaterialRequest,
  respondToMaterialRequest,
  forwardMaterialRequest,  // Add this
  addressMaterialRequest   // Add this
};

const pool = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, staff_id, username, role, permissions, created_at, updated_at 
       FROM users 
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT id, name, staff_id, username, role, permissions, created_at, updated_at 
       FROM users 
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
};

// Update user permissions
const updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    // Check if user has permission (admin or supervisor)
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    // Get the target user
    const targetUser = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Only allow editing staff permissions
    if (targetUser.rows[0].role !== 'staff') {
      return res.status(403).json({ message: 'Can only edit staff permissions' });
    }

    const result = await pool.query(
      'UPDATE users SET permissions = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [permissions, id]
    );

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'USER_PERMISSIONS_UPDATED', `Updated permissions for user ID: ${id}`]
    );

    res.json({
      success: true,
      message: 'Permissions updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ message: 'Error updating permissions' });
  }
};

// Delete user (soft delete - only removes user account, not their activities)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user has permission (admin or supervisor)
    if (req.user.role !== 'admin' && req.user.role !== 'supervisor') {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    // Get the target user
    const targetUser = await pool.query('SELECT role, name FROM users WHERE id = $1', [id]);
    
    if (targetUser.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Supervisors can only delete staff
    if (req.user.role === 'supervisor' && targetUser.rows[0].role !== 'staff') {
      return res.status(403).json({ message: 'Supervisors can only delete staff accounts' });
    }

    // Admins cannot be deleted by anyone
    if (targetUser.rows[0].role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted' });
    }

    // Delete the user (CASCADE will handle related records based on foreign key settings)
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES ($1, $2, $3)',
      [req.user.id, 'USER_DELETED', `Deleted user: ${targetUser.rows[0].name} (ID: ${id})`]
    );

    res.json({
      success: true,
      message: 'User account deleted successfully. Their activities remain in the system.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      message: 'Error deleting user',
      error: error.message 
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserPermissions,
  deleteUser
};
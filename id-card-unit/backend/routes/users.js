const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUserPermissions,
  deleteUser
} = require('../controllers/usersController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// All authenticated users can view users
router.get('/', getAllUsers);
router.get('/:id', getUserById);

// Admin and Supervisor can update permissions
router.put('/:id/permissions', authorizeRole('admin', 'supervisor'), updateUserPermissions);

// Admin and Supervisor can delete users
router.delete('/:id', authorizeRole(['admin', 'supervisor']), deleteUser);

module.exports = router;
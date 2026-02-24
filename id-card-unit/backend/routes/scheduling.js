const express = require('express');
const router = express.Router();
const {
  createSchedulingConfig,
  getAllConfigs,
  getConfigById,
  updateConfig,
  closeReopenConfig,
  uploadStudentList,
  getScheduledStudents,
  getTimeSlots,
  sendSchedulingEmails
} = require('../controllers/schedulingController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication
router.use(authenticateToken);

// Create new scheduling config (supervisor/staff with permission)
router.post('/', authorizeRole(['admin', 'supervisor', 'staff']), createSchedulingConfig);

// Get all scheduling configs
router.get('/', getAllConfigs);

// Get specific config with details
router.get('/:id', getConfigById);

// Update config
router.put('/:id', authorizeRole(['admin', 'supervisor', 'staff']), updateConfig);

// Close/reopen scheduling
router.put('/:id/toggle', authorizeRole(['admin', 'supervisor', 'staff']), closeReopenConfig);

// Upload student list (Excel/CSV)
router.post('/:id/students', authorizeRole(['admin', 'supervisor', 'staff']), upload.single('file'), uploadStudentList);

// Get scheduled students for a config
router.get('/:id/students', getScheduledStudents);

// Get available time slots
router.get('/:id/slots', getTimeSlots);

// Send scheduling emails
router.post('/:id/send-emails', authorizeRole(['admin', 'supervisor', 'staff']), sendSchedulingEmails);

module.exports = router;
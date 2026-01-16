const express = require('express');
const {
    createMeetingRequest,
    getPendingRequestsForTeacher,
    getMyRequests,
    updateRequestStatus,
    cancelRequest
} = require('../controllers/MeetingRequestController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { authorizeRole } = require('../middleware/roleMiddleware');
const router = express.Router();

// All meeting routes require authentication
router.use(authenticateToken);

// Student: Create a request
router.post('/', authorizeRole('student'), createMeetingRequest);

// Student: Get my requests
router.get('/my-requests', authorizeRole('student'), getMyRequests);

// Student: Cancel a request
router.patch('/:requestId/cancel', authorizeRole('student'), cancelRequest);

// Teacher: Get pending requests
router.get('/pending', authorizeRole('teacher'), getPendingRequestsForTeacher);

// Teacher: Update request status (accept/reject)
router.patch('/:requestId/status', authorizeRole('teacher'), updateRequestStatus);

// Teacher: Get all meeting requests
router.get('/teacher/requests', authorizeRole('teacher'), getPendingRequestsForTeacher);

module.exports = router;
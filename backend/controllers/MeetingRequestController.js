const MeetingRequest = require('../models/MeetingRequest');
const User = require('../models/User');

// Student: Create a new meeting request
exports.createMeetingRequest = async (req, res) => {
    try {
        const { teacherId, requestedTime, message, relatedDomain } = req.body;
        const studentId = req.user.id;

        if (!teacherId || !requestedTime) {
            return res.status(400).json({ message: 'Teacher ID and requested time are required.' });
        }

        // Validate teacher exists
        const teacherExists = await User.findOne({ _id: teacherId, role: 'teacher' });
        if (!teacherExists) {
            return res.status(404).json({ message: 'Teacher not found.' });
        }

        const newRequest = new MeetingRequest({
            student: studentId,
            teacher: teacherId,
            requestedTime,
            message,
            relatedDomain: relatedDomain || null,
        });

        await newRequest.save();
        
        // TODO: Emit notification to teacher via WebSocket
        const io = req.io;
        const userSockets = req.userSockets;
        const teacherSocketId = userSockets[teacherId];
        if (teacherSocketId) {
            // Populate student info before emitting
            const populatedReq = await MeetingRequest.findById(newRequest._id).populate('student', 'name');
            io.to(teacherSocketId).emit('newMeetingRequest', populatedReq.toObject());
        }

        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error creating meeting request:", error);
        res.status(500).json({ message: 'Error creating meeting request', error: error.message });
    }
};

// Teacher: Get pending meeting requests
exports.getPendingRequestsForTeacher = async (req, res) => {
    try {
        const teacherId = req.user.id;
        const requests = await MeetingRequest.find({ teacher: teacherId, status: 'pending' })
                                            .populate('student', 'name email') // Populate student info
                                            .populate('relatedDomain', 'name')
                                            .sort({ createdAt: 1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching meeting requests:", error);
        res.status(500).json({ message: 'Error fetching meeting requests', error: error.message });
    }
};

// Student: Get their meeting requests
exports.getMyRequests = async (req, res) => {
     try {
        const studentId = req.user.id;
        const requests = await MeetingRequest.find({ student: studentId })
                                            .populate('teacher', 'name email') // Populate teacher info
                                            .populate('relatedDomain', 'name')
                                            .sort({ createdAt: -1 });
        res.status(200).json(requests);
    } catch (error) {
        console.error("Error fetching student meeting requests:", error);
        res.status(500).json({ message: 'Error fetching meeting requests', error: error.message });
    }
};

// Teacher: Update meeting request status (accept/reject)
exports.updateRequestStatus = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body; // Expect 'accepted' or 'rejected'
        const teacherId = req.user.id;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status update.' });
        }

        const request = await MeetingRequest.findOneAndUpdate(
            { _id: requestId, teacher: teacherId, status: 'pending' }, // Can only update pending requests owned by this teacher
            { status },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Pending meeting request not found or access denied.' });
        }

        // TODO: Emit notification to student via WebSocket
        const io = req.io;
        const userSockets = req.userSockets;
        const studentSocketId = userSockets[request.student.toString()]; // request.student is an ObjectId
         if (studentSocketId) {
             // Populate teacher info before emitting
             const populatedReq = await MeetingRequest.findById(request._id).populate('teacher', 'name');
             io.to(studentSocketId).emit('meetingRequestUpdate', populatedReq.toObject());
         }

        res.status(200).json(request);
    } catch (error) {
        console.error("Error updating meeting request status:", error);
        res.status(500).json({ message: 'Error updating meeting request status', error: error.message });
    }
};

// Student: Cancel a pending meeting request
exports.cancelRequest = async (req, res) => {
    try {
         const { requestId } = req.params;
         const studentId = req.user.id;

        const request = await MeetingRequest.findOneAndUpdate(
            { _id: requestId, student: studentId, status: 'pending' }, // Can only cancel own pending requests
            { status: 'cancelled' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: 'Pending meeting request not found.' });
        }
        
        // TODO: Optionally notify teacher of cancellation?

        res.status(200).json({ message: 'Meeting request cancelled.' });
    } catch (error) {
        console.error("Error cancelling meeting request:", error);
        res.status(500).json({ message: 'Error cancelling meeting request', error: error.message });
    }
}; 
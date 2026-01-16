import axios from 'axios';

/**
 * Service class for handling messaging functionality between users
 * Enhanced with meeting request integration
 */
class MessagingService {
    /**
     * Get all conversations for the current user
     * @returns {Promise<Array>} List of conversations
     */
    static async getConversations() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(
                'http://localhost:5000/api/messages/conversations',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error fetching conversations:', error);
            throw error;
        }
    }
    
    /**
     * Get messages for a specific conversation
     * @param {string} conversationId - ID of the conversation
     * @returns {Promise<Array>} List of messages in the conversation
     */
    static async getMessages(conversationId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(
                `http://localhost:5000/api/messages/conversations/${conversationId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching messages for conversation ${conversationId}:`, error);
            throw error;
        }
    }
    
    /**
     * Send a new message
     * @param {string} recipientId - ID of the message recipient
     * @param {string} content - Message content
     * @returns {Promise<Object>} The sent message
     */
    static async sendMessage(recipientId, content) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.post(
                'http://localhost:5000/api/messages',
                {
                    recipient: recipientId,
                    content
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }
    
    /**
     * Mark messages in a conversation as read
     * @param {string} conversationId - ID of the conversation
     * @returns {Promise<Object>} Result of the operation
     */
    static async markAsRead(conversationId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.patch(
                `http://localhost:5000/api/messages/conversations/${conversationId}/read`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error marking conversation ${conversationId} as read:`, error);
            throw error;
        }
    }
    
    /**
     * Get a list of available users to message based on user role
     * @returns {Promise<Array>} List of users available to message
     */
    static async getAvailableUsers() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const userRole = localStorage.getItem('userRole');
            
            // Students can message teachers, teachers can message students
            const endpoint = userRole === 'student' 
                ? 'http://localhost:5000/api/dashboard/student/teachers'
                : 'http://localhost:5000/api/dashboard/teacher/students';
            
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching available users to message:', error);
            throw error;
        }
    }
    
    /**
     * Create a new conversation with a user or get existing one
     * @param {string} userId - ID of the user to start conversation with
     * @returns {Promise<Object>} The conversation object
     */
    static async startOrGetConversation(userId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.post(
                'http://localhost:5000/api/messages/conversations',
                { participantId: userId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error starting conversation with user ${userId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get all meeting requests for the current user
     * @returns {Promise<Array>} List of meeting requests
     */
    static async getMeetingRequests() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const userRole = localStorage.getItem('userRole');
            const endpoint = userRole === 'teacher' 
                ? 'http://localhost:5000/api/meeting-requests/pending'
                : 'http://localhost:5000/api/meeting-requests/my-requests';
            
            const response = await axios.get(endpoint, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            return response.data;
        } catch (error) {
            console.error('Error fetching meeting requests:', error);
            throw error;
        }
    }
    
    /**
     * Create a meeting request
     * @param {Object} requestData - Meeting request data
     * @returns {Promise<Object>} The created meeting request
     */
    static async createMeetingRequest(requestData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.post(
                'http://localhost:5000/api/meeting-requests',
                requestData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error creating meeting request:', error);
            throw error;
        }
    }
    
    /**
     * Update a meeting request status
     * @param {string} requestId - ID of the meeting request
     * @param {string} status - New status (accepted, rejected)
     * @returns {Promise<Object>} The updated meeting request
     */
    static async updateMeetingRequestStatus(requestId, status) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.patch(
                `http://localhost:5000/api/meeting-requests/${requestId}/status`,
                { status },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error updating meeting request status:`, error);
            throw error;
        }
    }
    
    /**
     * Cancel a meeting request
     * @param {string} requestId - ID of the meeting request
     * @returns {Promise<Object>} The cancelled meeting request
     */
    static async cancelMeetingRequest(requestId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.patch(
                `http://localhost:5000/api/meeting-requests/${requestId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error cancelling meeting request:`, error);
            throw error;
        }
    }
    
    /**
     * Notify about a meeting request in a conversation
     * @param {string} conversationId - ID of the conversation
     * @param {string} meetingRequestId - ID of the meeting request
     * @returns {Promise<Object>} The sent notification message
     */
    static async sendMeetingRequestNotification(conversationId, meetingRequestId, meetingData) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            // Get the other participant in the conversation
            const conversation = await this.getConversationById(conversationId);
            if (!conversation) throw new Error('Conversation not found');
            
            const currentUserId = localStorage.getItem('userId');
            const recipient = conversation.participants.find(p => p._id !== currentUserId);
            
            if (!recipient) throw new Error('Recipient not found in conversation');
            
            // Format the meeting time for the message
            const meetingTime = new Date(meetingData.requestedTime).toLocaleString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
            
            // Create a system message about the meeting request
            const content = `📅 Meeting request created for ${meetingTime}. Check the Meetings tab for details.`;
            
            const response = await axios.post(
                'http://localhost:5000/api/messages',
                {
                    recipient: recipient._id,
                    content,
                    conversationId,
                    isSystemMessage: true,
                    metadata: {
                        type: 'meeting_request',
                        meetingRequestId
                    }
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error('Error sending meeting request notification:', error);
            throw error;
        }
    }
    
    /**
     * Get a conversation by ID
     * @param {string} conversationId - ID of the conversation
     * @returns {Promise<Object>} The conversation
     */
    static async getConversationById(conversationId) {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(
                `http://localhost:5000/api/messages/conversations/${conversationId}/info`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data;
        } catch (error) {
            console.error(`Error fetching conversation ${conversationId}:`, error);
            throw error;
        }
    }
    
    /**
     * Get unread message count
     * @returns {Promise<number>} Number of unread messages
     */
    static async getUnreadCount() {
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('Authentication required');
            
            const response = await axios.get(
                'http://localhost:5000/api/messages/unread/count',
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            
            return response.data.count;
        } catch (error) {
            console.error('Error fetching unread count:', error);
            return 0;
        }
    }
    
    /**
     * Create a meeting request from a conversation
     * @param {string} conversationId - ID of the conversation
     * @param {Object} meetingData - Meeting request data
     * @returns {Promise<Object>} Created meeting request with notification
     */
    static async createMeetingRequestFromConversation(conversationId, meetingData) {
        try {
            // First create the meeting request
            const meetingRequest = await this.createMeetingRequest(meetingData);
            
            // Then send a notification about it in the conversation
            await this.sendMeetingRequestNotification(
                conversationId, 
                meetingRequest._id,
                meetingData
            );
            
            return meetingRequest;
        } catch (error) {
            console.error('Error creating meeting from conversation:', error);
            throw error;
        }
    }
}

export default MessagingService;
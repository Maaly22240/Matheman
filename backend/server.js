const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import Server from socket.io
const UserRoute = require('./routes/UserRoute');

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app); // Create HTTP server from Express app

// Configure Socket.IO
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000", // Allow frontend origin
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true
})); // Enhanced CORS for all HTTP requests
app.use(express.json()); // Body parser

// Attach io instance to request object for use in controllers
app.use((req, res, next) => {
    req.io = io;
    req.userSockets = userSockets; // Make socket mapping available too
    console.log(`${req.method} ${req.path}`, req.body); // Add logging
    next();
});

// Routes
app.use('/api/users', UserRoute);
app.use('/api/tree', require('./routes/TreeRoute'));
app.use('/api/dashboard', require('./routes/DashboardRoute'));
app.use('/api/chapters', require('./routes/ChapterRoutes'));
app.use('/api/quizzes', require('./routes/QuizRoutes')); // Add the quiz routes
app.use('/api/messages', require('./routes/MessageRoute')); // Add message routes
app.use('/api/mnemonics', require('./routes/MnemonicRoute')); // Add mnemonic routes
app.use('/api/meetings', require('./routes/MeetingRequestRoute')); // Add meeting routes

// Socket.IO Connection Handling
const userSockets = {}; // Map userId to socketId

io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Store user socket mapping when they join
    socket.on('join', (userId) => {
        if (userId) {
            console.log(`User ${userId} joined with socket ${socket.id}`);
            userSockets[userId] = socket.id;
            socket.join(userId); // User joins a room identified by their userId
            // Optional: emit online status to others?
        }
    });

    // Handle sending messages
    socket.on('sendMessage', async (messageData) => {
        // messageData should contain { recipientId, content, senderId, conversationId, ...}
        // The message is usually saved via HTTP POST first, 
        // but we need to emit it to the recipient if they are online.
        const recipientSocketId = userSockets[messageData.recipientId];
        
        console.log(`Attempting to send message from ${messageData.sender?.name} to user ${messageData.recipientId}`);

        if (recipientSocketId) {
            console.log(`Recipient ${messageData.recipientId} is online. Emitting message to socket ${recipientSocketId}.`);
            // Emit to the specific recipient's room (their userId room)
            io.to(messageData.recipientId).emit('receiveMessage', messageData);
        } else {
            console.log(`Recipient ${messageData.recipientId} is offline.`);
            // Handle offline message storage/notification if needed (e.g., push notification)
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Remove user from mapping on disconnect
        for (const userId in userSockets) {
            if (userSockets[userId] === socket.id) {
                console.log(`User ${userId} disconnected.`);
                delete userSockets[userId];
                // Optional: emit offline status to others?
                break;
            }
        }
    });

    // Listen for potential meeting-related events if needed (though emission is handled in controller)
    // Example: socket.on('meetingAction', (data) => { ... });
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Backend is running!');
});

const PORT = process.env.PORT || 5000;

// Start the server using the http server instance
server.listen(PORT, () => {
    console.log(`Server (with Socket.IO) started on port ${PORT}`);
    console.log('Routes registered:', app._router.stack.filter(r => r.route).map(r => r.route.path));
}).on('error', (error) => {
    console.error('Error starting server:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Try a different port or close the application using this port.`);
    }
});

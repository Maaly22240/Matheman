const User = require('../models/User');
const Student = require('../models/Student');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register a new user
exports.register = async (req, res) => {
    const { name, email, password, role, birthday } = req.body;

    if (!name || !email || !password || !role || !birthday) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let newUser;

        if (role === 'student') {
            newUser = new Student({
                name,
                email,
                password: hashedPassword,
                role,
                birthday,
                studies: []
            });
        } else {
            newUser = new User({
                name,
                email,
                password: hashedPassword,
                role,
                birthday
            });
        }

        // Debug saving process
        console.log('Attempting to save user:', newUser);

        await newUser.save(); // Save user to the database
        console.log('User saved successfully:', newUser);

        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.status(201).json({ message: "User registered successfully", token });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ message: "Error registering user", error });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        let user = null;
        // Try to find user as Student first if exists
        if (await Student.exists({ email })) {
            user = await Student.findOne({ email });
        } else {
            user = await User.findOne({ email });
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                email: user.email,
                name: user.name,
                birthday: user.birthday 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                role: user.role,
                name: user.name,
                email: user.email,
                birthday: user.birthday
            }
        });
    } catch (error) {
        console.error("Error during login:", error.message);
        res.status(500).json({ message: "An error occurred during login" });
    }
};

// Get all users
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error });
    }
};

// Get all students (for teacher dashboard)
exports.getAllStudents = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Check if the user is a teacher
        const teacher = await User.findById(userId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(403).json({ message: 'Access denied. Only teachers can view student lists.' });
        }
        
        // Find all students
        const students = await User.find({ role: 'student' })
            .select('name email birthday progress lastActive');
            
        res.status(200).json(students);
    } catch (error) {
        console.error('Error fetching students:', error);
        res.status(500).json({ 
            message: 'Error fetching students', 
            error: error.message 
        });
    }
};

// Get user by ID
exports.getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findById(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: "Error fetching user", error });
    }
};

// Update a user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        const user = await User.findByIdAndUpdate(id, updates, { new: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        res.status(500).json({ message: "Error updating user", error });
    }
};

// Delete a user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting user", error });
    }
};

// Fetch user role by email
exports.getUserRole = async (req, res) => {
    const { email } = req.params;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ role: user.role });
    } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).json({ message: "Error fetching user role" });
    }
};

// Add new getProfile method
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware
        
        // Try to find as Student first, then as regular User
        let user = await Student.findById(userId)
            .select('-password')
            .populate('studies.chapter');
            
        if (!user) {
            user = await User.findById(userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Format the response
        const profile = {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            birthday: user.birthday,
            studies: user.studies || [],
            joinedDate: user._id.getTimestamp(),
            lastActive: new Date()
        };

        res.status(200).json(profile);
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ message: "Error fetching profile data" });
    }
};

// Add profile update method
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, currentPassword, newPassword } = req.body;

        let user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // If updating password, verify current password
        if (currentPassword && newPassword) {
            const isValidPassword = await bcrypt.compare(currentPassword, user.password);
            if (!isValidPassword) {
                return res.status(400).json({ message: "Current password is incorrect" });
            }
            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            user.password = hashedPassword;
        }

        // Update other fields
        if (name) user.name = name;
        if (email) {
            // Check if email is already in use by another user
            const existingUser = await User.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }

        await user.save();
        
        // Return updated profile without password
        const updatedUser = await User.findById(userId).select('-password');
        res.status(200).json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: "Error updating profile" });
    }
};


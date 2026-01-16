import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaEnvelope, FaSearch, FaUserGraduate, FaChartBar, FaEye } from 'react-icons/fa';
import '../TeacherDashboard.css';

const TeacherStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [composeMessage, setComposeMessage] = useState(false);
    const [messageData, setMessageData] = useState({
        subject: '',
        body: ''
    });

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // Attempt to fetch from API
            const response = await axios.get("http://localhost:5000/api/users/students", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setStudents(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching students:", error);
            // Use mock data if endpoint doesn't exist
            const mockStudents = [
                { 
                    _id: 's1',
                    name: 'John Smith', 
                    email: 'john@example.com',
                    birthday: '2010-05-12',
                    progress: {
                        completedChapters: 12,
                        totalChapters: 20,
                        avgScore: 78
                    }
                },
                { 
                    _id: 's2',
                    name: 'Emily Johnson', 
                    email: 'emily@example.com',
                    birthday: '2011-03-22',
                    progress: {
                        completedChapters: 18,
                        totalChapters: 20,
                        avgScore: 92
                    }
                },
                { 
                    _id: 's3',
                    name: 'Michael Brown', 
                    email: 'michael@example.com',
                    birthday: '2010-11-08',
                    progress: {
                        completedChapters: 8,
                        totalChapters: 20,
                        avgScore: 65
                    }
                },
                { 
                    _id: 's4',
                    name: 'Sarah Miller', 
                    email: 'sarah@example.com',
                    birthday: '2009-07-14',
                    progress: {
                        completedChapters: 15,
                        totalChapters: 20,
                        avgScore: 85
                    }
                }
            ];
            
            setStudents(mockStudents);
            setLoading(false);
        }
    };

    const handleMessageChange = (e) => {
        const { name, value } = e.target;
        setMessageData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSendMessage = async () => {
        if (!selectedStudent || !messageData.subject || !messageData.body.trim()) {
            alert("Please fill all message fields");
            return;
        }
        
        try {
            const token = localStorage.getItem("token");
            
            await axios.post("http://localhost:5000/api/messages", {
                recipientId: selectedStudent._id,
                subject: messageData.subject,
                body: messageData.body
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            alert(`Message sent to ${selectedStudent.name}`);
            
            // Reset form
            setMessageData({
                subject: '',
                body: ''
            });
            setComposeMessage(false);
            setSelectedStudent(null);
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message. Please try again.");
        }
    };

    const handleViewStudent = (student) => {
        setSelectedStudent(student);
        setComposeMessage(false);
    };

    const handleComposeMessage = (student) => {
        setSelectedStudent(student);
        setComposeMessage(true);
    };

    const getAge = (birthday) => {
        const birthDate = new Date(birthday);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    };

    const filteredStudents = students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="students-container">
                <header className="dashboard-header">
                    <h2>My Students</h2>
                    <p>Manage and communicate with your students</p>
                </header>
                <div className="loading-state">Loading students...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="students-container">
                <header className="dashboard-header">
                    <h2>My Students</h2>
                    <p>Manage and communicate with your students</p>
                </header>
                <div className="error-state">{error}</div>
            </div>
        );
    }

    // Student detail view
    if (selectedStudent) {
        if (composeMessage) {
            // Compose message form for the selected student
            return (
                <div className="students-container">
                    <header className="dashboard-header">
                        <button 
                            className="back-btn"
                            onClick={() => {
                                setSelectedStudent(null);
                                setComposeMessage(false);
                            }}
                        >
                            ← Back to Students
                        </button>
                        <h2>Message to {selectedStudent.name}</h2>
                    </header>
                    
                    <div className="compose-form">
                        <div className="form-group">
                            <label htmlFor="to">To:</label>
                            <input 
                                type="text" 
                                id="to" 
                                value={`${selectedStudent.name} <${selectedStudent.email}>`} 
                                disabled 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="subject">Subject:</label>
                            <input 
                                type="text"
                                id="subject"
                                name="subject"
                                value={messageData.subject}
                                onChange={handleMessageChange}
                                placeholder="Enter message subject"
                                required
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="body">Message:</label>
                            <textarea 
                                id="body"
                                name="body"
                                value={messageData.body}
                                onChange={handleMessageChange}
                                placeholder="Type your message here..."
                                rows={8}
                                required
                            />
                        </div>
                        
                        <div className="form-actions">
                            <button 
                                className="cancel-btn"
                                onClick={() => {
                                    setComposeMessage(false);
                                    setMessageData({
                                        subject: '',
                                        body: ''
                                    });
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className="send-btn"
                                onClick={handleSendMessage}
                            >
                                <FaEnvelope /> Send Message
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        // Student details view
        return (
            <div className="students-container">
                <header className="dashboard-header">
                    <button 
                        className="back-btn"
                        onClick={() => setSelectedStudent(null)}
                    >
                        ← Back to Students
                    </button>
                    <h2>Student Profile: {selectedStudent.name}</h2>
                </header>
                
                <div className="student-profile">
                    <div className="student-header">
                        <div className="student-avatar">
                            {selectedStudent.name[0]}
                        </div>
                        <div className="student-info">
                            <h3>{selectedStudent.name}</h3>
                            <p className="student-email">{selectedStudent.email}</p>
                            <p className="student-age">Age: {getAge(selectedStudent.birthday)}</p>
                        </div>
                        <button 
                            className="message-btn"
                            onClick={() => setComposeMessage(true)}
                        >
                            <FaEnvelope /> Send Message
                        </button>
                    </div>
                    
                    <div className="student-progress-summary">
                        <h3>Learning Progress</h3>
                        <div className="progress-stats">
                            <div className="progress-stat">
                                <div className="stat-label">Completion</div>
                                <div className="stat-value">
                                    {selectedStudent.progress?.completedChapters || 0}/
                                    {selectedStudent.progress?.totalChapters || 0}
                                </div>
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar" 
                                        style={{
                                            width: `${selectedStudent.progress ? 
                                                (selectedStudent.progress.completedChapters / 
                                                selectedStudent.progress.totalChapters) * 100 : 0}%`
                                        }}
                                    ></div>
                                </div>
                            </div>
                            
                            <div className="progress-stat">
                                <div className="stat-label">Average Score</div>
                                <div className="stat-value">
                                    {selectedStudent.progress?.avgScore || 0}%
                                </div>
                                <div className="progress-bar-container">
                                    <div 
                                        className="progress-bar" 
                                        style={{
                                            width: `${selectedStudent.progress?.avgScore || 0}%`,
                                            backgroundColor: 
                                                selectedStudent.progress?.avgScore >= 80 ? '#4caf50' :
                                                selectedStudent.progress?.avgScore >= 60 ? '#ff9800' : '#f44336'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="student-activity">
                        <h3>Recent Activity</h3>
                        <p className="no-data-message">No recent activity data available.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Students list view
    return (
        <div className="students-container">
            <header className="dashboard-header">
                <h2>My Students</h2>
                <p>Manage and communicate with your students</p>
                
                <div className="search-box">
                    <FaSearch className="search-icon" />
                    <input 
                        type="text" 
                        placeholder="Search students by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>
            
            {students.length === 0 ? (
                <div className="empty-state">
                    <p>No students assigned to you yet.</p>
                </div>
            ) : (
                <div className="students-list">
                    {filteredStudents.length === 0 ? (
                        <div className="empty-state">
                            <p>No students match your search.</p>
                        </div>
                    ) : (
                        filteredStudents.map(student => (
                            <div key={student._id} className="student-item">
                                <div className="student-card">
                                    <div className="student-card-header">
                                        <div className="student-avatar">
                                            {student.name[0]}
                                        </div>
                                        <div className="student-basic-info">
                                            <h3>{student.name}</h3>
                                            <p className="student-email">{student.email}</p>
                                            <p className="student-age">Age: {getAge(student.birthday)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="student-metrics">
                                        <div className="student-metric">
                                            <FaChartBar className="metric-icon" />
                                            <div className="metric-details">
                                                <span className="metric-value">
                                                    {student.progress?.avgScore || 0}%
                                                </span>
                                                <span className="metric-label">
                                                    Avg Score
                                                </span>
                                            </div>
                                        </div>
                                        <div className="student-metric">
                                            <FaUserGraduate className="metric-icon" />
                                            <div className="metric-details">
                                                <span className="metric-value">
                                                    {student.progress?.completedChapters || 0}/
                                                    {student.progress?.totalChapters || 0}
                                                </span>
                                                <span className="metric-label">
                                                    Progress
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="student-actions">
                                        <button 
                                            className="action-btn view-btn"
                                            onClick={() => handleViewStudent(student)}
                                        >
                                            <FaEye /> View Profile
                                        </button>
                                        <button 
                                            className="action-btn message-btn"
                                            onClick={() => handleComposeMessage(student)}
                                        >
                                            <FaEnvelope /> Message
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default TeacherStudents;
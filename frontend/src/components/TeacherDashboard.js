import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
    FaBook, FaUserGraduate, FaChartBar, FaEdit,
    FaPlus, FaTrash, FaEye, FaCheck, FaTimes,
    FaUsers, FaClipboardList, FaCog, FaBrain, FaUserCircle, FaPencilAlt, FaSearch, FaChartLine, FaBell, FaEnvelope
} from 'react-icons/fa';
import MnemonicForm from './TeacherDashboard/MnemonicForm';
import '../styles/TeacherDashboard.css';
import MessagesPage from '../pages/MessagesPage';

const TeacherDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [expandedDomains, setExpandedDomains] = useState({});
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [selectedDomain, setSelectedDomain] = useState(null);
    const [teacherInfo, setTeacherInfo] = useState(null);
    const [mnemonics, setMnemonics] = useState([]);
    const [loadingMnemonics, setLoadingMnemonics] = useState(false);
    const [showMnemonicForm, setShowMnemonicForm] = useState(false);
    const [editingMnemonic, setEditingMnemonic] = useState(null);
    const [mnemonicError, setMnemonicError] = useState(null);
    const [performanceData, setPerformanceData] = useState([]);
    const [performanceLoading, setPerformanceLoading] = useState(false);
    const [performanceError, setPerformanceError] = useState(null);
    const [studentSearch, setStudentSearch] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [showMessages, setShowMessages] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('Please login again');
                navigate('/login');
                return;
            }

            setLoading(true);
            try {
                const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/teacher', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (dashboardResponse.data && dashboardResponse.data.ageRanges) {
                    setDashboardData(dashboardResponse.data);
                    const firstDomain = dashboardResponse.data.ageRanges.find(range =>
                        range.domains && range.domains.length > 0)?.domains[0];
                    if (firstDomain?._id) {
                        setExpandedDomains({ [firstDomain._id]: true });
                    }
                } else {
                    console.warn('No age ranges or domains found in dashboard data.');
                    setDashboardData({ ageRanges: [] });
                }

                const profileResponse = await axios.get('http://localhost:5000/api/users/profile', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTeacherInfo(profileResponse.data);

                setError(null);
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    localStorage.clear();
                    setError('Your session has expired. Please login again.');
                    navigate('/login');
                } else {
                    setError('Error fetching teacher dashboard data. Please try again later.');
                }
                setDashboardData(null);
                setTeacherInfo(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [navigate]);

    useEffect(() => {
        if (activeTab === 'students') {
            if (selectedDomain) {
                fetchStudentsByDomain(selectedDomain);
            } else {
                fetchStudents();
            }
        }
    }, [activeTab, selectedDomain]);

    useEffect(() => {
        if (activeTab === 'mnemonics') {
            fetchMnemonics();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'performance') {
            fetchPerformanceData();
        }
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'notifications') {
            fetchNotifications();
        }
        if (activeTab === 'messages') {
            fetchUnreadMessages();
        }
    }, [activeTab]);

    const fetchStudents = async () => {
        try {
            setStudentsLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get('http://localhost:5000/api/users/students', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && Array.isArray(response.data)) {
                const studentsWithProgress = response.data.map(student => ({
                    ...student,
                    progress: Math.floor(Math.random() * 100)
                }));
                setStudents(studentsWithProgress);
            } else {
                setStudents([]);
            }
        } catch (error) {
            console.error('Error fetching all students:', error);
            setError('Failed to fetch student data.');
            setStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchStudentsByDomain = async (domainId) => {
        try {
            setStudentsLoading(true);
            setError(null);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const response = await axios.get(`http://localhost:5000/api/users/students/domain/${domainId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data && Array.isArray(response.data)) {
                const studentsWithProgress = response.data.map(student => ({
                    ...student,
                    progress: Math.floor(Math.random() * 100)
                }));
                setStudents(studentsWithProgress);
            } else {
                setStudents([]);
            }

        } catch (error) {
            console.error('Error fetching domain students:', error);
            setError('Failed to fetch students for this domain.');
            setStudents([]);
        } finally {
            setStudentsLoading(false);
        }
    };

    const fetchMnemonics = async () => {
        setLoadingMnemonics(true);
        setMnemonicError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get('http://localhost:5000/api/mnemonics', {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMnemonics(response.data || []);
        } catch (err) {
            console.error('Error fetching mnemonics:', err);
            setMnemonicError('Failed to load mnemonics.');
            setMnemonics([]);
        } finally {
            setLoadingMnemonics(false);
        }
    };

    const fetchPerformanceData = async () => {
        setPerformanceLoading(true);
        setPerformanceError(null);
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        try {
            const response = await axios.get('http://localhost:5000/api/dashboard/teacher/performance', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPerformanceData(response.data || []);
        } catch (err) {
            setPerformanceError('Failed to load performance data.');
            setPerformanceData([]);
        } finally {
            setPerformanceLoading(false);
        }
    };

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const response = await axios.get('http://localhost:5000/api/meetings/teacher/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotifications(response.data || []);
        } catch (err) {
            if (err.response && err.response.status === 404) {
                setNotifications([]);
            } else {
                setNotifications([]);
            }
        }
    };

    const fetchUnreadMessages = () => {
        const threads = JSON.parse(localStorage.getItem('messageThreads') || '{}');
        let count = 0;
        Object.values(threads).forEach(thread => {
            count += thread.messages.filter(m => !m.read && m.recipientRole === 'teacher').length;
        });
        setUnreadCount(count);
    };

    const toggleDomainExpand = (domainId) => {
        setExpandedDomains(prev => ({
            ...prev,
            [domainId]: !prev[domainId]
        }));
    };

    const handleCreateQuiz = (chapterId) => {
        navigate(`/quiz/create?chapterId=${chapterId}`);
    };

    const handleEditChapter = (chapterId) => {
        navigate(`/chapter/edit/${chapterId}`);
    };

    const handleViewStudents = (domainId) => {
        setSelectedDomain(domainId);
        setActiveTab('students');
    };

    const handleCreateNewMnemonic = () => {
        setEditingMnemonic(null);
        setShowMnemonicForm(true);
    };

    const handleEditMnemonic = (mnemonic) => {
        setEditingMnemonic(mnemonic);
        setShowMnemonicForm(true);
    };

    const handleCancelMnemonicForm = () => {
        setShowMnemonicForm(false);
        setEditingMnemonic(null);
        setMnemonicError(null);
    };

    const handleMnemonicSubmitSuccess = (savedMnemonic) => {
        if (editingMnemonic) {
            setMnemonics(prev => prev.map(m => m._id === savedMnemonic._id ? savedMnemonic : m));
        } else {
            setMnemonics(prev => [savedMnemonic, ...prev]);
        }
        setShowMnemonicForm(false);
        setEditingMnemonic(null);
        setMnemonicError(null);
    };

    const handleDeleteMnemonic = async (mnemonicId) => {
        if (!window.confirm("Are you sure you want to delete this mnemonic?")) return;

        setMnemonicError(null);
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        try {
            await axios.delete(`http://localhost:5000/api/mnemonics/${mnemonicId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setMnemonics(prev => prev.filter(m => m._id !== mnemonicId));
        } catch (err) {
            console.error('Error deleting mnemonic:', err);
            setMnemonicError('Failed to delete mnemonic.');
        }
    };

    const handleMeetingRequest = async (requestId, status) => {
        const token = localStorage.getItem('token');
        if (!token) return;
        await axios.put(`http://localhost:5000/api/meetings/teacher/requests/${requestId}`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchNotifications();
    };

    const renderOverview = () => (
        <div className="overview-section">
            {teacherInfo && (
                <div className="teacher-info-box">
                    <FaUserCircle className="teacher-avatar-icon" />
                    <div className="teacher-details">
                        <h2>Welcome, {teacherInfo.name}</h2>
                        <p>{teacherInfo.email}</p>
                        <p>Role: {teacherInfo.role}</p>
                        {teacherInfo.domains && teacherInfo.domains.length > 0 && (
                            <div className="assigned-domains">
                                <strong>Your Domains:</strong>
                                {teacherInfo.domains.map(domain => domain.name || domain).join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="stats-grid">
                <div className="stat-card">
                    <FaBook className="stat-icon" />
                    <h3>Total Chapters</h3>
                    <div className="stat-value">
                        {dashboardData?.ageRanges?.reduce((total, range) =>
                            total + range.domains.reduce((sum, domain) =>
                                sum + (domain.chapters?.length || 0), 0), 0) || 0}
                    </div>
                </div>
                <div className="stat-card">
                    <FaUserGraduate className="stat-icon" />
                    <h3>Active Students</h3>
                    <div className="stat-value">{students.length}</div>
                </div>
                <div className="stat-card">
                    <FaClipboardList className="stat-icon" />
                    <h3>Quizzes Created</h3>
                    <div className="stat-value">
                        {dashboardData?.ageRanges?.reduce((total, range) =>
                            total + range.domains.reduce((sum, domain) =>
                                sum + (domain.chapters?.reduce((quizSum, chapter) =>
                                    quizSum + (chapter.quizzes?.length || 0), 0) || 0), 0), 0) || 0}
                    </div>
                </div>
            </div>

            <div className="recent-activity">
                <h2>Recently Studied Chapters in Your Domains</h2>
                <div className="activity-list">
                    {performanceData
                        .filter(item => item.type === 'study')
                        .slice(0, 6)
                        .map((item, idx) => (
                        <div key={idx} className="activity-item">
                            <div className="activity-info">
                                <h4>{item.chapterName}</h4>
                                <p>By: {item.studentName}</p>
                                <span className="activity-date">{new Date(item.date).toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                    {performanceLoading && <div>Loading...</div>}
                    {!performanceLoading && performanceData.filter(item => item.type === 'study').length === 0 && (
                        <div>No recent study activity in your domains.</div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderPerformance = () => (
        <div className="performance-section">
            <div className="section-header">
                <h2><FaChartLine /> Latest Student Performance</h2>
            </div>
            {performanceError && <div className="error">{performanceError}</div>}
            {performanceLoading ? (
                <div className="loading-indicator">Loading performance data...</div>
            ) : (
                <div className="students-grid">
                    {performanceData.length > 0 ? performanceData.map((item, idx) => (
                        <div key={idx} className="student-card">
                            <div className="student-header">
                                <div className="student-avatar">{item.studentName[0].toUpperCase()}</div>
                                <div className="student-info">
                                    <h3>{item.studentName}</h3>
                                    <p>{item.studentEmail}</p>
                                    <p className="domain-tag">{item.domainName}</p>
                                </div>
                            </div>
                            <div className="student-progress">
                                {item.type === 'quiz' ? (
                                    <>
                                        <div>Quiz: <strong>{item.quizTitle}</strong></div>
                                        <div>Score: <strong>{item.score}%</strong> ({item.correct}/{item.total})</div>
                                        <div>Date: {new Date(item.date).toLocaleString()}</div>
                                    </>
                                ) : (
                                    <>
                                        <div>Studied: <strong>{item.chapterName}</strong></div>
                                        <div>Date: {new Date(item.date).toLocaleString()}</div>
                                    </>
                                )}
                            </div>
                        </div>
                    )) : (
                        <div className="no-data-message">No recent performance data found.</div>
                    )}
                </div>
            )}
        </div>
    );

    const renderMnemonics = () => (
        <div className="mnemonics-section">
            <div className="section-header">
                <h2>Mnemonics Management</h2>
                {!showMnemonicForm && (
                    <button
                        className="primary-btn"
                        onClick={handleCreateNewMnemonic}
                    >
                        <FaPlus /> Create New Mnemonic
                    </button>
                )}
            </div>

            {mnemonicError && <div className="error mnemonic-error">{mnemonicError}</div>}

            {showMnemonicForm ? (
                <MnemonicForm
                    initialData={editingMnemonic}
                    onSubmitSuccess={handleMnemonicSubmitSuccess}
                    onCancel={handleCancelMnemonicForm}
                />
            ) : (
                <div className="mnemonics-list">
                    {loadingMnemonics ? (
                        <div className="loading-indicator">Loading mnemonics...</div>
                    ) : mnemonics.length > 0 ? (
                        mnemonics.map(mnemonic => (
                            <div key={mnemonic._id} className="mnemonic-card">
                                <h3>{mnemonic.title}</h3>
                                <div
                                    className="mnemonic-content-preview ProseMirror"
                                    dangerouslySetInnerHTML={{ __html: mnemonic.content }}
                                />
                                <div className="mnemonic-meta">
                                    {mnemonic.relatedChapter && <span>Chapter: {mnemonic.relatedChapter.name}</span>}
                                    {mnemonic.relatedDomain && <span>Domain: {mnemonic.relatedDomain.name}</span>}
                                    {mnemonic.tags?.length > 0 && <span>Tags: {mnemonic.tags.join(', ')}</span>}
                                </div>
                                {mnemonic.assignedStudents && mnemonic.assignedStudents.length > 0 && (
                                    <div className="mnemonic-assigned">
                                        <strong>Assigned to:</strong> {mnemonic.assignedStudents.map(s => s.name).join(', ')}
                                    </div>
                                )}
                                <div className="mnemonic-actions">
                                    <button onClick={() => handleEditMnemonic(mnemonic)} title="Edit">
                                        <FaPencilAlt />
                                    </button>
                                    <button onClick={() => handleDeleteMnemonic(mnemonic._id)} className="delete-btn" title="Delete">
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-data-message">
                            <p>You haven't created any mnemonics yet.</p>
                            <button className="primary-btn inline-btn" onClick={handleCreateNewMnemonic}>Create one now</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const renderStudents = () => {
        const filteredStudents = students.filter(student =>
            student.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
            student.email.toLowerCase().includes(studentSearch.toLowerCase())
        );
        return (
            <div className="students-section">
                <div className="section-header">
                    <h2>Students in Your Domains</h2>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={studentSearch}
                            onChange={e => setStudentSearch(e.target.value)}
                            style={{ padding: '5px 10px', borderRadius: 4, border: '1px solid #ccc' }}
                        />
                    </div>
                </div>
                {error && !loading && <div className="error student-error">{error}</div>}
                {studentsLoading ? (
                    <div className="loading-indicator">Loading students...</div>
                ) : filteredStudents.length > 0 ? (
                    <div className="students-grid">
                        {filteredStudents.map(student => (
                            <div key={student._id} className="student-card">
                                <div className="student-header">
                                    <div className="student-avatar">
                                        {student.name[0].toUpperCase()}
                                    </div>
                                    <div className="student-info">
                                        <h3>{student.name}</h3>
                                        <p>{student.email}</p>
                                        {student.domain && <p className="domain-tag">{student.domain}</p>}
                                    </div>
                                </div>
                                <div className="student-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${student.progress || 0}%` }}
                                        />
                                    </div>
                                    <span>{student.progress || 0}% Complete</span>
                                </div>
                                <div className="student-actions">
                                    <button onClick={() => navigate(`/student/${student._id}`)}>
                                        <FaEye /> View Details
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-data-message">
                        <p>No students found.</p>
                    </div>
                )}
            </div>
        );
    };

    const renderNotifications = () => (
        <div className="notifications-section">
            <div className="section-header">
                <h2><FaBell /> Meeting Requests</h2>
            </div>
            {notifications.length === 0 ? (
                <div className="no-data-message">No meeting requests.</div>
            ) : (
                <div className="notifications-list">
                    {notifications.map(req => (
                        <div key={req._id} className="notification-card">
                            <div>
                                <strong>{req.student?.name || 'Student'}</strong> requested a meeting
                                {req.relatedDomain && <> for <b>{req.relatedDomain.name}</b></>}
                                <br />
                                <span>Requested time: {new Date(req.requestedTime).toLocaleString()}</span>
                                <br />
                                <span>Message: {req.message}</span>
                            </div>
                            <div className="notification-actions">
                                <button className="primary-btn" onClick={() => handleMeetingRequest(req._id, 'accepted')}>Accept</button>
                                <button className="secondary-btn" onClick={() => handleMeetingRequest(req._id, 'rejected')}>Reject</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderMessages = () => (
        <div style={{ height: '80vh', background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee', overflow: 'hidden' }}>
            <MessagesPage userRole="teacher" />
        </div>
    );

    if (loading) return <div className="loading">Loading dashboard data...</div>;
    if (error && !dashboardData) return <div className="error">{error}</div>;
    if (!dashboardData) return <div className="error">Could not load dashboard structure.</div>;

    return (
        <div className="teacher-dashboard">
            <div className="dashboard-header">
                <h1>Teacher Dashboard</h1>
            </div>

            <div className="dashboard-layout">
                <div className="sidebar">
                    <button
                        className={`sidebar-tab ${activeTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        <FaChartBar /> Overview
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'performance' ? 'active' : ''}`}
                        onClick={() => setActiveTab('performance')}
                    >
                        <FaChartLine /> Performance
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'mnemonics' ? 'active' : ''}`}
                        onClick={() => setActiveTab('mnemonics')}
                    >
                        <FaBrain /> Mnemonics
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'students' ? 'active' : ''}`}
                        onClick={() => {
                            setActiveTab('students');
                            setSelectedDomain(null);
                        }}
                    >
                        <FaUserGraduate /> Students
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'messages' ? 'active' : ''}`}
                        onClick={() => setActiveTab('messages')}
                    >
                        <FaEnvelope /> Messages
                        {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
                    </button>
                    <button
                        className={`sidebar-tab ${activeTab === 'notifications' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notifications')}
                    >
                        <FaBell /> Notifications
                        {notifications.length > 0 && <span className="unread-dot">{notifications.length}</span>}
                    </button>
                </div>

                <div className="main-content">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'performance' && renderPerformance()}
                    {activeTab === 'mnemonics' && renderMnemonics()}
                    {activeTab === 'students' && renderStudents()}
                    {activeTab === 'messages' && renderMessages()}
                    {activeTab === 'notifications' && renderNotifications()}
                </div>
            </div>
        </div>
    );
};

export default TeacherDashboard;

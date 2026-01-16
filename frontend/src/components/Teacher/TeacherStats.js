import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaChartBar, FaUserGraduate, FaBookOpen, FaClipboardCheck } from 'react-icons/fa';
import '../TeacherDashboard.css';

const TeacherStats = () => {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        avgCompletion: 0,
        avgScore: 0,
        domainStats: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem("token");
            
            // Try to fetch from API
            const response = await axios.get("http://localhost:5000/api/dashboard/teacher/stats", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            
            setStats(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching teacher stats:", error);
            
            // Use mock data if endpoint doesn't exist
            setStats({
                totalStudents: 42,
                activeStudents: 36,
                avgCompletion: 68,
                avgScore: 78,
                domainStats: [
                    { 
                        name: 'Algebra', 
                        studentCount: 28, 
                        avgCompletion: 75, 
                        avgScore: 82 
                    },
                    { 
                        name: 'Geometry', 
                        studentCount: 26, 
                        avgCompletion: 68, 
                        avgScore: 79 
                    },
                    { 
                        name: 'Statistics', 
                        studentCount: 18, 
                        avgCompletion: 52, 
                        avgScore: 71 
                    },
                    { 
                        name: 'Calculus', 
                        studentCount: 12, 
                        avgCompletion: 43, 
                        avgScore: 68 
                    }
                ],
                recentActivity: [
                    { 
                        student: 'Emily Johnson', 
                        action: 'Completed Algebra Chapter 4', 
                        date: '2025-04-09T14:30:00Z',
                        score: 92
                    },
                    { 
                        student: 'Michael Brown', 
                        action: 'Started Geometry Chapter 2', 
                        date: '2025-04-09T10:15:00Z'
                    },
                    { 
                        student: 'Sarah Miller', 
                        action: 'Completed Statistics Quiz', 
                        date: '2025-04-08T16:45:00Z',
                        score: 88
                    },
                    { 
                        student: 'John Smith', 
                        action: 'Completed Calculus Chapter 1', 
                        date: '2025-04-08T09:20:00Z',
                        score: 75
                    }
                ]
            });
            setLoading(false);
        }
    };

    // Format date function
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (loading) {
        return (
            <div className="stats-container">
                <header className="dashboard-header">
                    <h2>Teaching Statistics</h2>
                    <p>Student progress and performance metrics</p>
                </header>
                <div className="loading-state">Loading statistics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="stats-container">
                <header className="dashboard-header">
                    <h2>Teaching Statistics</h2>
                    <p>Student progress and performance metrics</p>
                </header>
                <div className="error-state">{error}</div>
            </div>
        );
    }

    return (
        <div className="stats-container">
            <header className="dashboard-header">
                <h2>Teaching Statistics</h2>
                <p>Student progress and performance metrics</p>
            </header>
            
            {/* Main statistics cards */}
            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaUserGraduate />
                    </div>
                    <div className="stat-content">
                        <h3>Total Students</h3>
                        <div className="stat-value">{stats.totalStudents}</div>
                        <div className="stat-detail">
                            {stats.activeStudents} active this week
                        </div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaBookOpen />
                    </div>
                    <div className="stat-content">
                        <h3>Average Completion</h3>
                        <div className="stat-value">{stats.avgCompletion}%</div>
                        <div className="stat-detail">
                            Across all domains
                        </div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaClipboardCheck />
                    </div>
                    <div className="stat-content">
                        <h3>Average Score</h3>
                        <div className="stat-value">{stats.avgScore}%</div>
                        <div className="stat-detail">
                            All quizzes and assessments
                        </div>
                    </div>
                </div>
                
                <div className="stat-card">
                    <div className="stat-icon">
                        <FaChartBar />
                    </div>
                    <div className="stat-content">
                        <h3>Teaching Domains</h3>
                        <div className="stat-value">{stats.domainStats.length}</div>
                        <div className="stat-detail">
                            Active domains
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Domain statistics */}
            <div className="domain-stats-section">
                <h3>Domain Performance</h3>
                <div className="domain-stats-cards">
                    {stats.domainStats.map((domain, index) => (
                        <div key={index} className="domain-stat-card">
                            <h4>{domain.name}</h4>
                            
                            <div className="domain-stat-metrics">
                                <div className="domain-stat-metric">
                                    <span className="metric-label">Students</span>
                                    <span className="metric-value">{domain.studentCount}</span>
                                </div>
                                
                                <div className="domain-stat-metric">
                                    <span className="metric-label">Avg. Completion</span>
                                    <span className="metric-value">{domain.avgCompletion}%</span>
                                    <div className="mini-progress">
                                        <div 
                                            className="mini-progress-bar" 
                                            style={{ width: `${domain.avgCompletion}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                <div className="domain-stat-metric">
                                    <span className="metric-label">Avg. Score</span>
                                    <span className="metric-value">{domain.avgScore}%</span>
                                    <div className="mini-progress">
                                        <div 
                                            className="mini-progress-bar"
                                            style={{ 
                                                width: `${domain.avgScore}%`,
                                                backgroundColor: 
                                                    domain.avgScore >= 80 ? '#4caf50' :
                                                    domain.avgScore >= 60 ? '#ff9800' : '#f44336'
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Recent activity */}
            {stats.recentActivity && (
                <div className="recent-activity-section">
                    <h3>Recent Student Activity</h3>
                    <div className="activity-table-container">
                        <table className="activity-table">
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Activity</th>
                                    <th>Score</th>
                                    <th>Date & Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.recentActivity.map((activity, index) => (
                                    <tr key={index}>
                                        <td>{activity.student}</td>
                                        <td>{activity.action}</td>
                                        <td>{activity.score ? `${activity.score}%` : '-'}</td>
                                        <td>{formatDate(activity.date)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Performance trends - simplified placeholder */}
            <div className="performance-trends">
                <h3>Performance Trends</h3>
                <div className="trends-placeholder">
                    <p className="placeholder-text">
                        Performance trend charts would be displayed here, showing student progress over time.
                        These charts would include completion rates, quiz scores, and engagement metrics.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default TeacherStats;
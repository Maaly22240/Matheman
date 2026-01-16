import React, { useState } from 'react';
import { 
  FaGraduationCap, 
  FaChartLine, 
  FaUserGraduate, 
  FaCalendarAlt, 
  FaBell, 
  FaEnvelope,
  FaCheckCircle,
  FaExclamationTriangle 
} from 'react-icons/fa';

const TeacherOverview = ({ teacherData, stats = {}, students = [], unreadMessages = 0, unreadNotifications = 0 }) => {
  const [timeframe, setTimeframe] = useState('week');

  // Calculate statistics based on the selected timeframe
  const getTimeframeStats = () => {
    // This function would filter actual data based on timeframe
    // For now, we'll just prepare a standardized stats object with our available data
    return {
      activeStudents: stats.activeStudents || 0,
      newStudents: 2, // Mock data
      completedQuizzes: 15, // Mock data 
      quizCompletion: '78%', // Mock data
      averageScore: `${stats.averageScore || 0}%`,
      scoreChange: 5, // Mock data
      engagement: '83%', // Mock data
      engagementChange: 3, // Mock data
      // Mock at-risk students data
      atRiskStudents: students
        .filter(student => (student.progress?.avgScore || 0) < 70)
        .slice(0, 3)
        .map(student => ({
          id: student._id,
          name: student.name,
          grade: student.progress?.avgScore || 65,
          lastActive: student.lastActivity || new Date().toISOString(),
          riskFactor: 100 - (student.progress?.avgScore || 65)
        }))
    };
  };

  const currentStats = getTimeframeStats();

  // Create sample recent activity from available data
  const sampleActivity = [
    {
      type: 'quiz',
      description: 'Emily completed Algebra Quiz with 92% score',
      time: '2 hours ago' 
    },
    {
      type: 'login',
      description: 'Michael logged in for the first time this week',
      time: '6 hours ago'
    },
    { 
      type: 'message',
      description: 'You received a new message from John Smith',
      time: 'Yesterday' 
    }
  ];

  // Create sample alerts
  const sampleAlerts = [
    {
      title: 'Quiz Results Ready',
      message: '5 new quiz results are available for review',
      createdAt: new Date().toISOString()
    },
    {
      title: 'System Update',
      message: 'The platform will undergo maintenance this weekend',
      createdAt: new Date().toISOString()
    }
  ];

  return (
    <div className="teacher-overview">
      <header className="overview-header">
        <h1>Teacher Dashboard</h1>
        <p>Welcome back{teacherData?.name ? `, ${teacherData.name}` : ''}! Here's an overview of your classroom activity</p>

        <div className="timeframe-selector">
          <button 
            className={`timeframe-btn ${timeframe === 'day' ? 'active' : ''}`} 
            onClick={() => setTimeframe('day')}
          >
            Today
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'week' ? 'active' : ''}`} 
            onClick={() => setTimeframe('week')}
          >
            This Week
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'month' ? 'active' : ''}`} 
            onClick={() => setTimeframe('month')}
          >
            This Month
          </button>
          <button 
            className={`timeframe-btn ${timeframe === 'all' ? 'active' : ''}`} 
            onClick={() => setTimeframe('all')}
          >
            All Time
          </button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaUserGraduate />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Active Students</h3>
            <p className="stat-value">{currentStats.activeStudents || 0}</p>
            <p className="stat-change positive">
              +{currentStats.newStudents || 0} new this {timeframe}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaGraduationCap />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Quizzes Completed</h3>
            <p className="stat-value">{currentStats.completedQuizzes || 0}</p>
            <p className="stat-change neutral">
              {currentStats.quizCompletion || '0%'} completion rate
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Average Score</h3>
            <p className="stat-value">{currentStats.averageScore || '0%'}</p>
            <p className={`stat-change ${(currentStats.scoreChange || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(currentStats.scoreChange || 0) >= 0 ? '+' : ''}{currentStats.scoreChange || 0}% from previous {timeframe}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3 className="stat-title">Engagement</h3>
            <p className="stat-value">{currentStats.engagement || '0%'}</p>
            <p className={`stat-change ${(currentStats.engagementChange || 0) >= 0 ? 'positive' : 'negative'}`}>
              {(currentStats.engagementChange || 0) >= 0 ? '+' : ''}{currentStats.engagementChange || 0}% from previous {timeframe}
            </p>
          </div>
        </div>
      </div>

      <div className="overview-content">
        <div className="content-section">
          <div className="section-header">
            <h2><FaUserGraduate /> At-Risk Students</h2>
            <a href="#" className="view-all">View All</a>
          </div>
          <div className="student-risk-table">
            {currentStats.atRiskStudents && currentStats.atRiskStudents.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Current Grade</th>
                    <th>Last Activity</th>
                    <th>Risk Factor</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStats.atRiskStudents.map(student => (
                    <tr key={student.id}>
                      <td className="student-info">
                        <div className="student-avatar">
                          {student.name.charAt(0)}
                        </div>
                        <span>{student.name}</span>
                      </td>
                      <td className={`grade ${student.grade < 70 ? 'low-grade' : ''}`}>
                        {student.grade}%
                      </td>
                      <td>
                        {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'N/A'}
                      </td>
                      <td>
                        <div className="risk-indicator">
                          <div 
                            className="risk-bar" 
                            style={{
                              width: `${Math.min(student.riskFactor, 100)}%`,
                              backgroundColor: student.riskFactor > 75 ? '#f44336' : 
                                              student.riskFactor > 50 ? '#ff9800' : 
                                              '#4caf50'
                            }}
                          ></div>
                        </div>
                        <span className="risk-label">
                          {student.riskFactor > 75 ? 'High' : student.riskFactor > 50 ? 'Medium' : 'Low'}
                        </span>
                      </td>
                      <td>
                        <button className="action-button">Contact</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="empty-state">
                <FaCheckCircle className="success-icon" />
                <p>No students are at risk currently. Great job!</p>
              </div>
            )}
          </div>
        </div>

        <div className="secondary-sections">
          <div className="content-section recent-activity">
            <div className="section-header">
              <h2><FaCalendarAlt /> Recent Activity</h2>
              <a href="#" className="view-all">View All</a>
            </div>
            <div className="activity-list">
              {sampleActivity && sampleActivity.length > 0 ? (
                sampleActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {(() => {
                        switch(activity.type) {
                          case 'quiz': return <FaGraduationCap />;
                          case 'login': return <FaUserGraduate />;
                          case 'message': return <FaEnvelope />;
                          case 'notification': return <FaBell />;
                          default: return <FaCalendarAlt />;
                        }
                      })()}
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">{activity.description}</p>
                      <p className="activity-time">{activity.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>No recent activity to display</p>
                </div>
              )}
            </div>
          </div>

          <div className="content-section alerts-section">
            <div className="section-header">
              <h2><FaExclamationTriangle /> System Alerts</h2>
              <a href="#" className="view-all">View All</a>
            </div>
            <div className="alerts-list">
              {sampleAlerts && sampleAlerts.length > 0 ? (
                sampleAlerts.map((alert, index) => (
                  <div key={index} className="alert-item">
                    <div className="alert-content">
                      <h4>{alert.title}</h4>
                      <p>{alert.message}</p>
                    </div>
                    <p className="alert-time">{new Date(alert.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <FaCheckCircle className="success-icon" />
                  <p>No system alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="quick-action">
            <FaEnvelope /> Send Message
          </button>
          <button className="quick-action">
            <FaUserGraduate /> Add Student
          </button>
          <button className="quick-action">
            <FaGraduationCap /> Create Quiz
          </button>
          <button className="quick-action">
            <FaChartLine /> View Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeacherOverview;
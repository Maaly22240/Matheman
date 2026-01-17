import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import '../styles/ModernTheme.css';
import '../components/StudentDashboard_Modern.css';
import { FaBook, FaChartLine, FaTrophy, FaClock, FaArrowRight, FaFire } from 'react-icons/fa';

const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [stats, setStats] = useState({
    lessonsCompleted: 0,
    averageScore: 0,
    streak: 0,
    masteryLevel: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      setUser(user);

      // Fetch chapters
      const chaptersResponse = await axios.get('http://localhost:5000/api/chapters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChapters(chaptersResponse.data);

      // Fetch stats
      const statsResponse = await axios.get('http://localhost:5000/api/student/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(statsResponse.data);

      // Fetch recent activity
      const activityResponse = await axios.get('http://localhost:5000/api/student/activity', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRecentActivity(activityResponse.data);

      setError(null);
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>Welcome back, {user?.name}! 👋</h1>
          <p>Track your progress and continue learning</p>
        </div>
        <Link to="/profile" className="btn btn-outline">
          View Profile
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaBook />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.lessonsCompleted}</div>
            <div className="stat-label">Lessons Completed</div>
            <div className="stat-change">+3 this week</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageScore}%</div>
            <div className="stat-label">Average Score</div>
            <div className="stat-change">↑ 5% from last month</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaFire />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">Day Streak</div>
            <div className="stat-change">Keep it up!</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaTrophy />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.masteryLevel}%</div>
            <div className="stat-label">Mastery Level</div>
            <div className="stat-change">Overall progress</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Chapters Section */}
        <div className="chapters-section">
          <div className="section-header">
            <h2>Continue Learning</h2>
            <Link to="/chapters" className="view-all">
              View All <FaArrowRight />
            </Link>
          </div>

          {chapters.length === 0 ? (
            <div className="empty-state">
              <p>No chapters available yet</p>
            </div>
          ) : (
            <div className="chapters-grid">
              {chapters.slice(0, 6).map((chapter) => (
                <Link
                  key={chapter._id}
                  to={`/chapter/${chapter._id}`}
                  className="chapter-card"
                >
                  <div className="chapter-header">
                    <h3>{chapter.title}</h3>
                    <span className="chapter-progress">
                      {chapter.progress || 0}%
                    </span>
                  </div>
                  <p className="chapter-description">{chapter.description}</p>
                  <div className="chapter-footer">
                    <span className="lesson-count">
                      {chapter.lessons?.length || 0} lessons
                    </span>
                    <FaArrowRight className="arrow-icon" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Section */}
        <div className="activity-section">
          <div className="section-header">
            <h2>Recent Activity</h2>
            <Link to="/activity" className="view-all">
              View All <FaArrowRight />
            </Link>
          </div>

          {recentActivity.length === 0 ? (
            <div className="empty-state">
              <p>No recent activity</p>
            </div>
          ) : (
            <div className="activity-list">
              {recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'quiz' ? <FaChartLine /> : <FaBook />}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                  </div>
                  <div className="activity-time">
                    <FaClock className="clock-icon" />
                    <span>{activity.timeAgo}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <Link to="/chapters" className="action-card">
            <FaBook className="action-icon" />
            <span>Browse Chapters</span>
          </Link>
          <Link to="/quizzes" className="action-card">
            <FaChartLine className="action-icon" />
            <span>Take a Quiz</span>
          </Link>
          <Link to="/recommendations" className="action-card">
            <FaTrophy className="action-icon" />
            <span>Get Recommendations</span>
          </Link>
          <Link to="/profile" className="action-card">
            <FaClock className="action-icon" />
            <span>View Progress</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;

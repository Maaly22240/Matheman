import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../styles/EnhancedQuizDashboard.css';
import { FaClock, FaCheckCircle, FaExclamationTriangle, FaChartLine, FaLightbulb } from 'react-icons/fa';

/**
 * Enhanced Quiz Dashboard Component
 * Displays retention curves, quiz recommendations, and learning statistics
 * Integrates with the RetentionAlgorithm backend service
 */

const EnhancedQuizDashboard = ({ studentId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [retentionCurves, setRetentionCurves] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchRecommendations();
  }, [studentId]);

  useEffect(() => {
    if (selectedQuiz) {
      fetchRetentionCurve(selectedQuiz);
    }
  }, [selectedQuiz]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        'http://localhost:5000/api/quizzes/recommendations',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setRecommendations(response.data.recommendations);
      setStats({
        totalAvailable: response.data.totalAvailable,
        dueCount: response.data.dueCount
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Failed to load quiz recommendations');
    } finally {
      setLoading(false);
    }
  };

  const fetchRetentionCurve = async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.get(
        `http://localhost:5000/api/quizzes/${quizId}/retention-curve`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setRetentionCurves(prev => ({
        ...prev,
        [quizId]: response.data
      }));
    } catch (err) {
      console.error('Error fetching retention curve:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#ff6b6b';
      case 'medium':
        return '#ffd93d';
      case 'low':
        return '#6bcf7f';
      default:
        return '#999';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <FaExclamationTriangle />;
      case 'medium':
        return <FaClock />;
      case 'low':
        return <FaCheckCircle />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div className="quiz-dashboard-loading">Loading recommendations...</div>;
  }

  if (error) {
    return <div className="quiz-dashboard-error">{error}</div>;
  }

  const curveData = selectedQuiz && retentionCurves[selectedQuiz] 
    ? retentionCurves[selectedQuiz].curve 
    : [];

  return (
    <div className="enhanced-quiz-dashboard">
      <div className="dashboard-header">
        <h2>
          <FaChartLine /> Intelligent Quiz Scheduler
        </h2>
        <p>Based on your retention curves and learning patterns</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-container">
        <div className="stat-card">
          <div className="stat-icon high">
            <FaExclamationTriangle />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.dueCount}</div>
            <div className="stat-label">Due Now</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalAvailable}</div>
            <div className="stat-label">Total Available</div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recommendations List */}
        <div className="recommendations-section">
          <h3>
            <FaLightbulb /> Recommended Quizzes
          </h3>
          <div className="recommendations-list">
            {recommendations.length === 0 ? (
              <p className="no-recommendations">No quizzes available. Great job staying on top of your studies!</p>
            ) : (
              recommendations.map((quiz) => (
                <div 
                  key={quiz._id}
                  className={`recommendation-card ${quiz.isDue ? 'due' : ''} ${selectedQuiz === quiz._id ? 'selected' : ''}`}
                  onClick={() => setSelectedQuiz(quiz._id)}
                >
                  <div className="card-header">
                    <div className="priority-badge" style={{ color: getPriorityColor(quiz.priority) }}>
                      {getPriorityIcon(quiz.priority)}
                      <span>{quiz.priority.toUpperCase()}</span>
                    </div>
                    <div className="card-title">{quiz.title}</div>
                  </div>
                  
                  <div className="card-body">
                    <p className="card-description">{quiz.description}</p>
                    <div className="card-details">
                      <div className="detail">
                        <span className="label">Reason:</span>
                        <span className="value">{quiz.reason}</span>
                      </div>
                      {quiz.retention !== undefined && (
                        <div className="detail">
                          <span className="label">Current Retention:</span>
                          <span className="value">{Math.round(quiz.retention)}%</span>
                        </div>
                      )}
                      {quiz.daysUntilDue !== undefined && (
                        <div className="detail">
                          <span className="label">Days Until Due:</span>
                          <span className="value">{Math.round(quiz.daysUntilDue)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card-footer">
                    <button className="start-quiz-btn">Start Quiz</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Retention Curve Visualization */}
        {selectedQuiz && curveData.length > 0 && (
          <div className="retention-curve-section">
            <h3>
              <FaChartLine /> Retention Curve
            </h3>
            <div className="curve-info">
              <p>This curve shows how your knowledge retention decreases over time based on the exponential decay model.</p>
              <p className="formula">Formula: Retention = e^(-t / S), where S = {retentionCurves[selectedQuiz]?.S?.toFixed(2)} days</p>
            </div>
            
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="day" 
                  label={{ value: 'Days', position: 'insideBottomRight', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Retention %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => `${value}%`}
                  contentStyle={{ backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}
                />
                <Legend />
                
                {/* Retention curve */}
                <Line 
                  type="monotone" 
                  dataKey="retention" 
                  stroke="#00d4d4" 
                  strokeWidth={2}
                  dot={false}
                  name="Retention"
                  isAnimationActive={true}
                />
                
                {/* Review threshold line */}
                <Line 
                  type="monotone" 
                  dataKey={() => 40}
                  stroke="#ff6b6b"
                  strokeWidth={1}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Review Threshold (40%)"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="curve-explanation">
              <h4>Understanding Your Retention Curve</h4>
              <ul>
                <li><strong>Blue Line:</strong> Your knowledge retention over time. It decreases exponentially unless you review.</li>
                <li><strong>Red Dashed Line:</strong> The 40% threshold. When retention drops below this, a review is recommended.</li>
                <li><strong>S Value:</strong> Your learning strength. Higher S means slower forgetting (better retention).</li>
              </ul>
              <p className="next-review">
                Next review recommended: {retentionCurves[selectedQuiz]?.nextReviewDate 
                  ? new Date(retentionCurves[selectedQuiz].nextReviewDate).toLocaleDateString() 
                  : 'Soon'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Algorithm Explanation */}
      <div className="algorithm-info">
        <h3>How the Spaced Repetition Algorithm Works</h3>
        <div className="info-content">
          <div className="info-box">
            <h4>The Formula</h4>
            <p>Retention = e^(-t / S)</p>
            <ul>
              <li><strong>t:</strong> Time elapsed since last review (in days)</li>
              <li><strong>S:</strong> Your learning strength (calculated from your performance)</li>
              <li><strong>Retention:</strong> Percentage of knowledge you've retained</li>
            </ul>
          </div>
          
          <div className="info-box">
            <h4>Learning Strength (S)</h4>
            <p>S is calculated from your quiz performance and determines how quickly you forget:</p>
            <ul>
              <li><strong>High S (e.g., 15 days):</strong> You retain knowledge longer - fewer reviews needed</li>
              <li><strong>Low S (e.g., 3 days):</strong> You forget faster - more frequent reviews needed</li>
              <li>S is updated after each quiz based on your score</li>
            </ul>
          </div>

          <div className="info-box">
            <h4>Review Scheduling</h4>
            <p>Quizzes are recommended when:</p>
            <ul>
              <li>Your retention drops below 40%</li>
              <li>You score below 70% on a quiz</li>
              <li>A quiz is overdue for review</li>
              <li>You haven't attempted a quiz yet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedQuizDashboard;

import React from 'react';
import './StudentStats.css';
import { FaTrophy, FaChartLine, FaRegClock, FaCheckCircle } from 'react-icons/fa';

const StudentStats = ({ stats, studies, quizAttempts, summary = false }) => {
    const formatDate = (date) => new Date(date).toLocaleDateString();

    // Key stats to show in summary
    const keyStats = [
        { label: 'Study Sessions', value: stats.totalSessions, icon: FaRegClock },
        { label: 'Unique Chapters', value: stats.uniqueChapters, icon: FaCheckCircle },
        { label: 'Quiz Average', value: stats.quizAvgScore ? `${stats.quizAvgScore}%` : 'N/A', icon: FaTrophy },
    ];

    return (
        <div className={`stats-container ${summary ? 'summary-mode' : ''}`}>
            <div className="stats-grid">
                {summary ? (
                    keyStats.map((stat, index) => (
                        <div key={index} className="stat-card summary-card">
                            <stat.icon className="summary-icon" />
                            <div className="summary-value">{stat.value}</div>
                            <div className="summary-label">{stat.label}</div>
                        </div>
                    ))
                ) : (
                    // Full stats display
                    <>
                        <div className="stat-card">
                            <h3>Study Sessions</h3>
                            <div className="stat-value">{stats.totalSessions}</div>
                            <div className="stat-detail">Total sessions</div>
                        </div>
                        <div className="stat-card">
                            <h3>Unique Chapters</h3>
                            <div className="stat-value">{stats.uniqueChapters}</div>
                            <div className="stat-detail">Different topics covered</div>
                        </div>
                        <div className="stat-card">
                            <h3>Active Streak</h3>
                            <div className="stat-value">{stats.activeStreak} days</div>
                            <div className="stat-detail">Keep it up!</div>
                        </div>
                        <div className="stat-card">
                            <h3>Monthly Activity</h3>
                            <div className="stat-value">{stats.studyHoursThisMonth}</div>
                            <div className="stat-detail">Sessions this month</div>
                        </div>
                        
                        <div className="stat-card">
                            <h3>Quiz Performance</h3>
                            <div className="stat-value">
                                {stats.quizAvgScore ? `${stats.quizAvgScore}%` : 'No data'}
                            </div>
                            <div className="stat-detail">Average score</div>
                        </div>
                        <div className="stat-card">
                            <h3>Quizzes Taken</h3>
                            <div className="stat-value">{stats.quizAttempts || 0}</div>
                            <div className="stat-detail">Total attempts</div>
                        </div>
                    </>
                )}
            </div>

            {!summary && (
                // Only show recent activity and charts in full mode
                <>
                    <div className="recent-activity">
                        <h3>Recent Activity</h3>
                        <div className="activity-list">
                            {studies?.slice(-3).reverse().map((study, index) => (
                                <div key={`study-${index}`} className="activity-item">
                                    <span className="activity-chapter">{study.chapter.name}</span>
                                    <span className="activity-date">{formatDate(study.session_start)}</span>
                                </div>
                            ))}
                            
                            {quizAttempts?.slice(-2).reverse().map((attempt, index) => (
                                <div key={`quiz-${index}`} className="activity-item quiz-activity">
                                    <span className="activity-quiz">
                                        <FaTrophy className={attempt.score >= 70 ? "high-score" : "normal-score"} /> 
                                        Quiz: {attempt.quiz.title || "Practice Quiz"}
                                    </span>
                                    <span className="activity-score">{attempt.score}% ({attempt.correct}/{attempt.total})</span>
                                    <span className="activity-date">{formatDate(attempt.date)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    {quizAttempts?.length > 0 && (
                        <div className="quiz-performance-chart">
                            <h3><FaChartLine /> Quiz Performance Trend</h3>
                            <div className="quiz-chart">
                                <div className="score-bars">
                                    {quizAttempts.slice(-5).map((attempt, index) => (
                                        <div 
                                            key={index} 
                                            className="score-bar"
                                            style={{ height: `${attempt.score}%` }}
                                            title={`${attempt.quiz.title}: ${attempt.score}%`}
                                        >
                                            <span className="score-value">{attempt.score}%</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default StudentStats;

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import '../styles/ModernTheme.css';
import '../pages/ChapterView_Modern.css';
import { FaArrowLeft, FaBook, FaQuestionCircle, FaCheckCircle, FaClock, FaProgressBar } from 'react-icons/fa';

const ChapterView = () => {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [chapter, setChapter] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchChapterData();
  }, [chapterId]);

  const fetchChapterData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(
        `http://localhost:5000/api/chapters/${chapterId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setChapter(response.data);
      setLessons(response.data.lessons || []);
      setError(null);
    } catch (err) {
      console.error('Chapter error:', err);
      setError('Failed to load chapter data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="chapter-loading">
        <div className="spinner"></div>
        <p>Loading chapter...</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="chapter-error">
        <div className="alert alert-danger">{error || 'Chapter not found'}</div>
        <Link to="/dashboard/student" className="btn btn-primary">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const progress = chapter.progress || 0;
  const completedLessons = lessons.filter(l => l.completed).length;

  return (
    <div className="chapter-view">
      {/* Header */}
      <div className="chapter-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        <div className="header-content">
          <h1>{chapter.title}</h1>
          <p>{chapter.description}</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <FaBook />
            <span>{lessons.length} lessons</span>
          </div>
          <div className="stat">
            <FaCheckCircle />
            <span>{completedLessons} completed</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-header">
          <h3>Chapter Progress</h3>
          <span className="progress-percent">{progress}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>

      {/* Lessons Grid */}
      <div className="lessons-section">
        <h2>Lessons</h2>
        {lessons.length === 0 ? (
          <div className="empty-state">
            <p>No lessons available in this chapter yet</p>
          </div>
        ) : (
          <div className="lessons-grid">
            {lessons.map((lesson, index) => (
              <Link
                key={lesson._id}
                to={`/lesson/${lesson._id}`}
                className={`lesson-card ${lesson.completed ? 'completed' : ''}`}
              >
                <div className="lesson-number">{index + 1}</div>
                <div className="lesson-content">
                  <h3>{lesson.title}</h3>
                  <p>{lesson.description}</p>
                  <div className="lesson-meta">
                    <span className="lesson-type">
                      {lesson.type === 'video' ? '📹' : '📄'} {lesson.type}
                    </span>
                    {lesson.duration && (
                      <span className="lesson-duration">
                        <FaClock /> {lesson.duration} min
                      </span>
                    )}
                  </div>
                </div>
                <div className="lesson-status">
                  {lesson.completed ? (
                    <FaCheckCircle className="status-icon completed" />
                  ) : (
                    <div className="status-icon pending"></div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quizzes Section */}
      <div className="quizzes-section">
        <h2>Chapter Quiz</h2>
        {chapter.quiz ? (
          <div className="quiz-card">
            <div className="quiz-header">
              <FaQuestionCircle className="quiz-icon" />
              <h3>{chapter.quiz.title}</h3>
            </div>
            <p>{chapter.quiz.description}</p>
            <div className="quiz-info">
              <span>{chapter.quiz.questions?.length || 0} questions</span>
              <span>~{chapter.quiz.estimatedTime || 15} minutes</span>
            </div>
            <Link
              to={`/quiz/${chapter.quiz._id}`}
              className="btn btn-primary"
            >
              Start Quiz
            </Link>
          </div>
        ) : (
          <div className="empty-state">
            <p>No quiz available for this chapter yet</p>
          </div>
        )}
      </div>

      {/* Resources Section */}
      {chapter.resources && chapter.resources.length > 0 && (
        <div className="resources-section">
          <h2>Additional Resources</h2>
          <div className="resources-list">
            {chapter.resources.map((resource, index) => (
              <a
                key={index}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="resource-item"
              >
                <span className="resource-icon">📎</span>
                <div className="resource-content">
                  <h4>{resource.title}</h4>
                  <p>{resource.description}</p>
                </div>
                <span className="resource-arrow">→</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChapterView;

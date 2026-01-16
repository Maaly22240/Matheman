import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ChapterView.css';
import { FaArrowLeft } from 'react-icons/fa';

const ChapterView = () => {
    const [chapter, setChapter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { chapterId } = useParams();
    const navigate = useNavigate();

    // Fetch chapter data
    useEffect(() => {
        const fetchChapter = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Please login again");
                    navigate("/login");
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/chapters/${chapterId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setChapter(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching chapter:", err);
                setError(err.response?.data?.message || "Failed to load chapter");
                setLoading(false);
                
                if (err.response?.status === 403 || err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                }
            }
        };

        fetchChapter();
    }, [chapterId, navigate]);

    // Add keyboard event listener for Alt+Left
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.altKey && e.key === 'ArrowLeft') {
                handleBackToDashboard();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const handleStartQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    const handleBackToDashboard = () => {
        navigate('/dashboard/student');
    };

    // Record study session when viewing a chapter - improved with better error handling and feedback
    useEffect(() => {
        const recordStudySession = async () => {
            if (!chapterId || loading || error) return;
            
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                
                const response = await axios.post(
                    "http://localhost:5000/api/dashboard/student/study",
                    { chapterId },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                console.log("Study session recorded successfully:", response.data);
                
                // Add some visual feedback that could show progress is being tracked
                const progressIndicator = document.createElement('div');
                progressIndicator.className = 'progress-indicator';
                progressIndicator.innerHTML = 'Progress saved ✓';
                document.body.appendChild(progressIndicator);
                
                setTimeout(() => {
                    progressIndicator.style.opacity = '0';
                    setTimeout(() => {
                        document.body.removeChild(progressIndicator);
                    }, 500);
                }, 2000);
                
            } catch (err) {
                console.error("Error recording study session:", err);
                // We don't want to disturb the user experience with errors here
                // Just log it and let them continue using the app
            }
        };
        
        recordStudySession();
    }, [chapterId, loading, error]);

    if (loading) {
        return (
            <div className="chapter-loading">
                <div className="spinner"></div>
                <p>Loading chapter content...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="chapter-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={handleBackToDashboard}>Back to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="chapter-view-container">
            <div className="chapter-nav">
                <button className="back-button" onClick={handleBackToDashboard}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <div className="keyboard-shortcut-hint">
                    <span>Press Alt+Left to go back</span>
                </div>
            </div>
            
            <div className="chapter-content">
                <h1 className="chapter-title">{chapter.name}</h1>
                
                <div className="chapter-text">
                    {chapter.content}
                </div>
                
                {chapter.images && chapter.images.length > 0 && (
                    <div className="chapter-images">
                        {chapter.images.map((img, index) => (
                            <img 
                                key={index} 
                                src={img} 
                                alt={`Figure ${index + 1}`} 
                                className="chapter-image"
                            />
                        ))}
                    </div>
                )}
                
                {chapter.quizzes && chapter.quizzes.length > 0 && (
                    <div className="chapter-quizzes">
                        <h2>Check Your Understanding</h2>
                        {chapter.quizzes.map((quiz, index) => (
                            <div key={index} className="quiz-card">
                                <h3>{quiz.title || `Quiz ${index + 1}`}</h3>
                                <p>{quiz.description || "Test your knowledge with this quiz."}</p>
                                <button 
                                    onClick={() => handleStartQuiz(quiz._id)}
                                    className="start-quiz-btn"
                                >
                                    Start Quiz
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChapterView;
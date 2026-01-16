import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/ChapterView.css';
import { FaArrowLeft, FaLightbulb, FaBookOpen, FaPuzzlePiece, FaClipboardCheck } from 'react-icons/fa';
import QuizService from '../services/QuizService';
import ContentRecommendations from './ContentRecommendations';
import ReactMarkdown from 'react-markdown';

const EnhancedChapterView = () => {
    const [chapter, setChapter] = useState(null);
    const [activeSection, setActiveSection] = useState(0);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dueQuizzes, setDueQuizzes] = useState([]);
    const { chapterId } = useParams();
    const navigate = useNavigate();

    // Debug console log to verify component and chapterId
    console.log('EnhancedChapterView rendered with chapterId:', chapterId);

    // Fetch chapter data and associated quizzes
    useEffect(() => {
        const fetchChapterData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Please login again");
                    navigate("/login");
                    return;
                }

                const headers = {
                    Authorization: `Bearer ${token}`
                };

                // Parallel requests for chapter and quizzes
                const [chapterRes, quizzesRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/chapters/${chapterId}`, { headers }),
                    axios.get(`http://localhost:5000/api/quizzes/chapter/${chapterId}`, { headers })
                ]);

                setChapter(chapterRes.data);
                setQuizzes(quizzesRes.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching chapter data:", err);
                setError(err.response?.data?.message || "Failed to load chapter content");
                setLoading(false);
                
                if (err.response?.status === 403 || err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                }
            }
        };

        fetchChapterData();
    }, [chapterId, navigate]);

    // Record study session when viewing a chapter
    useEffect(() => {
        const recordStudySession = async () => {
            if (!chapterId || loading || error) return;
            
            try {
                const token = localStorage.getItem("token");
                if (!token) return;
                
                await axios.post(
                    "http://localhost:5000/api/dashboard/student/study",
                    { chapterId },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );
                
                // Show progress indicator
                showProgressIndicator();
            } catch (err) {
                console.error("Error recording study session:", err);
                // Non-blocking error - don't disrupt user experience
            }
        };
        
        recordStudySession();
    }, [chapterId, loading, error]);

    // Check for due spaced repetition quizzes
    useEffect(() => {
        if (quizzes.length > 0) {
            const spacedQuizzes = quizzes.filter(quiz => quiz.type === 'spaced-repetition');
            const dueQuizIds = spacedQuizzes
                .filter(quiz => QuizService.isSpacedRepetitionDue(quiz._id))
                .map(quiz => quiz._id);
            
            setDueQuizzes(dueQuizIds);
        }
    }, [quizzes]);

    const handleBackToDashboard = () => {
        navigate('/dashboard/student');
    };

    const showProgressIndicator = () => {
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
    };

    const navigateToQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    const getSectionIcon = (type) => {
        switch(type) {
            case 'theory': return <FaBookOpen />;
            case 'example': return <FaLightbulb />;
            case 'mnemonic': return <FaLightbulb />;
            case 'chunking': return <FaPuzzlePiece />;
            case 'application': return <FaClipboardCheck />;
            default: return <FaBookOpen />;
        }
    };

    // Enhanced content rendering function with better formatting support
    const renderContent = (content) => {
        if (!content) return null;
        
        // Use ReactMarkdown for better rendering if available
        // If ReactMarkdown is not installed, fallback to basic formatting
        try {
            return <ReactMarkdown>{content}</ReactMarkdown>;
        } catch (e) {
            // Fallback to basic HTML formatting
            return <div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />;
        }
    };

    const renderQuizCard = (quiz) => {
        const isDue = dueQuizzes.includes(quiz._id);
        
        return (
            <div key={quiz._id} className={`quiz-card ${isDue ? 'quiz-due' : ''}`}>
                <div className="quiz-type-badge">{quiz.type}</div>
                {isDue && <div className="quiz-due-badge">Review Due</div>}
                <h3>{quiz.title}</h3>
                <p>{quiz.description}</p>
                <div className="quiz-metadata">
                    <span>{quiz.questions.length} questions</span>
                    {quiz.timeLimit && <span>{quiz.timeLimit} min</span>}
                    {quiz.type === 'spaced-repetition' && (
                        <span className="quiz-technique">Reinforces long-term memory</span>
                    )}
                    {quiz.type === 'interleaved' && (
                        <span className="quiz-technique">Builds problem-solving flexibility</span>
                    )}
                    {quiz.type === 'encoding' && (
                        <span className="quiz-technique">Uses memory techniques</span>
                    )}
                    {quiz.type === 'contextual-variation' && (
                        <span className="quiz-technique">Applies concepts in context</span>
                    )}
                </div>
                <button 
                    className={`start-quiz-btn ${isDue ? 'due-btn' : ''}`}
                    onClick={() => navigateToQuiz(quiz._id)}
                >
                    {isDue ? 'Review Now' : 'Start Quiz'}
                </button>
            </div>
        );
    };

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
        <div className="enhanced-chapter-container">
            <nav className="chapter-nav">
                <button className="back-button" onClick={handleBackToDashboard}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
            </nav>
            
            <div className="chapter-header">
                <h1>{chapter.name}</h1>
                <p className="chapter-summary">{chapter.summary}</p>
                <div className="chapter-metadata">
                    <span className="difficulty-badge">{chapter.difficulty}</span>
                    <span className="duration-badge">{chapter.estimatedDuration} min</span>
                </div>
            </div>
            
            {/* Display main chapter content */}
            {chapter.content && (
                <div className="main-chapter-content">
                    {renderContent(chapter.content)}
                </div>
            )}
            
            <div className="chapter-body">
                <div className="section-navigation">
                    <h3>Chapter Sections</h3>
                    <ul>
                        {chapter.sections && chapter.sections
                            .sort((a, b) => a.order - b.order)
                            .map((section, index) => (
                                <li 
                                    key={index}
                                    className={activeSection === index ? 'active' : ''}
                                    onClick={() => setActiveSection(index)}
                                >
                                    <span className="section-icon">{getSectionIcon(section.type)}</span>
                                    <span className="section-title">{section.title}</span>
                                    <span className="section-type-badge">{section.type}</span>
                                </li>
                            ))
                        }
                    </ul>
                </div>
                
                <div className="section-content">
                    {chapter.sections && chapter.sections.length > 0 && (
                        <div className="current-section">
                            <h2 className="section-title">{chapter.sections[activeSection]?.title}</h2>
                            {renderContent(chapter.sections[activeSection]?.content || '')}
                            
                            {chapter.sections[activeSection]?.images?.length > 0 && (
                                <div className="section-images">
                                    {chapter.sections[activeSection].images.map((img, idx) => (
                                        <img 
                                            key={idx} 
                                            src={img} 
                                            alt={`Figure ${idx + 1}`} 
                                            className="section-image" 
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {chapter.mnemonicDevices && chapter.mnemonicDevices.length > 0 && (
                        <div className="mnemonic-devices">
                            <h3>Memory Techniques</h3>
                            <ul>
                                {chapter.mnemonicDevices.map((mnemonic, idx) => (
                                    <li key={idx}>
                                        <FaLightbulb className="mnemonic-icon" />
                                        {mnemonic}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            
            {quizzes.length > 0 && (
                <div className="chapter-quizzes">
                    <h2>Check Your Understanding</h2>
                    <div className="quiz-cards">
                        {quizzes.map(renderQuizCard)}
                    </div>
                </div>
            )}
            
            {/* Add personalized content recommendations based on student metrics */}
            <ContentRecommendations chapterId={chapterId} />
        </div>
    );
};

export default EnhancedChapterView;

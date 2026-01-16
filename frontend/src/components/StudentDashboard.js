import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import StudentStats from './Dashboard/StudentStats';
import '../styles/Dashboard.css';
import { FaBook, FaUserGraduate, FaChalkboardTeacher, FaChartBar, FaEnvelope, 
         FaPlay, FaEye, FaArrowRight, FaFileAlt, FaImage, FaQuestionCircle,
         FaClock, FaCalendarAlt, FaLightbulb, FaStickyNote } from 'react-icons/fa';
import QuizService from '../services/QuizService';

const StudentDashboard = () => {
    const [treeData, setTreeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [activeChapterId, setActiveChapterId] = useState(null);
    const [expandedDomains, setExpandedDomains] = useState({});
    const [teacherData, setTeacherData] = useState([]);
    const [visibleChapters, setVisibleChapters] = useState({});
    const [dueQuizzes, setDueQuizzes] = useState([]);
    const [myNotes, setMyNotes] = useState([]);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const navigate = useNavigate();

    const checkDueQuizzes = async () => {
        try {
            // Get IDs of quizzes due for review from local storage
            const dueQuizIds = QuizService.getDueSpacedRepetitionQuizzes();
            if (dueQuizIds.length === 0) return;
            
            // Fetch actual quiz data for these IDs if we have them
            const quizPromises = dueQuizIds.map(id => QuizService.getQuizById(id).catch(() => null));
            const quizData = await Promise.all(quizPromises);
            const validQuizzes = quizData.filter(q => q !== null);
            
            setDueQuizzes(validQuizzes);
        } catch (error) {
            console.error("Error checking due quizzes:", error);
        }
    };

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("Please login again");
                navigate("/login");
                return;
            }

            // Validate token format and expiration
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const isExpired = payload.exp < Date.now() / 1000;

                if (isExpired) {
                    localStorage.clear();
                    setError("Your session has expired. Please login again.");
                    navigate("/login");
                    return;
                }
            } catch (tokenError) {
                console.error("Invalid token format:", tokenError);
                localStorage.clear();
                setError("Invalid token format. Please login again.");
                navigate("/login");
                return;
            }
            
            console.log("Using token authentication");
            
            try {
                // Use token in authorization header
                const response = await axios.get("http://localhost:5000/api/dashboard/student", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                if (response.data) {
                    setTreeData(response.data);
                    setLoading(false);
                    
                    // Check for due quizzes
                    if (response.data.domains) {
                        checkDueQuizzes();
                    }
                    
                    return;
                }
            } catch (apiError) {
                // Handle specific API errors
                if (apiError.response?.status === 401 || apiError.response?.status === 403) {
                    localStorage.clear();
                    setError("Your session has expired. Please login again.");
                    navigate("/login");
                    return;
                }
                
                // If there's a specific message from the server, use it
                if (apiError.response?.data?.message) {
                    setError(apiError.response.data.message);
                } else {
                    setError("Error connecting to server. Please try again later.");
                }
                
                setLoading(false);
                throw apiError; // Re-throw to stop execution
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Dashboard error:", error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        if (activeTab === 'teachers') {
            fetchTeachers();
        }
    }, [navigate, activeTab]);

    useEffect(() => {
        checkDueQuizzes();
    }, []);

    const fetchTeachers = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                // Fetch only relevant teachers from backend
                const response = await axios.get("http://localhost:5000/api/users/teachers", {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data && Array.isArray(response.data)) {
                    setTeacherData(response.data);
                    return;
                }
            } catch (apiError) {
                console.log("Could not fetch teachers from API, using mock data instead:", apiError);
            }

            // If API call fails or returns invalid data, fall back to mock data
            if (!treeData) return;
            
            // Create mock teacher data based on domains in treeData
            const mockTeachers = [
                {
                    _id: "t1",
                    name: "Alice Smith",
                    email: "alice@teacher.com",
                    subject: "Algebra & Geometry",
                    avatar: "A",
                    domains: treeData.domains.filter((_, i) => i % 2 === 0).map(d => d._id),
                    bio: "Mathematics specialist with 8 years of teaching experience. Passionate about making algebra accessible to all students."
                },
                {
                    _id: "t2",
                    name: "Robert Johnson",
                    email: "robert@teacher.com",
                    subject: "Calculus & Statistics",
                    avatar: "R",
                    domains: treeData.domains.filter((_, i) => i % 2 === 1).map(d => d._id),
                    bio: "PhD in Mathematics Education. Focuses on practical applications of mathematical concepts."
                },
                {
                    _id: "t3",
                    name: "Maria Garcia",
                    email: "maria@teacher.com",
                    subject: "Problem Solving & Logic",
                    avatar: "M",
                    domains: treeData.domains.map(d => d._id),
                    bio: "Specializes in mathematical problem-solving strategies and logical thinking development."
                }
            ];
            
            setTeacherData(mockTeachers);
        } catch (error) {
            console.error("Error fetching teachers:", error);
        }
    };

    const startStudySession = async (chapterId) => {
        try {
            setActiveChapterId(chapterId); // Highlight current chapter
            
            // Show loading state on the button
            const buttonElement = document.querySelector(`#chapter-${chapterId} .study-button`);
            if (buttonElement) {
                buttonElement.innerHTML = '<span class="button-spinner"></span> Starting...';
                buttonElement.disabled = true;
            }
            
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Please login again");
                navigate("/login");
                return;
            }
            
            const response = await axios.post(
                "http://localhost:5000/api/dashboard/student/study",
                { chapterId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            
            console.log("Study session recorded successfully:", response.data);
            
            // Update the local tree data to include this new study session
            if (response.data.session) {
                const newStudy = {
                    chapter: treeData.domains.flatMap(d => d.chapters).find(c => c._id === chapterId),
                    session_start: response.data.session.session_start
                };
                
                // Update stats in local state
                setTreeData(prev => ({
                    ...prev,
                    studies: [...(prev.studies || []), newStudy],
                    stats: {
                        ...prev.stats,
                        totalSessions: (prev.stats.totalSessions || 0) + 1
                    }
                }));
            }
            
            // Navigate to chapter view
            navigate(`/chapter/${chapterId}`);
        } catch (error) {
            console.error("Error starting study session:", error);
            // Restore button state in case of error
            const buttonElement = document.querySelector(`#chapter-${chapterId} .study-button`);
            if (buttonElement) {
                buttonElement.innerHTML = '<FaPlay /> Start Learning';
                buttonElement.disabled = false;
            }
            
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.clear();
                setError("Your session has expired. Please login again.");
                navigate("/login");
                return;
            }
            
            // Still navigate even if recording fails
            navigate(`/chapter/${chapterId}`);
        }
    };

    const handleChapterSelect = async (chapterId) => {
        await startStudySession(chapterId);
        navigate(`/chapter/${chapterId}`);
    };

    const toggleDomainExpand = (domainId) => {
        setExpandedDomains(prev => ({
            ...prev,
            [domainId]: !prev[domainId]
        }));
    };

    const handleShowMore = (domainId) => {
        setVisibleChapters(prev => ({
            ...prev,
            [domainId]: (prev[domainId] || 3) + 3
        }));
    };

    const navigateToQuiz = (quizId) => {
        navigate(`/quiz/${quizId}`);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return renderOverview();
            case 'chapters':
                return renderChapters();
            case 'teachers':
                return renderTeachers();
            case 'stats':
                return renderStats();
            case 'myNotes':
                return renderMyNotes();
            default:
                return renderOverview();
        }
    };

    const renderOverview = () => (
        <>
            <header className="dashboard-header">
                <h1>Welcome back, {treeData?.studentName || "Student"}</h1>
                <p>Continue your learning journey</p>
            </header>

            {treeData?.stats && (
                <StudentStats
                    stats={treeData.stats}
                    summary={true}
                />
            )}

            <div className="recent-activity-section">
                <h2><FaCalendarAlt className="section-icon" /> Recent Activity</h2>
                <div className="recent-chapters">
                    {treeData?.studies?.slice(-3).reverse().map((study, index) => (
                        <div key={index} className="recent-chapter-card">
                            <div className="chapter-info">
                                <h3>{study.chapter.name}</h3>
                                <p className="chapter-domain">{getDomainForChapter(study.chapter._id)}</p>
                                <p className="study-date"><FaCalendarAlt /> {new Date(study.session_start).toLocaleDateString()}</p>
                            </div>
                            <button
                                onClick={() => handleChapterSelect(study.chapter._id)}
                                className="continue-btn"
                            >
                                Continue <FaArrowRight />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {treeData?.quizAttempts?.length > 0 && (
                <div className="recent-quizzes-section">
                    <h2><FaQuestionCircle className="section-icon" /> Recent Quizzes</h2>
                    <div className="recent-quizzes">
                        {treeData.quizAttempts.slice(-3).reverse().map((attempt, index) => (
                            <div key={index} className="quiz-result-card">
                                <div className="quiz-result-info">
                                    <h3>{attempt.quiz.title || "Practice Quiz"}</h3>
                                    <p className="quiz-score">Score: <span className={attempt.score >= 70 ? "high-score" : "normal-score"}>{attempt.score}%</span></p>
                                    <p className="quiz-details">{attempt.correct}/{attempt.total} correct answers</p>
                                    <p className="quiz-date">Taken on {new Date(attempt.date).toLocaleDateString()}</p>
                                </div>
                                <button
                                    onClick={() => navigateToQuiz(attempt.quiz._id)}
                                    className="retry-quiz-btn"
                                >
                                    Try Again
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {dueQuizzes.length > 0 && (
                <div className="due-quizzes-section">
                    <h2><FaClock className="section-icon" /> Review Due</h2>
                    <div className="due-quizzes">
                        {dueQuizzes.map(quiz => (
                            <div key={quiz._id} className="due-quiz-card">
                                <div className="quiz-info">
                                    <h3>{quiz.title}</h3>
                                    <p className="quiz-type">Spaced Repetition</p>
                                    <p className="quiz-chapter">
                                        From: {treeData.domains
                                            .flatMap(d => d.chapters)
                                            .find(c => c._id === quiz.chapter)?.name || 'Unknown chapter'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => navigateToQuiz(quiz._id)}
                                    className="review-now-btn"
                                >
                                    Review Now
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="spaced-info">
                        <FaLightbulb className="info-icon" />
                        <p>Spaced repetition helps move knowledge to your long-term memory 
                           by reviewing material at optimal intervals.</p>
                    </div>
                </div>
            )}

            <div className="recommended-section">
                <h2>Recommended for You</h2>
                <div className="recommended-chapters">
                    {getRecommendedChapters().map(chapter => (
                        <div key={chapter._id} className="recommended-chapter-card">
                            <h3>{chapter.name}</h3>
                            <p>{chapter.content?.substring(0, 80)}...</p>
                            <button
                                onClick={() => handleChapterSelect(chapter._id)}
                                className="explore-btn"
                            >
                                Explore
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <button 
                onClick={() => navigate('/quiz/your-quiz-id-here')}
                style={{padding: '10px', margin: '20px 0'}}>
                Test Quiz Access
            </button>
        </>
    );

    const renderChapters = () => (
        <>
            <header className="dashboard-header">
                <h1><FaBook className="header-icon" /> Chapters & Learning Materials</h1>
                <p>Explore chapters by domain</p>
            </header>

            {treeData?.domains && (
                <div className="domains-accordion">
                    {treeData.domains.map((domain) => {
                        const chaptersToShow = visibleChapters[domain._id] || 3;
                        const allChapters = domain.chapters || [];
                        const visibleChaptersList = allChapters.slice(0, chaptersToShow);
                        const hasMoreChapters = allChapters.length > chaptersToShow;

                        return (
                            <div
                                id={`domain-${domain._id}`}
                                key={domain._id}
                                className="domain-accordion-item"
                            >
                                <div 
                                    className="domain-accordion-header"
                                    onClick={() => toggleDomainExpand(domain._id)}
                                >
                                    <h3>{domain.name}</h3>
                                    <span className="expand-icon">
                                        {expandedDomains[domain._id] ? '−' : '+'}
                                    </span>
                                </div>

                                {expandedDomains[domain._id] && (
                                    <div className="domain-accordion-content">
                                        {visibleChaptersList.map((chapter) => (
                                            <div
                                                key={chapter._id}
                                                id={`chapter-${chapter._id}`}
                                                className="chapter-item"
                                            >
                                                <div className="chapter-main-info">
                                                    <h4>{chapter.name}</h4>
                                                    <p>{chapter.description || "No description available."}</p>
                                                </div>
                                                <div className="chapter-quick-links">
                                                    <Link 
                                                        to={`/chapter/${chapter._id}#content`} 
                                                        className="chapter-link"
                                                    >
                                                        <FaFileAlt /> Content
                                                    </Link>
                                                    {chapter.quizzes?.length > 0 && (
                                                        <Link 
                                                            to={`/chapter/${chapter._id}#quizzes`} 
                                                            className="chapter-link"
                                                        >
                                                            <FaQuestionCircle /> Quizzes ({chapter.quizzes.length})
                                                        </Link>
                                                    )}
                                                    {chapter.images?.length > 0 && (
                                                        <Link 
                                                            to={`/chapter/${chapter._id}#images`} 
                                                            className="chapter-link"
                                                        >
                                                            <FaImage /> Images ({chapter.images.length})
                                                        </Link>
                                                    )}
                                                </div>
                                                <div className="chapter-actions">
                                                    <button 
                                                        className="study-button"
                                                        onClick={() => handleChapterSelect(chapter._id)}
                                                    >
                                                        <FaPlay /> Start Learning
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        
                                        {hasMoreChapters && (
                                            <div className="show-more-container">
                                                <button
                                                    className="show-more-btn"
                                                    onClick={() => handleShowMore(domain._id)}
                                                >
                                                    Show More Chapters <FaArrowRight className="btn-icon" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );

    const renderTeachers = () => {
        const domainMap = {};
        treeData?.domains?.forEach(domain => {
            domainMap[domain._id] = domain.name;
        });

        // Function to handle initiating a message
        const handleInitiateMessage = (teacherId) => {
            // Navigate to the messages page, potentially passing state
            // to pre-select or start a conversation with this teacher.
            // For simplicity now, just navigate to the messages page.
            navigate('/messages', { state: { recipientId: teacherId } }); 
        };

        return (
            <>
                <header className="dashboard-header">
                    <h1>My Teachers</h1>
                    <p>Connect with your mathematics instructors</p>
                </header>
                
                {teacherData.length > 0 ? (
                    <div className="teachers-section">
                        <div className="teachers-list">
                            {teacherData.map(teacher => {
                                // Only show domains that are in student's domains
                                const teacherDomains = teacher.domains
                                    ? teacher.domains
                                        .filter(domainId => treeData?.domains.some(d => d._id === domainId))
                                        .map(domainId => domainMap[domainId])
                                    : [];

                                return (
                                    <div key={teacher._id} className="teacher-card-detailed">
                                        <div className="teacher-header">
                                            <div className="teacher-avatar-large">
                                                {teacher.avatar || teacher.name[0].toUpperCase()}
                                            </div>
                                            <div className="teacher-primary">
                                                <h3>{teacher.name}</h3>
                                                <span className="teacher-specialty">
                                                    {teacher.subject || "Mathematics"}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="teacher-bio">
                                            {teacher.bio || `${teacher.name} is a specialized instructor in ${teacher.subject || "Mathematics"}.`}
                                        </p>

                                        {teacherDomains.length > 0 && (
                                            <div className="teacher-domains">
                                                <h4>Teaching Your Domains:</h4>
                                                <ul>
                                                    {teacherDomains.map((domain, index) => (
                                                        <li key={index}>{domain}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        <div className="teacher-contact">
                                            <button
                                                className="contact-btn"
                                                onClick={() => handleInitiateMessage(teacher._id)}
                                            >
                                                <FaEnvelope /> Message Teacher
                                            </button>
                                            <button className="schedule-btn">
                                                Schedule Meeting
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="no-data-container">
                        <p className="no-data-message">No teachers assigned to your domains yet.</p>
                    </div>
                )}
            </>
        );
    };

    const renderStats = () => (
        <>
            <header className="dashboard-header">
                <h1>My Learning Statistics</h1>
                <p>Track your progress and achievements</p>
            </header>

            {treeData?.stats && (
                <div className="detailed-stats">
                    <StudentStats
                        stats={treeData.stats}
                        studies={treeData.studies}
                        quizAttempts={treeData.quizAttempts || []}
                        summary={false}
                    />
                </div>
            )}
        </>
    );

    const renderMyNotes = () => (
        <>
            <header className="dashboard-header">
                <h1><FaStickyNote className="header-icon" /> My Notes</h1>
                <p>Mnemonics and notes assigned by your teachers.</p>
            </header>
            <div className="my-notes-list">
                {loadingNotes ? (
                    <div className="loading-indicator">Loading notes...</div>
                ) : myNotes.length > 0 ? (
                    myNotes.map(note => (
                        <div key={note._id} className="note-card">
                            <h3>{note.title}</h3>
                            <div className="note-meta">
                                <span>From: {note.createdBy?.name || 'Teacher'}</span>
                                {note.relatedChapter && <span>Chapter: {note.relatedChapter.name}</span>}
                                {note.relatedDomain && <span>Domain: {note.relatedDomain.name}</span>}
                            </div>
                            <div 
                                className="note-content ProseMirror"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                        </div>
                    ))
                ) : (
                    <div className="no-data-message">
                        <p>You don't have any assigned notes yet.</p>
                    </div>
                )}
            </div>
        </>
    );

    const getDomainForChapter = (chapterId) => {
        if (!treeData?.domains) return 'Unknown';
        
        for (const domain of treeData.domains) {
            const foundChapter = domain.chapters.find(c => c._id === chapterId);
            if (foundChapter) return domain.name;
        }
        return 'Unknown';
    };

    const getRecommendedChapters = () => {
        if (!treeData?.domains) return [];
        
        const studiedChapterIds = new Set(treeData.studies.map(s => s.chapter._id));
        const allChapters = treeData.domains.flatMap(d => d.chapters);
        
        return allChapters
            .filter(chapter => !studiedChapterIds.has(chapter._id))
            .slice(0, 3);
    };

    // Fetch assigned mnemonics when My Notes tab is active
    useEffect(() => {
        const fetchMyNotes = async () => {
            setLoadingNotes(true);
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }
            try {
                const response = await axios.get('http://localhost:5000/api/mnemonics/assigned/my', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMyNotes(response.data || []);
            } catch (err) {
                console.error("Error fetching assigned notes:", err);
                // Optionally set an error state specific to notes
                setMyNotes([]);
            } finally {
                setLoadingNotes(false);
            }
        };

        if (activeTab === 'myNotes') {
            fetchMyNotes();
        }
    }, [activeTab, navigate]);

    if (loading) return <div className="dashboard-loading">Loading your dashboard...</div>;
    if (error) return <div className="dashboard-error">{error}</div>;
    if (!treeData || !treeData.domains) return <div className="dashboard-error">No content available. Please contact support.</div>;

    return (
        <div className="dashboard-container">
            <div className="dashboard-layout">
                <div className="dashboard-sidebar">
                    <div className="sidebar-tabs">
                        <button
                            className={`sidebar-tab ${activeTab === 'overview' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <FaChartBar className="tab-icon" />
                            <span>Dashboard</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'chapters' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('chapters')}
                        >
                            <FaBook className="tab-icon" />
                            <span>Chapters</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'teachers' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('teachers')}
                        >
                            <FaChalkboardTeacher className="tab-icon" />
                            <span>My Teachers</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'stats' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            <FaUserGraduate className="tab-icon" />
                            <span>My Stats</span>
                        </button>
                        <button
                            className={`sidebar-tab ${activeTab === 'myNotes' ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab('myNotes')}
                        >
                            <FaStickyNote className="tab-icon" />
                            <span>My Notes</span>
                        </button>
                    </div>

                    <div className="quick-jump">
                        <h3>Quick Access</h3>
                        <ul className="domain-links">
                            {treeData?.domains && treeData.domains.map(domain => (
                                <li key={domain._id}>
                                    <button
                                        className="domain-link"
                                        onClick={() => {
                                            setActiveTab('chapters');
                                            toggleDomainExpand(domain._id);
                                            const domainElement = document.getElementById(`domain-${domain._id}`);
                                            if (domainElement) {
                                                domainElement.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                    >
                                        {domain.name}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {treeData?.stats && (
                            <div className="sidebar-progress">
                                <h3>Progress Summary</h3>
                                <div className="progress-stats">
                                    <div className="mini-stat">
                                        <span className="mini-stat-value">{treeData.stats.totalSessions}</span>
                                        <span className="mini-stat-label">Sessions</span>
                                    </div>
                                    <div className="mini-stat">
                                        <span className="mini-stat-value">{treeData.stats.uniqueChapters}</span>
                                        <span className="mini-stat-label">Chapters</span>
                                    </div>
                                    <div className="mini-stat">
                                        <span className="mini-stat-value">{treeData.stats.activeStreak || 0}</span>
                                        <span className="mini-stat-label">Day Streak</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="dashboard-main">
                    {error ? (
                        <div className="error-message">{error}</div>
                    ) : (
                        renderContent()
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
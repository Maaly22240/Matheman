import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/QuizView.css';
import { FaClock, FaCheck, FaTimes, FaLightbulb, FaBrain, FaRandom, 
         FaExchangeAlt, FaPuzzlePiece, FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import QuizService from '../services/QuizService';
import TechniqueBanner from './QuizComponents/TechniqueBanner';

const QuizView = () => {
    const [quiz, setQuiz] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [allAnswers, setAllAnswers] = useState([]); // New state to track all answers
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [quizResults, setQuizResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [chapterContent, setChapterContent] = useState(null);
    const [mnemonicVisible, setMnemonicVisible] = useState(false);
    const { quizId } = useParams();
    const navigate = useNavigate();

    // Initialize allAnswers array when quiz loads
    useEffect(() => {
        if (quiz) {
            // Create an array with empty strings for each question
            setAllAnswers(new Array(quiz.questions.length).fill(''));
        }
    }, [quiz]);

    // Fetch quiz data
    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Please login again");
                    navigate("/login");
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/quizzes/${quizId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setQuiz(response.data);
                
                // Set timer if quiz has a time limit
                if (response.data.timeLimit) {
                    setTimeLeft(response.data.timeLimit * 60); // convert minutes to seconds
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching quiz:", err);
                setError(err.response?.data?.message || "Failed to load quiz");
                setLoading(false);
                
                if (err.response?.status === 403 || err.response?.status === 401) {
                    localStorage.clear();
                    navigate("/login");
                }
            }
        };

        fetchQuiz();
    }, [quizId, navigate]);

    // Define handleSubmitQuiz with useCallback before using it in the effect
    const handleSubmitQuiz = useCallback(async () => {
        try {
            // Save the current answer
            const finalAnswers = [...allAnswers];
            finalAnswers[currentQuestionIndex] = selectedAnswer;
            
            // Check if all questions are answered
            const hasUnanswered = finalAnswers.some(answer => !answer);
            if (hasUnanswered) {
                setError("Please answer all questions before submitting.");
                // Find the first unanswered question and go to it
                const unansweredIndex = finalAnswers.findIndex(answer => !answer);
                setCurrentQuestionIndex(unansweredIndex);
                return;
            }

            // Submit all answers to backend
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `http://localhost:5000/api/quizzes/${quizId}/attempt`,
                { answers: finalAnswers },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setQuizResults(response.data);
            setQuizCompleted(true);

            // If it's a spaced repetition quiz, schedule the next review
            if (quiz?.type === 'spaced-repetition') {
                QuizService.trackSpacedRepetition(quizId, response.data.score);
            }

        } catch (err) {
            console.error("Error submitting quiz:", err);
            setError("Failed to submit quiz. Please try again.");
        }
    }, [allAnswers, currentQuestionIndex, selectedAnswer, quizId, quiz, setQuizResults, setQuizCompleted, setError, setCurrentQuestionIndex]);

    // Timer effect for timed quizzes
    useEffect(() => {
        if (timeLeft === null || quizCompleted) return;
        
        if (timeLeft <= 0) {
            handleSubmitQuiz();
            return;
        }
        
        const timerId = setTimeout(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        
        return () => clearTimeout(timerId);
    }, [timeLeft, quizCompleted, handleSubmitQuiz]); // Add handleSubmitQuiz to dependencies

    // Special handling for spaced repetition quizzes
    useEffect(() => {
        if (quiz?.type === 'spaced-repetition' && quizCompleted && quizResults) {
            // Calculate next review date based on performance
            const daysToAdd = calculateSpacedRepetitionInterval(quizResults.score);
            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + daysToAdd);
            
            // Store in local storage for scheduling future reviews
            QuizService.trackSpacedRepetition(quizId, quizResults.score);
            
            console.log(`Next review scheduled for: ${nextReview.toLocaleDateString()}`);
        }
    }, [quiz, quizCompleted, quizResults, quizId]);

    // Add new effect to fetch associated chapter content for context
    useEffect(() => {
        const fetchChapterContent = async () => {
            if (!quiz) return;
            
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get(`http://localhost:5000/api/chapters/${quiz.chapter}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                
                setChapterContent(response.data);
            } catch (err) {
                console.error("Error fetching chapter content:", err);
                // Non-blocking error - we can still show the quiz
            }
        };
        
        fetchChapterContent();
    }, [quiz]);

    // Toggle mnemonic device visibility based on quiz type
    useEffect(() => {
        if (quiz?.type === 'encoding') {
            // Show mnemonic tip after a short delay
            const timer = setTimeout(() => setMnemonicVisible(true), 2000);
            return () => clearTimeout(timer);
        }
    }, [quiz, currentQuestionIndex]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // Update to store answer in the allAnswers array
    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
        
        // Update the answer in our complete answers array
        const updatedAnswers = [...allAnswers];
        updatedAnswers[currentQuestionIndex] = answer;
        setAllAnswers(updatedAnswers);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < quiz.questions.length - 1) {
            // Save current answer before moving to next question
            const updatedAnswers = [...allAnswers];
            updatedAnswers[currentQuestionIndex] = selectedAnswer;
            setAllAnswers(updatedAnswers);
            
            // Move to next question
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            // Set selected answer to previously stored answer for the next question (if any)
            setSelectedAnswer(updatedAnswers[currentQuestionIndex + 1]);
            setMnemonicVisible(false);
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            // Save current answer before moving to previous question
            const updatedAnswers = [...allAnswers];
            updatedAnswers[currentQuestionIndex] = selectedAnswer;
            setAllAnswers(updatedAnswers);
            
            // Move to previous question
            setCurrentQuestionIndex(currentQuestionIndex - 1);
            // Set selected answer to previously stored answer for the previous question
            setSelectedAnswer(updatedAnswers[currentQuestionIndex - 1]);
        }
    };

    // Helper functions for spaced repetition
    const calculateSpacedRepetitionInterval = (score) => {
        if (score >= 90) return 21; // 3 weeks
        if (score >= 80) return 14; // 2 weeks
        if (score >= 70) return 7;  // 1 week
        if (score >= 60) return 3;  // 3 days
        return 1; // 1 day
    };

    const handleBackToChapter = () => {
        navigate(`/chapter/${quiz.chapter}`);
    };

    // Get the appropriate icon for quiz type
    const getQuizTypeIcon = () => {
        switch(quiz?.type) {
            case 'recall': return <FaBrain />;
            case 'spaced-repetition': return <FaClock />;
            case 'interleaved': return <FaRandom />;
            case 'encoding': return <FaLightbulb />;
            case 'chunking': return <FaPuzzlePiece />;
            case 'contextual-variation': return <FaExchangeAlt />;
            default: return <FaCheck />;
        }
    };

    // Render different instructions based on quiz type
    const renderQuizTypeInstructions = () => {
        switch(quiz.type) {
            case 'recall':
                return "Test your knowledge by answering the questions from memory.";
            case 'spaced-repetition':
                return "This quiz helps reinforce knowledge through repeated exposure. You'll see these concepts again in the future.";
            case 'interleaved':
                return "This quiz mixes different concepts to strengthen your ability to select the right approach for each problem.";
            case 'encoding':
                return "Focus on creating mental connections to help remember these concepts long-term.";
            case 'chunking':
                return "Notice how complex topics are broken down into manageable pieces.";
            case 'contextual-variation':
                return "Notice how the same concepts appear in different contexts and applications.";
            default:
                return "Answer each question to the best of your ability.";
        }
    };

    // Enhanced quiz results with technique-specific feedback
    const renderQuizResults = () => {
        if (!quizCompleted || !quizResults) return null;
        
        return (
            <div className="quiz-results-container">
                <h2>Quiz Results</h2>
                
                {/* Score card */}
                <div className="score-card">
                    <div className="score-percentage">{Math.round(quizResults.score)}%</div>
                    <p className="score-details">
                        You answered {quizResults.correct} out of {quizResults.total} questions correctly
                    </p>
                </div>
                
                {/* Technique-specific feedback */}
                {quiz.type === 'spaced-repetition' && (
                    <div className="technique-feedback spaced-repetition">
                        <h3><FaClock /> Spaced Repetition</h3>
                        <p>To optimize your learning, we'll remind you to review this material again in 
                           {calculateSpacedRepetitionInterval(quizResults.score)} days.</p>
                        <p>Spaced repetition helps move knowledge into long-term memory by reviewing just before you're likely to forget.</p>
                    </div>
                )}
                
                {quiz.type === 'encoding' && (
                    <div className="technique-feedback encoding">
                        <h3><FaLightbulb /> Encoding Techniques</h3>
                        <p>The mnemonics and memory techniques in this quiz help you create stronger neural connections for better recall.</p>
                        <p>Try to use these memory techniques with other subjects too!</p>
                    </div>
                )}
                
                {quiz.type === 'interleaved' && (
                    <div className="technique-feedback interleaved">
                        <h3><FaRandom /> Interleaved Practice</h3>
                        <p>Mixing different types of problems strengthens your ability to select the right approach for each situation.</p>
                        <p>This enhanced discrimination leads to better long-term retention and application.</p>
                    </div>
                )}
                
                {quiz.type === 'contextual-variation' && (
                    <div className="technique-feedback contextual">
                        <h3><FaExchangeAlt /> Contextual Variation</h3>
                        <p>Seeing concepts in different contexts helps you form more flexible and robust understanding.</p>
                        <p>This flexibility will help you apply these concepts to novel situations in the future.</p>
                    </div>
                )}
                
                {quiz.type === 'chunking' && (
                    <div className="technique-feedback chunking">
                        <h3><FaPuzzlePiece /> Chunking</h3>
                        <p>Breaking down complex topics into smaller pieces makes them easier to understand and remember.</p>
                        <p>This technique reduces cognitive load and helps you master difficult concepts step by step.</p>
                    </div>
                )}
                
                {/* Questions review */}
                <div className="questions-review">
                    <h3>Review Your Answers</h3>
                    {quizResults.results.map((result, index) => (
                        <div 
                            key={index} 
                            className={`question-result ${result.isCorrect ? 'correct' : 'incorrect'}`}
                        >
                            <div className="question-header">
                                {result.isCorrect ? 
                                    <FaCheck className="correct-icon" /> : 
                                    <FaTimes className="incorrect-icon" />
                                }
                                <h4>Question {index + 1}</h4>
                            </div>
                            <p className="question-text">{quiz.questions[index].question}</p>
                            <div className="answer-review">
                                <p>Your answer: <strong>{result.userAnswer}</strong></p>
                                {!result.isCorrect && (
                                    <p>Correct answer: <strong>{result.correctAnswer}</strong></p>
                                )}
                            </div>
                            {result.explanation && (
                                <div className="answer-explanation">
                                    <FaLightbulb className="explanation-icon" />
                                    <p>{result.explanation}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
                
                {/* Next steps */}
                <div className="next-steps">
                    <button 
                        className="continue-btn"
                        onClick={handleBackToChapter}
                    >
                        Back to Chapter
                    </button>
                </div>
            </div>
        );
    };

    // Render mnemonics or memory aid for encoding-type questions
    const renderEncodingAid = () => {
        if (!mnemonicVisible || quiz.type !== 'encoding') return null;
        
        const currentQuestion = quiz.questions[currentQuestionIndex];
        let mnemonicTip = "Create a mental image or use a mnemonic to remember this concept.";
        
        // Look for specific mnemonic in chapter content if available
        if (chapterContent && chapterContent.mnemonicDevices) {
            // Find a relevant mnemonic by checking for keywords from the question
            const questionWords = currentQuestion.question.toLowerCase().split(' ');
            const relevantMnemonic = chapterContent.mnemonicDevices.find(mnemonic => 
                questionWords.some(word => word.length > 4 && mnemonic.toLowerCase().includes(word))
            );
            
            if (relevantMnemonic) {
                mnemonicTip = relevantMnemonic;
            }
        }
        
        return (
            <div className="technique-tip">
                <h4><FaLightbulb /> Memory Tip</h4>
                <p>{mnemonicTip}</p>
            </div>
        );
    };

    // Render contextual aid for contextual-variation type quizzes
    const renderContextualAid = () => {
        if (quiz.type !== 'contextual-variation') return null;
        
        return (
            <div className="technique-tip">
                <h4><FaExchangeAlt /> Context Tip</h4>
                <p>Notice how this problem applies the concept in a different context. 
                   Try to identify the core mathematical principle being used.</p>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="quiz-loading">
                <div className="spinner"></div>
                <p>Loading quiz...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="quiz-error">
                <h2>Error</h2>
                <p>{error}</p>
                <button onClick={() => {
                    setError(null);
                    if (quiz) return; // If quiz loaded, just clear error
                    navigate(-1); // Otherwise go back
                }}>
                    {quiz ? "Continue" : "Go Back"}
                </button>
            </div>
        );
    }

    if (quizCompleted) {
        return renderQuizResults();
    }

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

    return (
        <div className="quiz-container">
            {/* Banner explaining the learning technique being used */}
            <TechniqueBanner type={quiz.type} />
            
            <div className="quiz-header">
                <h2>{quiz.title}</h2>
                <p className="quiz-description">{quiz.description}</p>
                
                <div className="quiz-metadata">
                    <span className="quiz-type">
                        {getQuizTypeIcon()} {quiz.type.replace('-', ' ')}
                    </span>
                    {timeLeft !== null && (
                        <div className="quiz-timer">
                            <FaClock className="timer-icon" />
                            <span className="time-remaining">{formatTime(timeLeft)}</span>
                        </div>
                    )}
                </div>
                
                <p className="quiz-instructions">
                    {renderQuizTypeInstructions()}
                </p>
            </div>
            
            <div className="quiz-progress">
                <div 
                    className="progress-bar" 
                    style={{ width: `${progress}%` }}
                ></div>
                <span className="progress-text">Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            </div>
            
            <div className="question-container">
                <h3 className="question-text">{currentQuestion.question}</h3>
                
                {/* Render encoding aid for memory techniques */}
                {renderEncodingAid()}
                
                {/* Render contextual aid for contextual variation */}
                {renderContextualAid()}
                
                {currentQuestion.imageUrl && (
                    <img 
                        src={currentQuestion.imageUrl} 
                        alt="Question visual" 
                        className="question-image" 
                    />
                )}
                
                <div className="answer-options">
                    {currentQuestion.options.map((option, index) => (
                        <div 
                            key={index}
                            className={`answer-option ${selectedAnswer === option ? 'selected' : ''}`}
                            onClick={() => handleAnswerSelect(option)}
                        >
                            <div className="option-letter">
                                {String.fromCharCode(65 + index)}
                            </div>
                            <div className="option-text">{option}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="quiz-navigation">
                {currentQuestionIndex > 0 && (
                    <button 
                        onClick={handlePreviousQuestion}
                        className="prev-button"
                    >
                        <FaArrowLeft /> Previous
                    </button>
                )}
                
                {currentQuestionIndex < quiz.questions.length - 1 ? (
                    <button 
                        onClick={handleNextQuestion}
                        className="next-button"
                        disabled={!selectedAnswer}
                    >
                        Next <FaArrowRight />
                    </button>
                ) : (
                    <button 
                        onClick={handleSubmitQuiz}
                        className="next-button submit-button"
                        disabled={!selectedAnswer}
                    >
                        Submit Quiz
                    </button>
                )}
            </div>
            
            {/* Add a progress indicator showing answered/total questions */}
            <div className="quiz-completion-status">
                {allAnswers.filter(a => a).length} of {quiz.questions.length} questions answered
            </div>
        </div>
    );
};

export default QuizView;

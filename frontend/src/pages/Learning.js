// src/pages/Learning.js
import React from "react";
import "./Learning.css";
import { FaChalkboardTeacher, FaPuzzlePiece, FaGraduationCap, FaBookOpen } from "react-icons/fa";

const Learning = () => {
    const features = [
        { icon: <FaChalkboardTeacher />, title: "Expert Guidance", description: "Learn from industry experts and experienced instructors." },
        { icon: <FaPuzzlePiece />, title: "Interactive Quizzes", description: "Reinforce your learning with engaging and interactive quizzes." },
        { icon: <FaGraduationCap />, title: "Personalized Paths", description: "Tailored learning experiences to suit your unique goals." },
        { icon: <FaBookOpen />, title: "Comprehensive Resources", description: "Access a wide range of learning materials to deepen your knowledge." },
    ];

    return (
        <div className="learning-page">
            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-text">
                    <h1>Clean, Modern, Powerful - Mathemann</h1>
                    <p>
                        At Mathemann, we provide a professional and interactive platform
                        for learners worldwide. Discover tailored courses, engaging tools,
                        and expert guidance to help you achieve your goals.
                    </p>
                </div>
                <div className="hero-image">
                    <img
                        src="https://via.placeholder.com/600x400"
                        alt="Learning on Mathemann"
                    />
                </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
                {features.map((feature, index) => (
                    <div className="feature-card" key={index}>
                        <div className="feature-icon">{feature.icon}</div>
                        <h3>{feature.title}</h3>
                        <p>{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Learning;

import React from "react";
import { useNavigate } from 'react-router-dom';
import "./Home.css";
import { FaGraduationCap, FaChalkboardTeacher, FaLaptopCode } from "react-icons/fa";

const Home = () => {
    const navigate = useNavigate();
    
    return (
        <div className="home-container">
            <section className="hero">
                <div className="hero-content">
                    <h1>Welcome to Mathemann</h1>
                    <p className="tagline">Empowering students through personalized mathematics education</p>
                    <div className="cta-buttons">
                        <button 
                            onClick={() => navigate('/signup')}
                            className="cta-button primary"
                        >
                            Get Started
                        </button>
                        <button 
                            onClick={() => navigate('/learning')}
                            className="cta-button secondary"
                        >
                            Learn More
                        </button>
                    </div>
                </div>
                <div className="hero-image">
                    <img src="./ftre.jpg" alt="Math Learning" />
                </div>
            </section>
            
            <section className="features">
                <h2>Why Choose Mathemann?</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaGraduationCap />
                        </div>
                        <h3>Personalized Learning</h3>
                        <p>Content tailored to each student's age and skill level</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaChalkboardTeacher />
                        </div>
                        <h3>Expert Teachers</h3>
                        <p>Learn from professional educators with years of experience</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <FaLaptopCode />
                        </div>
                        <h3>Interactive Platform</h3>
                        <p>Engage with dynamic content and track your progress</p>
                    </div>
                </div>
            </section>
            
            <section className="how-it-works">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <div className="step-number">1</div>
                        <h3>Sign Up</h3>
                        <p>Create your account and complete your profile</p>
                    </div>
                    <div className="step">
                        <div className="step-number">2</div>
                        <h3>Get Matched</h3>
                        <p>Our system finds content perfect for your age and level</p>
                    </div>
                    <div className="step">
                        <div className="step-number">3</div>
                        <h3>Start Learning</h3>
                        <p>Begin your journey with personalized lessons</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;

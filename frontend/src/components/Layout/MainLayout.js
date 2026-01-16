import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../NavBar';
import './MainLayout.css';

const MainLayout = ({ children, isAuthenticated, userRole, userName }) => {
    const navigate = useNavigate();

    // Add console logging to help debug auth state
    useEffect(() => {
        console.log("MainLayout rendered with auth state:", { 
            isAuthenticated, 
            userRole, 
            userName 
        });
    }, [isAuthenticated, userRole, userName]);

    // Enhanced public navigation
    const PublicNav = () => (
        <nav className="main-nav">
            <div className="nav-brand">
                <Link to="/">Mathemann</Link>
            </div>
            <div className="nav-items">
                <Link to="/learning" className="nav-link">Learning</Link>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/signup" className="nav-link signup-btn">Sign Up</Link>
            </div>
        </nav>
    );

    return (
        <div className={`main-layout ${isAuthenticated ? 'authenticated' : 'public'}`}>
            {isAuthenticated ? (
                <NavBar userName={userName} userRole={userRole} />
            ) : (
                <PublicNav />
            )}
            <main className="main-content">
                {children}
            </main>
            <footer className="main-footer">
                <p>&copy; {new Date().getFullYear()} Mathemann - Professional Mathematics Learning Platform</p>
            </footer>
        </div>
    );
};

export default MainLayout;

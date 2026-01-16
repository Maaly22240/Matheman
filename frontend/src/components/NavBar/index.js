import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavBar.css';

const NavBar = ({ userName, userRole }) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        console.log("NavBar rendered with props:", { userName, userRole });
    }, [userName, userRole]);

    const handleBrandClick = () => {
        // Route to the correct dashboard based on role
        const dashboardPath = userRole === 'teacher' ? '/dashboard/teacher' : '/dashboard/student';
        navigate(dashboardPath);
    };

    const handleLogout = () => {
        console.log("Logging out...");
        try {
            // Clear all auth data
            localStorage.clear();
            sessionStorage.clear();
            
            // Force a complete page refresh to reset app state
            window.location.href = '/';
            
            console.log("Logout successful");
        } catch (error) {
            console.error("Logout error:", error);
            // Fallback if redirect fails
            navigate('/');
        }
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand" onClick={handleBrandClick}>
                <h1>Mathemann</h1>
            </div>
            <div className="profile-section">
                <div 
                    className="profile-trigger" 
                    onClick={() => setShowDropdown(!showDropdown)}
                >
                    <div className="profile-icon">
                        {userName?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="profile-name">{userName}</span>
                    <i className={`arrow ${showDropdown ? 'up' : 'down'}`}></i>
                </div>
                {showDropdown && (
                    <div className="profile-dropdown">
                        <div className="dropdown-header">
                            <strong>{userName}</strong>
                            <small>{userRole}</small>
                        </div>
                        <div className="dropdown-divider"></div>
                        <button onClick={() => navigate('/profile')}>My Profile</button>
                        <button onClick={() => navigate('/settings')}>Settings</button>
                        <div className="dropdown-divider"></div>
                        <button onClick={handleLogout} className="logout-btn">
                            Logout
                        </button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default NavBar;

const authorizeRole = (role) => {
    return (req, res, next) => {
        if (!req.user) {
            // This should ideally be handled by authenticateToken first
            return res.status(401).json({ message: 'Authentication required' });
        }
        
        if (req.user.role !== role) {
            return res.status(403).json({ message: `Access denied. Requires ${role} role.` });
        }
        
        next(); // User has the required role
    };
};

module.exports = {
    authorizeRole
}; 
const { verifyToken } = require('../services/auth.service');

// Middleware to verify JWT token and extract user info
function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authorization token required' 
      });
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }

    // Attach user info to request
    req.user = {
      id: decoded.id,
      name: decoded.name,
      role: decoded.role
    };

    next();
  } catch (error) {
    return res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: error.message
    });
  }
}

// Optional authentication - doesn't fail if no token
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') 
        ? authHeader.substring(7) 
        : authHeader;

      const decoded = verifyToken(token);
      
      if (decoded) {
        req.user = {
          id: decoded.id,
          name: decoded.name,
          role: decoded.role
        };
      }
    }

    next();
  } catch (error) {
    // Continue without user info if token is invalid
    next();
  }
}

// Check if user has specific role
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
}

module.exports = {
  authenticateUser,
  optionalAuth,
  requireRole
};

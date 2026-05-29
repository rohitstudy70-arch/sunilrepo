const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
      
      const user = await User.findOne({ id: decoded.id });
      if (!user) {
        return res.status(401).json({ error: 'User no longer exists' });
      }
      
      if (user.disabled) {
        return res.status(403).json({ error: 'Your account is disabled' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('JWT verify error:', error);
      return res.status(401).json({ error: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized, no token' });
  }
};

const checkPermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authorized' });
    }

    // Admins bypass normal permission checks or have all permissions
    if (req.user.role === 'ADMIN') {
      return next();
    }

    if (req.user.permissions && req.user.permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
  };
};

module.exports = { protect, checkPermission };

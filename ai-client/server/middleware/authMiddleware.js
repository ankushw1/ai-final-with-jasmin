const jwt = require("jsonwebtoken");

const authenticate = (roles = []) => {
  return (req, res, next) => {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Authentication required!" });
    }

    try {
      const decoded = jwt.verify(token, 'a7sdlk3');

      // Map `id` from token to `_id` for database compatibility
      req.user = { ...decoded, _id: decoded.id };

      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied!" });
      }

      next();
    } catch (error) {
      console.error("JWT Error:", error);
      res.status(500).json({ message: "Invalid token!", error });
    }
  };
};

module.exports = authenticate;
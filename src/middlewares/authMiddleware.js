import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null; // guest
    return next();
  }

  jwt.verify(token, process.env.ACCESS_KEY, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

export const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (req.user && allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ message: "Bạn không có quyền truy cập" });
  };
};

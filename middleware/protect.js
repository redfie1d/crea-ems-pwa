// Middleware to protect endpoints from unauthorised use.
const jwt = require("jsonwebtoken");
module.exports = function(req, res, next) {
  // if no token provided, return error 401: Unauthorised
  const token = req.header("x-auth-token");
  if(!token) return res.status(401).send("Access denied. No token provided");

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    req.user = decoded;

    // if verified, go to next
    next();
  } catch(e) {
    // if invalid token, return error 400: bad request
    res.status(400).send("Invalid token");
  }
}

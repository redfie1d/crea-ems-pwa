// Middleware to check if the user is an admin. If admin, allow access
module.exports = function(req, res, next) {
  // error 403: forbidden request
  if(!req.user.accountType.includes("Admin")) return res.status(403).send("Access denied. You need to be an admin.");

  // if admin, go to next
  next();
}

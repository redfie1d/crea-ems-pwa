// Middleware to check if the user is a  superadmin. If superadmin, allow access
module.exports = function(req, res, next) {
  // error 403: forbidden request
  if(req.user.accountType !== "Super Admin") return res.status(403).send("Access denied. You need to be a super admin.");

  // if super admin, go to next
  next();
}

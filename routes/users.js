/*
Originator: Hidayatullah
Date: 6 Aug 2018
Routes for user management endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const moment = require("moment");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { User, validateCreateUser, validateUserUpdate, validateAdminUpdate } = require("../models/user");

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR SUPER ADMIN TO CREATE ADMIN
router.post("/admin", protect, superadmin, async (req, res) => {
  // Validate request body fields using joi
  const { error } = validateCreateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // If account type is not selected, return error 400 bad request
  if (req.body.accountType == "") return res.status(400).send("Please select an account type");

  let emailToLowerCase = req.body.email.toLowerCase();

  // Check for existing user
  let user = await User.findOne({ email: new RegExp(emailToLowerCase, 'i') }).catch(err => res.status(400).send(err.message));

  // If user exist, return 400 bad request
  if (user) return res.status(400).send("User already exists");

  user = new User({
    name: req.body.name,
    email: emailToLowerCase,
    password: "password",
    accountType: "Admin",
    isWsg: false,
    catsExpiryDate: null,
    status: "Active",
    contactNumber: ""
  });

  // create a salt and hash password using salt
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // Save user in database
  await user.save();

  const token = user.generateAuthToken();
  return res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .status(200)
    .send("Admin created successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO CREATE USER
router.post("/user", protect, admin || superadmin, async (req, res) => {
  // Validate request body fields using joi
  const { error } = validateCreateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // If account type is not selected, return 400 bad request
  if (req.body.accountType == "") return res.status(400).send("Please select an account type");

  let emailToLowerCase = req.body.email.toLowerCase();

  // Check for existing user
  let user = await User.findOne({ email: new RegExp(emailToLowerCase, 'i') }).catch(err => res.status(400).send(err.message));

  // If user exist, return 400 bad request
  if (user) return res.status(400).send("User already exists");

  user = new User({
    name: req.body.name,
    email: req.body.email,
    password: "password",
    accountType: "Student",
    isWsg: false,
    catsExpiryDate: null,
    status: "Active",
    contactNumber: ""
  });

  // create a salt and hash password using salt
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // Save user in database
  await user.save();

  const token = user.generateAuthToken();
  return res
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .status(200)
    .send("Registration successful");
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL USERS
router.get("/", protect, admin || superadmin, async (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.status(400).send("Could not retrieve users");
    return res.status(200).send(users);
  });
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL STUDENTS
router.get("/students", protect, admin || superadmin, async (req, res) => {
  let users = await User.find({ accountType: "Student" })
    .select("-password -__v")
    .catch(err => res.status(400).send("Could not retrieve students"));

  return res.status(200).send(users);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL ADMINS
router.get("/admins", protect, admin || superadmin, async (req, res) => {
  let admins = await User.find()
    .or([{ accountType: "Admin" }, { accountType: "Super Admin" }])
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(admins);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE TO RETRIEVE A USER BY ID
router.get("/:id", protect, async (req, res) => {
  const user = await User.findById(req.params.id)
    .select("-password -__v")
    .catch(err => res.status(400).send(err.message));

  if (!user || user == undefined)
    return res.status(404).send("The user with the given ID was not found");

  return res.status(200).send(user);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER, ADMIN OR SUPERADMIN TO UPDATE HIS/HER DETAILS
router.put("/me", protect, async (req, res) => {
  // Check if input in request body is valid
  const { error } = validateUserUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if contact number contains only numbers
  let contactNumberCheck = true;

  for (i = 0; i < req.body.contactNumber.length; i++) {
    let char = req.body.contactNumber.charAt(i);

    if (isNaN(char)) {
      contactNumberCheck = false;
    }
  }

  if (!contactNumberCheck) return res.status(400).send("Please enter numbers only");

  // Retrieve user details from mongodb User collection
  let user = await User.findById({ _id: req.user.id }).catch(err =>
    res.status(400).send(err.message)
  );

  // If user does not exist, return status 404: not found
  if (!user || user == undefined) return res.status(404).send("User not found");

  // Update user's password
  if (req.body.password != "") {
    // Encrypt new password user sent in request body
    let salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
  }

  // Update user's CAT's Expiry Date
  if (req.body.catsExpiryDate != undefined) {
    if (req.body.catsExpiryDate.length > 10) {
      return res.status(400).send("Wrong date format");
    }
    user.catsExpiryDate = moment(req.body.catsExpiryDate);
  }

  // Update user's contact number
  if (req.body.contactNumber != undefined) {
    user.contactNumber = req.body.contactNumber;
  }

  await user.save();

  // create JWT
  const token = user.generateAuthToken();

  return res.status(200).send(token);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO UPDATE USER'S DETAILS
router.put("/:id", protect, admin || superadmin, async (req, res) => {
  const { error } = validateAdminUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if contact number contains only numbers
  let contactNumberCheck = true;

  for (i = 0; i < req.body.contactNumber.length; i++) {
    let char = req.body.contactNumber.charAt(i);

    if (isNaN(char)) {
      contactNumberCheck = false;
    }
  }

  if (!contactNumberCheck) return res.status(400).send("Please enter numbers only");

  // Retrieve the user that you want to update
  let user = await User.findById({ _id: req.params.id }).catch(err =>
    res.status(400).send(err.message)
  );

  // If user not found, return status 404: not found
  if (!user || user == undefined || Object.keys(user).length === 0)
    return res.status(404).send("User does not exist");

  // Update user's name
  if (req.body.name != undefined) {
    user.name = req.body.name;
  }

  // Update user's WSG
  if (req.body.isWsg != undefined) {
    user.isWsg = req.body.isWsg;
  }

  // Update user's CAT's Expiry Date
  if (req.body.catsExpiryDate != undefined) {
    if (req.body.catsExpiryDate.length > 10) {
      return res.status(400).send("Wrong date format");
    }
    user.catsExpiryDate = moment(req.body.catsExpiryDate);
  }

  // Update user's status
  if (req.body.status != undefined) {
    user.status = req.body.status;
  }

  // Update user's contact number
  if (req.body.contactNumber != undefined) {
    user.contactNumber = req.body.contactNumber;
  }

  await user.save();

  return res.status(200).send(user);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR SUPER ADMIN TO TRANSFER SUPER ADMIN RIGHTS
router.put("/transfer/:id", protect, superadmin, async (req, res) => {
  // Retrieve the admin user that you want to make super admin
  let adminUser = await User.findById({ _id: req.params.id }).catch(err =>
    res.status(400).send(err.message)
  );

  // If user not found, return status 404: not found
  if (!adminUser || adminUser == undefined) return res.status(404).send("Admin does not exist");

  // If admin select himself/herself, return status 400: bad request
  if (adminUser.accountType == "Super Admin") return res.status(400).send("Please select other admins");

  // If specified user is not an admin, return status 400: bad request
  if (adminUser.accountType != "Admin") return res.status(400).send("Specified user is not an admin");

  // Proceed with transferring super admin rights
  adminUser.accountType = "Super Admin";
  await adminUser.save();

  let user = await User.findById({ _id: req.user.id });

  user.accountType = "Admin";

  user.save();

  // create JWT
  const token = user.generateAuthToken();

  return res.status(200).send(token);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR SUPER ADMIN TO DELETE A USER
router.delete("/:id", protect, superadmin, async (req, res) => {
  // Remove user with given id
  const user = await User.deleteOne({ _id: req.params.id }).catch(err =>
    res.status(400).send(err.message)
  );

  // if user does not exist, return 404: Not Found
  if (!user || user == undefined) return res.status(404).send("User does not exist");

  return res.status(200).send("User deleted successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

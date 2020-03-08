/*
Originator: Hidayatullah
Date: 6 Aug 2018
Model for user
*/ 

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Joi = require("joi");

// Define user schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, minLength: 1, maxLength: 255 },
  email: {
    type: String,
    required: true,
    minLength: 1,
    maxLength: 255,
    unique: true
  },
  password: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 1024,
    unique: true
  },
  accountType: { type: String, required: true },
  isWsg: Boolean,
  catsExpiryDate: Date,
  status: String,
  contactNumber: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
});

// Function to generate authentication token
userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      id: this._id,
      name: this.name,
      email: this.email,
      accountType: this.accountType,
      isWsg: this.isWsg,
      catsExpiryDate: this.catsExpiryDate,
      status: this.status,
      contactNumber: this.contactNumber
    },
    process.env.SECRET_KEY
  );
  return token;
};

const User = mongoose.model("User", userSchema);

// function to validate create user using Joi
function validateCreateUser(user) {
  const schema = {
    name: Joi.string().min(1).max(255).required().label("Name"),
    email: Joi.string().min(1).max(255).required().email().label("Email"),
    accountType: Joi.string().allow("").label("Account Type")
  };
  return Joi.validate(user, schema);
}

// function to validate user updating his/her own details using Joi
function validateUserUpdate(user) {
  const schema = {
    password: Joi.string().allow(null, "").min(5).max(255).label("Password"),
    catsExpiryDate: Joi.date().allow(null).label("Cats Expiry Date"),
    contactNumber: Joi.string().allow("").min(8).max(8).label("Contact Number")
  };
  return Joi.validate(user, schema);
}

// function to validate admin updating user's details using Joi
function validateAdminUpdate(user) {
  const schema = {
    name: Joi.string().required().label("Name"),
    isWsg: Joi.boolean().label("WSG Scheme"),
    catsExpiryDate: Joi.date().allow(null).label("Cats Expiry Date"),
    status: Joi.string().label("Status"),
    contactNumber: Joi.string().allow("").min(8).max(8).label("Contact Number")
  };
  return Joi.validate(user, schema);
}

exports.User = User;
exports.validateCreateUser = validateCreateUser;
exports.validateUserUpdate = validateUserUpdate;
exports.validateAdminUpdate = validateAdminUpdate;

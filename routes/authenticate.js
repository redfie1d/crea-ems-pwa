/*
Originator: Hidayatullah
Date: 
Routes for user authentication
*/

// Require node modules
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const Joi = require("joi");

// Require models
const { User } = require("../models/user");

//--------------------------------------------------------------------------------------------------------------------------------

// Endpoint to authenticate requests for login
router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let emailToLowerCase = req.body.email.toLowerCase();

  let user = await User.findOne({ email: new RegExp(emailToLowerCase, 'i') });
  if (!user) return res.status(400).send("Invalid email/password");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email/password");

  // create JWT
  const token = user.generateAuthToken();

  res.send(token);
});

// Local function to validate request body
function validate(req) {
  const schema = {
    email: Joi.string().min(1).max(255).required().email(),
    password: Joi.string().min(5).max(255).required()
  };
  return Joi.validate(req, schema);
}

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

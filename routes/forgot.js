/*
Originator: Jun Ming
Date: 13 Aug 2018
Routes for forgot / reset password endpoints
*/

// Require node modules
var express = require("express");
var router = express.Router();
var Joi = require("joi");
var nodemailer = require("nodemailer");
var async = require("async");
var crypto = require("crypto");
const bcrypt = require("bcryptjs");

// Require models
const { User } = require("../models/user");

//-------------------------------------------------------------------------------------------------------------------------------

// Environment variables
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const SENDER_EMAIL_PW = process.env.SENDER_EMAIL_PW;

//-------------------------------------------------------------------------------------------------------------------------------

// Handle Forget Password POST
router.post("/", function(req, res) {
  // Validate email field
  const { error } = validateEmailField(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  async.waterfall([
    function(done) {
      // Generate unique token
      crypto.randomBytes(3, function(err, buf) {
        var token = buf.toString("hex").toUpperCase();
        done(err, token);
      });
    },
    function(token, done) {
      // Check if database contains user with email
      User.findOne({ email: req.body.email }, function(err, user) {
        // If no user with that email exists, respond 404 Not Found
        if (!user)
          return res
            .status(404)
            .send("No account with that email address exists.");

        // Set resetPasswordToken to expire 1 hour after user request
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        // Update database
        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: true, // use SSL
        auth: {
          user: SENDER_EMAIL,
          pass: SENDER_EMAIL_PW
        }
      });
      var mailOptions = {
        to: user.email,
        from: SENDER_EMAIL,
        subject: "CREA Password Reset",
        text:
          "You are receiving this because you (or someone else) have requested a reset password token for your account.\n\n" +
          "Please find the token to reset your password below:\n\n" +
          token +
          "\n\n" +
          "If you did not request this, please ignore this email and your password will remain unchanged.\n"
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        res
          .status(200)
          .send(
            `An e-mail has been sent to ${ user.email } with further instructions.`
          );
        done(err, "done");
      });
    }
  ]);
});

//-------------------------------------------------------------------------------------------------------------------------------

// Handle Reset Password POST
router.post("/reset/:token", function(req, res) {
  const { error } = validatePasswordField(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  async.waterfall(
    [
      function(done) {
        // Check token in URL same as resetPasswordToken in db
        User.findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() }
          },
          async function(err, user) {
            // if different token, respond 403 Forbidden Request
            if (!user)
              return res
                .status(404)
                .send("Password reset token is invalid or has expired.");

            // create a salt
            const salt = await bcrypt.genSalt(10);

            // Set new hashed password, remove resetPasswordToken and resetPasswordExpires
            user.password = await bcrypt.hash(req.body.password, salt);
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            // Update database
            user.save(function(err) {
              done(err, user);
            });
          }
        );
      },
      function(user, done) {
        var smtpTransport = nodemailer.createTransport({
          host: EMAIL_HOST,
          port: EMAIL_PORT,
          secure: true, // use SSL
          auth: {
            user: SENDER_EMAIL,
            pass: SENDER_EMAIL_PW
          }
        });
        var mailOptions = {
          to: user.email,
          from: SENDER_EMAIL,
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n"
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          res.status(200).send("Success! Your password has been changed.");
          done(err);
        });
      }
    ],
    function(err) {
      res.status(400).send(err.details[0].message);
    }
  );
});

//-------------------------------------------------------------------------------------------------------------------------------

// LOCAL FUNCTIONS

// Local function to validate forget password request body
function validateEmailField(req) {
  const schema = {
    email: Joi.string().min(1).max(255).required().email()
  };
  return Joi.validate(req, schema);
}

// Local function to validate reset password request body
function validatePasswordField(req) {
  const schema = {
    password: Joi.string().min(5).max(255).required(),
    confirmPassword: Joi.string().valid(Joi.ref("password")).required()
  };
  return Joi.validate(req, schema);
}

//-------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

/*
Originator: Jun Ming
Date: 16 Jan 2019
Routes for library duty appointments management endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
const async = require("async");
const nodemailer = require("nodemailer");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { LibraryDuty } = require("../models/libraryduty");
const { Appointment } = require("../models/appointment");

//---------- ----------------------------------------------------------------------------------------------------------------------

// Post request endpoint for user to book a library duty appointment
router.post("/:libraryDuty", protect, async (req, res) => {
  // Find library duty start and end time
  let duty = await LibraryDuty
  .findOne({_id: req.params.libraryDuty})
  .select("libraryDutyStart libraryDutyEnd");

  let libraryDutyStart = duty.libraryDutyStart;
  let libraryDutyEnd = duty.libraryDutyEnd;

  // if libraryDutyStart or libraryDutyEnd is before now
  if (moment().isAfter(libraryDutyStart) || moment().isAfter(libraryDutyEnd)) {
    return res.status(400).send("Cannot book past library duty")
  }

  // Create new meeting appointment
  appointment = new Appointment({
    user: req.user.id,
    libraryDuty: req.params.libraryDuty,
    dateCreated: Date.now(),
    status: "pending"
  });

  appointment.save()

  return res.status(200).send("Library duty appointment booked successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve all library duty appointments
router.get("/", protect, async (req, res) => {
  let appointments = await Appointment
  .find({})
  .populate({ path: 'user', select: '_id name' })
  .populate({ path: 'libraryDuty', select: '-__v', populate: {path:'location', select: '-__v'} })
  .select('-__v')
  .sort({dateCreated: "desc"})
  .catch(err => res.status(400).send(err.message));

  return res.status(200).send(appointments);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve all library duty appointments of logged-in user
router.get("/me", protect, async (req, res) => {

  let appointments = await Appointment
  .find({ user: req.user.id })
  .populate({ path: 'user', select: '_id name' })
  .populate({ path: 'libraryDuty', select: '-__v', populate: {path:'location', select: '-__v'} })
  .select('-__v')
  .sort({ dateCreated: "desc"})
  .catch(err => res.status(400).send(err.message));

  return res.status(200).send(appointments);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve the months where there are appointments
router.get("/months", protect, async (req, res) => {

  // Retrieve all months where there are library duties (limit by 12 months)
  let monthsInNumeric = await LibraryDuty.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$libraryDutyStart" },
          month: { $month: "$libraryDutyStart" }
        }
      }
    },
    {
      $sort:
      {
        "_id.year" : -1,
        "_id.month": -1
      }
    },
    { $limit : 12 }
  ]);

  let months = [];
  for (i = 0; i < monthsInNumeric.length; i++) {
    let numericMonth = monthsInNumeric[i]._id.month;
    let month = moment().month(numericMonth-1).year(monthsInNumeric[i]._id.year).format("MMM-YY").toString();
    months.push(month);
  }

  // Return an array of months (string format)
  return res.status(200).send(months);
});

 //-------------------------------------------------------------------------------------------------------------------------------

// Put request endpoint for admin to confirm a library duty appointment
router.put("/:id/admin", protect, admin || superadmin, async (req, res) => {
  // Retrieve appointment details
  let appointment = await Appointment.findOne({_id: req.params.id})
  .populate({ path: 'user', select: '-_id name email'})
  .populate({ path: 'libraryDuty', select: '-__v', populate: {path:'location', select: '-__v'} })
  .catch(err => res.status(400).send(err.message));

  if (!appointment || appointment == undefined) return res.status(404).send("Appointment does not exist");

  // Update the appointment's status to "confirmed"
  appointment.status = "confirmed";
  await appointment.save();

  // Send email to user to notify of appointment confirmation by admin
  let smtpTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // use SSL
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PW
    }
  });
  let mailOptions = {
    to: appointment.user.email,
    from: process.env.SENDER_EMAIL,
    subject: "CREA EMS | Library Duty Appointment Notification",
    text:
      `Dear ${appointment.user.name},\n\n` +
      `This is a notification email to inform you that the following library duty appointment was confirmed by ${req.user.name}.\n\n` +
      `Location: ${appointment.libraryDuty.location.locationName}\n` +
      `Library duty start: ${moment(appointment.libraryDuty.libraryDutyStart).format('LLLL')}\n` +
      `Library duty end: ${moment(appointment.libraryDuty.libraryDutyEnd).format('LLLL')}\n` +
      `Date booked: ${moment(appointment.dateCreated).format('LLLL')}\n\n` +
      "Please note that you cannot cancel appointments 3 days before the library duty start time.\n" +
      "Similarly, the administrator cannot cancel appointments 3 days before the library duty start time.\n\n\n\n" +
      "This is a computer generated email. Please do not reply to this email address."
  };
  smtpTransport.sendMail(mailOptions, function(err) {
    res.status(200).send(`Notification email sent to ${appointment.user.email}`);
    done(err, "done");
  });

});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint for user to cancel a libary duty appointment
router.delete("/:id", protect, async (req, res) => {
  // Retrieve the library duty id of this appointment
  let appointment = await Appointment
  .findOne({ _id: req.params.id })
  .populate({ path: 'libraryDuty', select: 'libraryDutyStart libraryDutyEnd'})
  .catch(err => res.status(400).send(err.message));;

  // If library duty appointment does not exist, return 404: Not Found
  if (!appointment || appointment === undefined) return res.status(404).send("Library duty appointment does not exist");

  let libraryDutyStart = appointment.libraryDuty.libraryDutyStart;
  let libraryDutyEnd = appointment.libraryDuty.libraryDutyEnd;

  // if libraryDutyStart or libraryDutyEnd is before now
  if (moment().isAfter(libraryDutyStart) || moment().isAfter(libraryDutyEnd)) {
    return res.status(400).send("Cannot cancel past library duty")
  }

  let differenceInDaysFromNow = moment(libraryDutyStart).diff(moment(), 'hours');

  // if libraryDutyStart is in the future and its starting time is less than 3 days from now
  if (moment().isBefore(libraryDutyStart) && differenceInDaysFromNow < 72) {
    return res.status(400).send("Cannot cancel library duty appointment 3 days from now");
  }

  // Remove library duty appointment with given id
  await Appointment.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  return res.status(200).send("Library duty appointment cancelled");

});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint for admin to reject a library duty appointment
router.delete("/:id/admin", protect, admin || superadmin, async (req, res) => {

  let remarks = "";
  if (req.body.remarks != undefined) remarks = `"${String(req.body.remarks)}"`;

  // Retrieve appointment details
  let appointment = await Appointment.findOne({_id: req.params.id})
  .populate({ path: 'user', select: '-_id name email'})
  .populate({ path: 'libraryDuty', select: '-__v', populate: {path:'location', select: '-__v'} })
  .catch(err => res.status(400).send(err.message));

  // If library duty appointment does not exist, return 404: Not Found
  if (!appointment || appointment === undefined) return res.status(404).send("Library duty appointment does not exist");

  let libraryDutyStart = appointment.libraryDuty.libraryDutyStart;
  let libraryDutyEnd = appointment.libraryDuty.libraryDutyEnd;

  // if libraryDutyStart or libraryDutyEnd is before now
  if (moment().isAfter(libraryDutyStart) || moment().isAfter(libraryDutyEnd)) {
    return res.status(400).send("Cannot reject past appointment")
  }

  let differenceInDaysFromNow = moment(libraryDutyStart).diff(moment(), 'hours');

  // if libraryDutyStart is in the future and its starting time is less than 3 days from now
  if (moment().isBefore(libraryDutyStart) && differenceInDaysFromNow < 72) {
    return res.status(400).send("Cannot cancel library duty appointment 3 days from now");
  }

  // Remove library duty appointment with given id
  await Appointment.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  // Send email to user to notify of appointment deletion by admin
  let smtpTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // use SSL
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PW
    }
  });
  let mailOptions = {
    to: appointment.user.email,
    from: process.env.SENDER_EMAIL,
    subject: "CREA EMS | Library Duty Appointment Notification",
    text:
      `Dear ${appointment.user.name},\n\n` +
      `This is a notification email to inform you that the following library duty appointment was cancelled by ${req.user.name}.\n\n` +
      `Location: ${appointment.libraryDuty.location.locationName}\n` +
      `Library duty start: ${moment(appointment.libraryDuty.libraryDutyStart).format('LLLL')}\n` +
      `Library duty end: ${moment(appointment.libraryDuty.libraryDutyEnd).format('LLLL')}\n` +
      `Date booked: ${moment(appointment.dateCreated).format('LLLL')}\n` +
      `Remarks: ${remarks}\n\n` +
      "Please note that the administrator cannot cancel appointments 3 days before the library duty start time.\n\n\n\n" +
      "This is a computer generated email. Please do not reply to this email address."
  };
  smtpTransport.sendMail(mailOptions, function(err) {
    res.status(200).send(`Notification email sent to ${appointment.user.email}`);
    done(err, "done");
  });

});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

/*
Originator: Jun Ming
Date: 13 Jan 2019
Routes for library duty management endpoints
*/


// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { LibraryDuty, validateCreateLibraryDuty } = require("../models/libraryduty");
const { Appointment } = require("../models/appointment")

//--------------------------------------------------------------------------------------------------------------------------------

// Post request endpoint to create a library duty
router.post("/:location", protect, admin || superadmin, async (req, res) => {

  // if error, return 400: bad request
  const { error } = validateCreateLibraryDuty(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let dutyStart = moment(req.body.inputDate + ' ' + req.body.from).format();
  let dutyEnd = moment(req.body.inputDate + ' ' + req.body.to).format();

  if (moment().isAfter(dutyStart)) {
    return res.status(400).send("Date / Start Time cannot be in the past");
  } else if (dutyStart > dutyEnd) {
    return res.status(400).send("Start Time cannot be after End Time");
  } else if (dutyStart == dutyEnd) {
    return res.status(400).send("Start Time cannot be the same as End Time");
  } else {
    // Create new library duty
    libraryDuty = new LibraryDuty({
      location: req.params.location,
      libraryDutyStart: dutyStart,
      libraryDutyEnd: dutyEnd
    });

    // Save in mongodb
    libraryDuty.save();

    return res.status(200).send("Library duty created successfully.");
  }

});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve all library duties
router.get("/", protect, async (req, res) => {
  let libraryDuties = await LibraryDuty
  .find({})
  .populate({ path:"location", select:"locationName address postalCode" })
  .sort({libraryDutyStart: "desc"})
  .select('-__v')
  .catch(err => res.status(400).send(err.message));

  return res.status(200).send(libraryDuties);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve the months where there are library duties
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
  // Convert numerical months to name months
  for (i = 0; i < monthsInNumeric.length; i++) {
    let numericMonth = monthsInNumeric[i]._id.month;
    let month = moment().month(numericMonth-1).year(monthsInNumeric[i]._id.year).format("MMM-YY").toString();
    months.push(month);
  }

  // Return an array of months (string format)
  return res.status(200).send(months);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint to delete a library duty
router.delete("/:id", protect, admin || superadmin, async (req, res) => {
  // First, delete all appointments booked using this library duty
  await Appointment.deleteMany({ libraryDuty: req.params.id }).catch(err => res.status(400).send(err.message));

  // Remove library duty with given id
  await LibraryDuty.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  return res.status(200).send("Library duty deleted successfully.");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

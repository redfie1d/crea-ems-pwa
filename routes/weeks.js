/*
Originator: Hidayatullah
Date: 9 Oct 2018
Routes for weeks schedule management endpoints
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
const { Week, validateCreateWeek } = require("../models/week");
const { Booking } = require("../models/booking");

//-------------------------------------------------------------------------------------------------------------------------------

// Post request endpoint to create a new week
router.post("/", protect,  admin || superadmin, async (req, res) => {
  const { error } = validateCreateWeek(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  var hasDuplicate = await validateDuplicates(req.body);
  if (hasDuplicate) return res.status(400).send("There is an overlap in shift week dates");

  let fromDate = moment(req.body.fromDate).format();
  let toDate = moment(req.body.toDate).format();
  let bookingDeadline = moment(req.body.bookingDeadline).format();

  // Validations for fromDate, toDate & bookingDeadline
  if (moment().isAfter(fromDate)) {
    return res.status(400).send("Date selected cannot be a past date");
  } else if (fromDate > toDate) {
    return res.status(400).send("Start Time cannot be after End Time");
  } else if (bookingDeadline > toDate) {
    return res.status(400).send("Deadline cannot be after the last working day of the week");
  } else if (moment().isAfter(bookingDeadline)) {
    return res.status(400).send("Deadline cannot be in the past")
  }

  let first = moment(req.body.fromDate).format("DD/MM/YYYY");
  let second = moment(req.body.toDate).format("DD/MM/YYYY");
  let string = first + "-" + second;

  week = new Week({
    creator: req.user.id,
    fromDate: fromDate,
    toDate: toDate,
    bookingDeadline: bookingDeadline,
    workingDays: req.body.workingDays,
    string: string,
    dateCreated: Date.now()
  });

  // Save the week object into the database
  await week.save();
  return res.status(200).send("Shift booking week created successfully");
});

//-------------------------------------------------------------------------------------------------------------------------------

// Get request for all shift booking weeks
router.get("/", protect, async (req, res) => {
  Week.find({}, function(err, weeks) {
    if (err)
      return res.status(400).send("Could not retrieve shift booking weeks");
    res.status(200).json(weeks);
  })
  .sort({fromDate: "desc"});
});

//-------------------------------------------------------------------------------------------------------------------------------

// Get request for weeks (descending date created and limited to 10)
router.get("/sort", protect, async (req, res) => {
  const weeks = await Week
    .find({})
    .sort({fromDate: "desc"})
    .limit(10)

  return res.status(200).send(weeks);
});

//-------------------------------------------------------------------------------------------------------------------------------

// Get request for week by id
router.get("/:id/week", protect, async (req, res) => {
  const week = await Week.find({ _id: req.params.id });

  return res.status(200).send(week);
});

//-------------------------------------------------------------------------------------------------------------------------------

// route to retrieve current and previous months weeks
router.get("/prev/byMonth", protect, async(req, res) => {
  // get start of previous month
  let fromDate = moment().subtract(1, "month").startOf("month");

  // get current time
  let toDate = moment();

  // get weeks between dateFrom and dateTo
  let weeks = await Week.find({
    $or: [
      { fromDate: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() }},
      { toDate: { $gte: fromDate.toISOString(), $lte: toDate.toISOString() }}
    ]})
    .sort({ fromDate: "desc" })
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(weeks);
});

//-------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint to delete shift booking week
router.delete("/:id", protect, admin, async (req, res) => {
  // Delete all shift bookings associated with this week object
  await Booking.deleteMany({ week: req.params.id });

  // Delete week object
  let week = await Week.deleteOne({ _id: req.params.id });

  // If no documents deleted
  if (week.n === 0) return res.status(404).send("Shift booking week does not exist");

  return res.status(200).send("Shift booking week deleted");
});

//-------------------------------------------------------------------------------------------------------------------------------

// Helper functions
async function validateDuplicates(request) {
  var fromDate = moment(request.fromDate).format();
  var toDate = moment(request.toDate).format();
  var bookingDeadline = moment(request.bookingDeadline);
  var weeks = await Week.find();
  var flag = false;
  weeks.forEach(week => {
    var existingFrom = moment(week.fromDate).format();
    var existingTo = moment(week.toDate).format();
    if (fromDate > existingFrom && fromDate < existingTo) {
      flag = true;
    } else if (fromDate <= existingFrom && toDate >= existingTo) {
      flag = true;
    } else if (toDate > existingFrom && toDate < existingTo) {
      flag = true;
    }
  });
  return flag;
}

//-------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

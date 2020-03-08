/*
Originator: Nathan
Date: 11 Oct 2018
Routes for timesheet records management endpoints
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
const { Record, validateRecordInput, validateRecordUpdate } = require("../models/record");
const { User } = require("../models/user");

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO CREATE A NEW TIMESHEET RECORD
router.post("/", protect, async (req, res) => {

  // Validate request body
  const { error } = validateRecordInput(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // If shift type is not selected, return 400 bad request
  if (req.body.shiftType == "") return res.status(400).send("Please select a shift type.");

  // Format record date and time
  let recordStart = moment(req.body.date + ' ' + req.body.startTime);
  let recordEnd = moment(req.body.date + ' ' + req.body.endTime);

  // Date and time validations
  if (moment().isBefore(recordStart) || moment().isBefore(recordEnd)) {
    return res.status(400).send("Date selected must be a past date");
  } else if (recordStart > recordEnd) {
    return res.status(400).send("Start Time cannot be after End Time");
  } else if (recordStart == recordEnd) {
    return res.status(400).send("Start Time cannot be the same as End Time");
  } else {
    // Calculate duration of timesheet record
    let duration = moment.duration(recordEnd.diff(recordStart)).as("hours");

    // Create new timesheet record
    record = new Record({
      user: req.user.id,
      recordStart: recordStart,
      recordEnd: recordEnd,
      recordType: req.body.shiftType,
      duration: duration,
      review: "open"
    });

    // Save in mongodb
    await record.save();

    return res.status(200).send("Timesheet record created successfully.");
  }

});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO RETRIEVE ALL TIMESHEET RECORDS
router.get("/", protect, async (req, res) => {
  let records = await Record.find({ user: req.user.id})
  .select("-__v")
  .sort({ recordStart: "desc" })
  .catch(err => res.status(400).send(err.message));

  return res.status(200).send(records);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO RETRIEVE MONTHS WHERE THERE ARE TIMESHEET RECORDS
router.get("/months", protect, async (req, res) => {

  // Retrieve all months where there are timesheet records (limit by 12 months)
  let monthsInNumeric = await Record.aggregate([
    {
      $group: {
        _id: {
          year: { $year: "$recordStart" },
          month: { $month: "$recordStart" }
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

// ROUTE FOR USER TO RETRIEVE ALL RECORDS AGGREGATED MONTHLY
router.get("/monthly", protect, async (req, res) => {
  let records = await Record.aggregate([
    { $project: {
      user:1,recordStart:1,recordEnd:1,recordType:1,duration:1,review:1,
      month: { $month: "$recordStart" },
      year: { $year: "$recordStart" }}
    },
    { $sort: { recordStart: 1 }
  }]);

  var result = {};
  var groupings = [];
  records.forEach(record => {
    let month = getMonth(record.month);
    let year = record.year;
    let date = month + " " + year;
    let test = result[date];
    let array = [];
    if(!test) {
      array.push(record);
    } else {
      array = result[date];
      array.push(record);
    }
    result[date] = array;
  });

  return res.status(200).send(result);
});

function getMonth(id) {
  let result = "";
  switch(id) {
    case 1:
      result = "January";
      break;
    case 2:
      result = "February";
      break;
    case 3:
      result = "March";
      break;
    case 4:
      result = "April";
      break;
    case 5:
      result = "May";
      break;
    case 6:
      result = "June";
      break;
    case 7:
      result = "July";
      break;
    case 8:
      result = "August";
      break;
    case 9:
      result = "September";
      break;
    case 10:
      result = "October";
      break;
    case 11:
      result = "November";
      break;
    case 12:
      result = "December";
      break;
  }
  return result;
}

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO RETRIEVE TIMESHEET RECORDS BY RECORD ID
router.get("/:id", protect, async (req, res) => {
  let record = await Record.findOne({ _id: req.params.id })
  .catch(err => res.status(400).send(err.message));

  let recordObj = {};
  recordObj["date"] = moment(record.recordStart).format("YYYY-MM-DD");
  recordObj["startTime"] = moment(record.recordStart).format("HH:mm");
  recordObj["endTime"] = moment(record.recordEnd).format("HH:mm");
  recordObj["shiftType"] = record.recordType;

  return res.status(200).send(recordObj);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN TO RETRIEVE TIMESHEET RECORDS BY USER ID
router.get("/user/:user/admin", protect, admin || superadmin, async (req, res) => {
  let records = await Record.find({ user: req.params.user })
  .sort({ recordStart: "desc" })
  .catch(err => res.status(400).send(err.message));

  if (!records || records == undefined || records.length == 0)
    return res.status(404).send("Records not found.");
  return res.status(200).send(records);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO GET USERS WITH OPEN RECORDS
router.get("/open/records", protect, admin || superadmin, async (req, res) => {
  let userIds = await Record.aggregate([
    { $match: { review: "open" }},
    { $group: {
      _id: "$user"
    }}
  ]);

  let users = await User.find({ _id: { $in: userIds }})
    .select("-__v -password")
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(users);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO GET USERS WITH RECORDS BASED ON STATUS
router.get("/userWithStatus/:id/:status", protect, admin || superadmin, async (req, res) => {
  let user = await User.findOne({ _id: req.params.id })
    .catch(err => res.status(400).send(err.message));

  if(!user) return res.status(404).send("User does not exist");

  let records = await Record.find({ user: req.params.id, review: req.params.status })
    .populate("user")
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(records);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO UPDATE A TIMESHEET RECORD
router.put("/:id", protect, async (req, res) => {
  const { error } = validateRecordUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Format request body date and time
  let recordStart = moment(req.body.date + ' ' + req.body.startTime);
  let recordEnd = moment(req.body.date + ' ' + req.body.endTime);

  // Date validation
  if (moment().isBefore(recordStart) || moment().isBefore(recordEnd)) {
    return res.status(400).send("Date selected must be a past date");
  }

  // Time validation
  if (recordStart > recordEnd) {
    return res.status(400).send("Start Time cannot be after End Time");
  }

  if (recordStart == recordEnd) {
    return res.status(400).send("Start Time cannot be the same as End Time");
  }

  // If all validations passes, find and update existing record
  let record = await Record.findOne({ _id: req.params.id });

  record.recordStart = recordStart;
  record.recordEnd = recordEnd;
  record.recordType = req.body.shiftType;

  await record.save();

  return res.status(200).send("Timesheet record updated successfully.");

});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO DELETE A TIMESHEET RECORD
router.delete("/:id", protect, async (req, res) => {
  let record = await Record.findOne({ _id: req.params.id }).select("review");

  if (record.review === "completed") return res.status(400).send("Cannot delete computed timesheet record.");

  // Remove timesheet record with given id
  record = await Record.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  // if timesheet record does not exist, return 404: Not Found
  if (record.n == 0) {
    return res.status(404).send("Fail to delete timesheet record.");
  }

  return res.status(200).send("Timesheet record deleted successfully.");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

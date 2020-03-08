/*
Originator: Hidayatullah
Date: 25 Feb 2019
Routes for super admin to edit configurations
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
const csv = require("fast-csv");
const fs = require("fs");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { Config, validateConfig } = require("../models/config");
const { User } = require("../models/user");
const { Week } = require("../models/week");
const { Booking, validateExportRequest } = require("../models/booking");
const { AdhocDuty  } = require("../models/adhocDuty");
const { Location } = require("../models/location");
const { LibraryDuty } = require("../models/libraryduty");
const { Appointment } = require("../models/appointment");
const { CallLog } = require("../models/calllog");

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint for super admin to get all configurations
router.get("/", protect, async(req, res) => {
  let config = await Config
  .findOne({})
  .select("-__v -_id").catch(err => res.status(400).send(err.message));

  return res.status(200).send(config);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint for super admin to export and clear shift bookings by week schedule
router.get("/weeks/:startDate/:endDate", protect, superadmin, async(req, res) => {
  // Validate request parameters
  const { error } = validateExportRequest(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startDate & endDate
  let startDate = moment(req.params.startDate, "YYYY-MM-DD").startOf('days');
  let endDate = moment(req.params.endDate, "YYYY-MM-DD").endOf('days');

  // If startDate is after endDate, return 400 bad request
  if (startDate.isAfter(endDate)) {
    return res.status(400).send("End Date cannot be before Start Date");
  }

  // If startDate is not a monday & endDate is not a sunday
  if (startDate.day() != 1 || endDate.day() != 0) {
    return res.status(400).send("Start Date must be a Monday / End Date must be a Sunday");
  }

  // Get weeks from start to end date
  let weeks = await Week.find({
    fromDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    toDate: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  }).select("_id");

  if (weeks.length == 0) return res.status(400).send("Week(s) does not exist");

  // 1. Export out shift bookings
  let bookings = await Booking.find({
    bookingStart: {  $gte: startDate.toDate(), $lte: endDate.toDate() },
    bookingEnd: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  }).sort({ bookingStart: -1 });

  // Populate user & week
  bookings = await User.populate(bookings, { path: "user", select: "name -_id"});
  bookings = await Week.populate(bookings, { path: "week", select: "string"});

  // Continue with exporting bookings as a csv file
  csv.writeToPath(`weekExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`, bookings, {
    headers: true,
    transform: function(row){
      return {
        "Student Assistant": row.user.name,
        "Week": row.week.string,
        "Date": moment(row.bookingStart).format("DD/MM/YYYY"),
        "Start Time": moment(row.bookingStart).format("HH:mm"),
        "End Time": moment(row.bookingEnd).format("HH:mm"),
        "Duration (hrs)": row.duration
      };

    }
  })
  .on("finish", async function() {
    res.set('Content-Type', 'text/csv');
    res.status(200).download(`weekExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`);

    // Remove temp csv file created in local directory
    await setTimeout(() => {
      fs.unlink(`weekExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`, (error) => {
      if (error) {
        throw error;
      }
    });
    }, 1000)
  });

  // 2. Clear relevant collections
  // Clear adhoc duties
  await AdhocDuty.deleteMany({
    startTime: {  $gte: startDate.toDate(), $lte: endDate.toDate() },
    endTime: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  });
  // Clear shift bookings
  await Booking.deleteMany({
    bookingStart: {  $gte: startDate.toDate(), $lte: endDate.toDate() },
    bookingEnd: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  });
  // Clear weeks
  await Week.deleteMany({
    fromDate: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    toDate: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint for super admin to export and clear library duties by date range
router.get("/library/:startDate/:endDate", protect, superadmin, async(req, res) => {
  // Validate request parameters
  const { error } = validateExportRequest(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startDate & endDate
  let startDate = moment(req.params.startDate, "YYYY-MM-DD").startOf('days');
  let endDate = moment(req.params.endDate, "YYYY-MM-DD").endOf('days');

  // If startDate is after endDate, return 400 bad request
  if (startDate.isAfter(endDate)) {
    return res.status(400).send("End Date cannot be before Start Date");
  }

  // Get all library duties in this data range
  let libraryDuties = await LibraryDuty.find({
    libraryDutyStart: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    libraryDutyEnd: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  }).select("_id");

  if (libraryDuties.length == 0) return res.status(400).send("Library Dutie(s) does not exist");

  // 1. Export library duty appointments from start to end date
  let appointments = await LibraryDuty.aggregate([
    {
      $match: {
        libraryDutyStart: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        libraryDutyEnd: { $gte: startDate.toDate(), $lte: endDate.toDate() },
      }
    },
    {
      $lookup:
      {
        from: "appointments",
        localField: "_id",
        foreignField: "libraryDuty",
        as: "appointment"
      }
    },
    {
      $unwind: "$appointment"
    },
    {
      $sort: { "libraryDutyStart": -1 }
    }
  ]);

  appointments = await Location.populate(appointments, { path: "location", select: "locationName -_id"});
  appointments = await User.populate(appointments, { path: "appointment.user", select: "name -_id"});

  // Continue with exporting library duty appointments as a csv file
  csv.writeToPath(`libraryDutyExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`, appointments, {
    headers: true,
    transform: function(row){
      return {
        "Student Assistant": row.appointment.user.name,
        "Library Duty Location": row.location.locationName,
        "Library Duty Date": moment(row.libraryDutyStart).format("DD/MM/YYYY"),
        "Library Duty Start Time": moment(row.libraryDutyStart).format("HH:mm"),
        "Library Duty End Time": moment(row.libraryDutyEnd).format("HH:mm")
      };

    }
  })
  .on("finish", async function() {
    res.set('Content-Type', 'text/csv');
    res.status(200).download(`libraryDutyExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`);

    // Remove temp csv file created in local directory
    await setTimeout(() => {
      fs.unlink(`libraryDutyExport_${startDate.format("DDMMYY")}_${endDate.format("DDMMYY")}.csv`, (error) => {
      if (error) {
        throw error;
      }
    });
    }, 1000)
  });

  // 2. Clear relevant collections
  // For each library duty, delete any associated appointments
  for (var libraryDuty of libraryDuties) {
    await Appointment.deleteMany({ libraryDuty: libraryDuty._id })
  }
  // Clear library duties
  await LibraryDuty.deleteMany({
    libraryDutyStart: { $gte: startDate.toDate(), $lte: endDate.toDate() },
    libraryDutyEnd: {  $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint for super admin to export and delete a user
router.get("/user/:userId", protect, superadmin, async (req, res) => {
  let user = await User.findOne({ _id: req.params.userId }).select("accountType");

  if (!user || user == undefined) return res.status(400).send("User does not exist");

  // If user is super admin
  if (user.accountType == "Super Admin") return res.status(400).send("Cannot delete super admin");

  // If user is admin
  if (user.accountType == "Admin") {
    await User.deleteOne({ _id: req.params.userId });
    return res.status(200).send("Admin deleted");
  }

  // 1. Export out user's shift bookings
  let bookings = await Booking.find({ user: req.params.userId }).sort({ bookingStart: -1 });

  // Populate user & week
  bookings = await User.populate(bookings, { path: "user", select: "name -_id"});
  bookings = await Week.populate(bookings, { path: "week", select: "string"});

  // Continue with exporting bookings as a csv file
  csv.writeToPath("userExport.csv", bookings, {
    headers: true,
    transform: function(row){
      return {
        "Student Assistant": row.user.name,
        "Week": row.week.string,
        "Date": moment(row.bookingStart).format("DD/MM/YYYY"),
        "Start Time": moment(row.bookingStart).format("HH:mm"),
        "End Time": moment(row.bookingEnd).format("HH:mm"),
        "Duration (hrs)": row.duration
      };

    }
  })
  .on("finish", async function() {
    res.set('Content-Type', 'text/csv');
    res.status(200).download("userExport.csv");

    // Remove temp csv file created in local directory
    await setTimeout(() => {
      fs.unlink("userExport.csv", (error) => {
      if (error) {
        throw error;
      }
    });
    }, 1000)
  });

  // 2. Clear relevant collections
  // Clear appointments
  await Appointment.deleteMany({ user: req.params.userId });
  // Clear adhoc duties
  await AdhocDuty.deleteMany({ user: req.params.userId });
  // Clear shift bookings
  await Booking.deleteMany({ user: req.params.userId });
  // Clear user
  await User.deleteOne({ _id: req.params.userId });
});

//--------------------------------------------------------------------------------------------------------------------------------

// Put request endpoint for super admin to update all configurations
router.put("/", protect, superadmin, async(req, res) => {

  // Validate config request body
  const { error } = validateConfig(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  if (req.body.unsuccessfulCases.length < 1) {
    return res.status(400).send("Must contain at least one call type");
  }

  let config = await Config.findOne({}).catch(err => res.status(400).send(err.message));

  if (req.body.noOfWorkStations > 15) return res.status(400).send("Maximum number of workstations is 15");

  config.kpi = req.body.kpi;
  config.unsuccessfulCases = req.body.unsuccessfulCases;
  config.minHoursPerWeek = req.body.minHoursPerWeek;
  config.maxHoursPerDay = req.body.maxHoursPerDay;
  config.noOfWorkStations = req.body.noOfWorkStations;
  config.creaAddress = req.body.creaAddress;
  config.maxDistanceFromCrea = req.body.maxDistanceFromCrea;

  await config.save();

  return res.status(200).send("Configurations updated successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint to clear call logs by date range specified
router.delete("/calls/:startDate/:endDate", protect, superadmin || admin, async(req, res) => {
  // Validate request parameters
  const { error } = validateExportRequest(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startDate & endDate
  let startDate = moment(req.params.startDate, "YYYY-MM-DD").startOf('days');
  let endDate = moment(req.params.endDate, "YYYY-MM-DD").endOf('days');

  // If startDate is after endDate, return 400 bad request
  if (startDate.isAfter(endDate)) {
    return res.status(400).send("End Date cannot be before Start Date");
  }

  // Clear call logs from startDate to endDate
  // Clear library duties
  let deleteResult = await CallLog.deleteMany({
    createdDate: { $gte: startDate.toDate(), $lte: endDate.toDate() }
  });

  if (deleteResult.n == 0) return res.status(400).send("Call log(s) does not exist");

  return res.status(200).send(`Call log(s) from ${startDate.format("DD/MM/YYYY")} to ${endDate.format("DD/MM/YYYY")} deleted successfully`);
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

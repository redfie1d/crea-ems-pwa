/*
Originator: Jun Ming
Date: 25 Jan 2019
Routes for export pdf / csv endpoints
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
const { User } = require("../models/user");
const { Week } = require("../models/week");
const { Booking, validateExportRequest } = require("../models/booking");
const { CallLog } = require("../models/calllog");

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to get computed bookings in a date range
router.get("/pdf/:startDate/:endDate", protect, admin || superadmin, async (req,res) => {

  // Validate request parameters
  const { error } = validateExportRequest(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startDate & endDate
  let startDate = moment(req.params.startDate, "YYYY-MM-DD").startOf('days');
  let endDate = moment(req.params.endDate, "YYYY-MM-DD").endOf('days');

  // If startDate is after endDate, return 400 bad request
  if (startDate.isAfter(endDate)) {
    return res.status(400).send("End date must be after start date");
  }

  let computedBookings = await Booking.aggregate([
    {
      $match: {
        isComputed: true,
        bookingStart: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        bookingEnd: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      }
    },
    {
      $unwind: "$split"
    },
    {
      $sort: { "split.startTime": 1 }
    },
    {
      $group: {
        _id: "$user",
        split: {
          $push: "$split"
        },
        successfulCalls: {
          $sum: { $size: "$split.successfulLogs"}
        },
        unSuccessfulCalls: {
          $sum: "$split.numUnsuccessfulLogs"
        }
      }
    },
    {
      $project: {
        _id: 0,
        user: "$_id",
        split: 1,
        successfulCalls: 1,
        unSuccessfulCalls: 1,
        totalCalls: { $add : [ '$successfulCalls', '$unSuccessfulCalls' ] }
      }
    }
  ]);

  // Populate user and call log ids
  computedBookings = await User.populate(computedBookings, { path: "user", select: "name" });
  computeBookings = await CallLog.populate(computedBookings, { path: "split.successfulLogs", select: "respondentId -_id" });

  // Convert successfulLogs & successType into concatenated strings
  for (i = 0; i < computedBookings.length; i++) {
    let splitArray = computedBookings[i].split;

    for (j = 0; j < splitArray.length; j++) {
      let splitObj = splitArray[j];
      let respondIdString = "";
      let successTypeString = "";

      for (k = 0; k < splitObj.successfulLogs.length; k++) {
        if (k == splitObj.successfulLogs.length - 1) {
          respondIdString += splitObj.successfulLogs[k].respondentId.toString();
        } else {
          respondIdString += splitObj.successfulLogs[k].respondentId.toString() + ", ";
        }
      }

      for (l = 0; l < splitObj.successType.length; l++) {
        if (l == splitObj.successType.length - 1) {
          successTypeString += splitObj.successType[l].toString();
        } else {
          successTypeString += splitObj.successType[l].toString() + ", ";
        }
      }

      splitObj["successfulLogsString"] = respondIdString;
      splitObj["successTypeString"] = successTypeString;
      delete splitObj.successfulLogs;
      delete splitObj.successType;
    }
  }

  function compare(a,b) {
    if (a.user.name < b.user.name)
      return -1;
    if (a.user.name > b.user.name)
      return 1;
    return 0;
  }

  // Sort by ascending name
  computedBookings.sort(compare);

  return res.status(200).send(computedBookings);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to export shift bookings as csv by date range
router.get("/csv/:startDate/:endDate", protect, admin || superadmin, async (req,res) => {

  // Validate request parameters
  const { error } = validateExportRequest(req.params);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startDate & endDate
  let startDate = moment(req.params.startDate, "YYYY-MM-DD").startOf('days');
  let endDate = moment(req.params.endDate, "YYYY-MM-DD").endOf('days');

  // If startDate is after endDate, return 400 bad request
  if (startDate.isAfter(endDate)) {
    return res.status(400).send("End date must be after start date");
  }

  let bookings = await Booking.aggregate([
    {
      $match: {
        bookingStart: { $gte: startDate.toDate(), $lte: endDate.toDate() },
        bookingEnd: { $gte: startDate.toDate(), $lte: endDate.toDate() }
      }
    },
    {
      $sort: { "bookingStart": 1 }
    },
    {
      $group: {
        _id: "$user",
        bookings: { $push : "$$ROOT" }
      }
    },
    {
      $project: {
        _id: 0,
        user: "$_id",
        bookings: 1
      }
    }
  ]);

  // If bookings does not exist, return 400 bad request
  if (bookings.length == 0) {
    return res.status(400).send("Shift bookings does not exist");
  }

  // Populate user & week
  bookings = await User.populate(bookings, { path: "user", select: "name -_id"});
  bookings = await User.populate(bookings, { path: "bookings.user", select: "name -_id"});
  bookings = await Week.populate(bookings, { path: "bookings.week", select: "string -_id"});

  function compare(a,b) {
    if (a.user.name < b.user.name)
      return -1;
    if (a.user.name > b.user.name)
      return 1;
    return 0;
  }

  // Sort by ascending name
  bookings.sort(compare);

  let sortedBookings = [];
  bookings.forEach((user) => {
    user.bookings.forEach((booking) => {
      sortedBookings.push(booking);
    })
  });

  // Continue with exporting bookings as a csv file
  csv.writeToPath("export.csv", sortedBookings, {
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
   .on("finish", async function(){
     res.set('Content-Type', 'text/csv');
     res.status(200).download("export.csv");

     // Remove export.csv file created in local directory
     await setTimeout(() => {
       fs.unlink('export.csv', (error) => {
        if (error) {
         throw error;
        }
      });
     }, 1000)
   });

});

module.exports = router;

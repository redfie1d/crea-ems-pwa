/*
Originator: Jun Ming
Date: 27 Oct 2018
Routes for call logs upload endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment");
const csv = require("fast-csv");
const async = require("async");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { Config } = require("../models/config");
const { CallLog } = require("../models/calllog");
const { User } = require("../models/user");

//--------------------------------------------------------------------------------------------------------------------------------

// POST REQUEST ENDPOINT FOR ADMIN TO UPLOAD CALL LOGS
router.post("/", protect, admin || superadmin, async (req,res) => {

  if (!req.files || req.files.file == undefined) return res.status(400).send("No files were uploaded.");

  var callLogFile = req.files.file;

  // To get file name
  let fileName = callLogFile.name.toString();
  // Split string by - and . using regex
  let arr = fileName.split(/[-|.]+/);

  if (!arr[arr.length-1].includes("csv")) return res.status(400).send("Require file in csv format.");


  let originalHeaders = ["Created By", "Updated By", "Respondent ID", "Wave", "Contact List", "Contact List Type", "Mode of Contact",
  "Case Type", "Follow Up", "Status", "Created Date"];
  let newHeaders = ["createdBy", "updatedBy", "respondentId", "wave", "contactList", "contactListByCall", "modeOfContact",
  "caseType", "followUp", "status", "createdDate"];

  // Validate column headers
  let correctColumnHeaders = await validateColumnHeaders(callLogFile, originalHeaders).catch(err => res.status(400).send(err.message));

  if (correctColumnHeaders) {
    // Clear existing similar call logs if any
    let monthCheckComplete = await clearExistingCallLogs(callLogFile, newHeaders);

    // Upload all call logs from this csv file to mongodb
    if (monthCheckComplete) {
      uploadCallLogs(callLogFile, newHeaders, res);
    }
  } else {
    return res.status(400).send("Expected columns order: [" + originalHeaders + "]");
  }

});

// VALIDATE COLUMN HEADERS
async function validateColumnHeaders(callLogFile, originalHeaders) {
  return new Promise(async (resolve, reject) => {
    // Declare incorrectColumnHeaders flag
    let incorrectColumnHeaders = false;

    let csvStream = csv.fromString(callLogFile.data.toString(), {
      headers: false,
      ignoreEmpty: true,
      trim: true
    })
    .on("data", async function(row) { // called once for every row of the CSV file
      // Read the first row (header) only

      // If last element in row is blank, remove that element
      if (row[row.length-1] == "") {
        row.pop();
      }

      // If row (header) does not have 11 columns or row does not match originalHeaders
      if (row.length != originalHeaders.length || JSON.stringify(row) != JSON.stringify(originalHeaders)) {
        incorrectColumnHeaders = true;
      }

      csvStream.pause();
      csvStream.emit('end');
    })
    .on("end", async function() {
      if (incorrectColumnHeaders) {
        resolve(false);
      } else {
        resolve(true);
      }
    })
    .on("error", function(err) {
      reject(new Error(err));
    });
  });
}

// CLEAR EXISTING SIMILAR CALL LOGS IF ANY
async function clearExistingCallLogs(callLogFile, newHeaders) {
  return new Promise(async (resolve, reject) => {
    let yearAndMonths = {};

    let csvStream = csv.fromString(callLogFile.data.toString(), {
      renameHeaders: true,
      headers: newHeaders,
      discardUnmappedColumns: true,
      strictColumnHandling: true,
      ignoreEmpty: true,
      trim: true
    })
    .on("data", function(row) { // called once for every row of the CSV file
      csvStream.pause();

      // Retrieve the month and year of this call log's created date
      let year = moment(row.createdDate, "D/M/YYYY HH:mm").format("YYYY").toString();
      let month = moment(row.createdDate, "D/M/YYYY HH:mm").format("MMMM").toString();

      // If yearsAndMonths does not include this year
      if (yearAndMonths[year] === undefined) {
        let months = [];
        months.push(month);
        yearAndMonths[year] = months;
      }

      // Else if yearsAndMonths contains this year but not this month
      else if (yearAndMonths[year]) {
        let months = yearAndMonths[year];

        if (!months.includes(month)) {
          months.push(month);
          yearAndMonths[year] = months;
        }
      }

      csvStream.resume();
    })
    .on("end", async function() {

      async.each(Object.keys(yearAndMonths), async (year) => {
        yearAndMonths[year].forEach(async (month) => {

          // Create the start and end of month based on createdDate
          let startOfMonth = moment().year(year).month(month).startOf('month').format();
          let endOfMonth = moment().year(year).month(month).endOf('month').format();

          // Delete all calllogs and rejected calllogs between the start and end of the month
          await CallLog.deleteMany({ createdDate: {$gte: startOfMonth, $lte: endOfMonth} });
        });
      }, () => {
        // Once all call logs are cleared from mongodb, resume upload of new call logs
        resolve(true);
      });

    })
    .on("error", function(err) {
      reject(new Error(err));
    });
  });
}


// UPLOAD ALL CALL LOGS FROM THIS CSV FILE TO MONGODB
async function uploadCallLogs(callLogFile, newHeaders, res) {
  // Retrieve configurations
  let config = await Config
  .findOne({})
  .select("unsuccessfulCases").catch(err => res.status(400).send(err.message));

  // Declare callLogs & unsuccessfulCallLogs arrays
  var callLogs = [];
  var rejectedCallLogs = [];

  // get a timestamp before parsing
  var pre_query = new Date().getTime();

  var csvStream = csv.fromString(callLogFile.data.toString(), {
    renameHeaders: true,
    headers: newHeaders,
    discardUnmappedColumns: true,
    strictColumnHandling: true,
    ignoreEmpty: true,
    trim: true
  })
  .on("data", async function(record) { // called once for every row of the CSV file
    csvStream.pause();

    let userExistFlag = true;

    let createdByToLowerCase = record.createdBy.toLowerCase();

    // Retrieve user id of the name in createdBy field (case insensitive)
    let user = await User.findOne({name : new RegExp(createdByToLowerCase, 'i') }).select("_id");

    // Convert createdBy & updatedBy field from name to user id if user exists
    if (!user || user == undefined) {
      userExistFlag = false;
    } else {
      // Check if createdBy & updatedBy fields are the same
      if (record.createdBy == record.updatedBy) {
        record.createdBy = user._id;
        record.updatedBy = user._id;
      } else {
        record.createdBy = user._id;
        user = await User.findOne({ name: record.updatedBy }).select("_id");
        record.updatedBy = user._id;
      }

      // Parse createdDate field to date format
      record.createdDate = moment(record.createdDate, "D/M/YYYY HH:mm").format();

      // Add a successfulCall boolean field to mark whether call is successful or unsuccessful
      if (config.unsuccessfulCases.includes(record.caseType)) {
        record["successfulCall"] = false;
      } else {
        record["successfulCall"] = true;
      }

      // Create and assign a new mongoose ObjectId
      record["_id"] = new mongoose.Types.ObjectId();
    }

    if (userExistFlag) {
      callLogs.push(record);
    } else {
      // If rejectedCallLogs does not include this user
      if (!rejectedCallLogs.includes(record.createdBy)) rejectedCallLogs.push(record.createdBy);
    }

    csvStream.resume();
  })
  .on("end", async function() {
    await setTimeout(() => { // To prevent missing parse of last row
      CallLog.create(callLogs, function(err, documents) {
        if (err) throw err;

        // get a timestamp after parsing
        var post_query = new Date().getTime();
        // calculate the duration in seconds
        var duration = (post_query - pre_query) / 1000;

        let returnMessage = callLogs.length + ` call log(s) have been uploaded (${duration} seconds). `;

        if (rejectedCallLogs.length > 0) {
          returnMessage += `Call logs with [ ${rejectedCallLogs} ] in "Created By" / "Updated By" columns are rejected.
          Please update their name to match in user database.`;
        }

        // Send notification of number of successful call logs uploaded and rejected calllogs
        res.status(200).send(returnMessage);
      });
    }, 1000)
  })
  .on("error", function(err) {
    res.status(400).send(err);
  });
}

//--------------------------------------------------------------------------------------------------------------------------------

// GET REQUEST ENDPOINT TO GET THE MONTHS AND YEARS OF EXISTING CALL LOGS
router.get("/", protect, admin || superadmin, async (req, res) => {
  let sortedYearAndMonths = await CallLog.aggregate([
    { $group:
      {
        _id: {
          year: { $year: "$createdDate" },
          month: { $month: "$createdDate" },
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
    {
      $group:
      {
        _id: "$_id.year",
        months: {
          $push: "$_id.month"
        }
      }
    },
    {
      $sort:
      {
        _id : -1
      }
    },
  ]);

  let yearAndMonthsArray = [];
  // Convert numerical months to name months
  for (i = 0; i < sortedYearAndMonths.length; i++) {
    let yearAndMonthObj = sortedYearAndMonths[i];
    let yearsAndMonthObj2 = {};
    let year = yearAndMonthObj._id;
    let months = yearAndMonthObj.months;

    for (j = 0; j < months.length; j++) {
      let numericMonth = months[j];
      months[j] = moment().month(numericMonth-1).format("MMMM").toString();
    }

    yearAndMonthsArray.push({year, months});
  }

  // Return array of year and its array of months (string format)
  return res.status(200).send(yearAndMonthsArray);
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

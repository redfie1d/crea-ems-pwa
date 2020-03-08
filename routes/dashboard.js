/*
Originator: Jun Ming
Date: 14 Feb 2019
Routes for dashboard visualisation endpoints
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
const { Booking } = require("../models/booking");
const { Week } = require("../models/week");
const { CallLog } = require("../models/calllog");
const { LibraryDuty } = require("../models/libraryduty");
const { Location } = require("../models/location");

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve count of distinct users who booked shifts this week
router.get("/countOfUsersWhoBookedThisWeek", protect, admin || superadmin, async (req, res) => {
  // Format currentDate time to 0
  let currentDate = moment().startOf('days');

  let week = await getWeekObjectBy(currentDate);

  // If week is null, no week schedule has been created this week, return 0 count
  if (week == null) return res.status(200).send("0");

  // Get distinct users that booked shifts this week
  let usersThisWeek = await Booking.aggregate([
    {$match: { week: week._id }},
    {$group: { _id: "$user" }}
  ]);

  // Return count of distinct users who booked shifts this week
  return res.status(200).send(usersThisWeek.length.toString());
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve total number of hours booked this week
router.get("/totalHoursBookedThisWeek", protect, admin || superadmin, async (req, res) => {
  // Format currentDate time to 0
  let currentDate = moment().startOf('days');

  let week = await getWeekObjectBy(currentDate);

  // If week is null, no week schedule has been created this week, return 0 hours
  if (week == null) return res.status(200).send("0");

  // Get total duration hours booked by users this week
  let hoursThisWeek = await Booking.aggregate([
    {$match: { week: week._id }},
    {$group: { _id: "$week", totalHours: {$sum: "$duration"}}}
  ]);

  // If cannot get hours for this week, return 0 hours
  if (hoursThisWeek.length === 0) {
    return res.status(200).send("0");
  }

  // Return total duration hours booked by users this week
  return res.status(200).send(hoursThisWeek[0].totalHours.toString());
});

//-------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve total number of hours booked this month
router.get("/totalHoursBookedThisMonth", protect, admin || superadmin, async (req, res) => {
  // Format currentDate time to 0
  let startOfCurrentMonth = moment().startOf('month');
  let endOfCurrentMonth = moment().endOf('month');

  // Get total duration hours booked by users this month
  let hoursThisMonth = await Booking.aggregate([
    {$match: {
      bookingStart: { $gte: startOfCurrentMonth.toDate(), $lte: endOfCurrentMonth.toDate() },
      bookingEnd: { $gte: startOfCurrentMonth.toDate(), $lte: endOfCurrentMonth.toDate() }
     }},
    {$group: { _id: 0, totalHours: {$sum: "$duration"}}}
  ]);

  // If cannot get hours for this month, return 0 hours
  if (hoursThisMonth.length === 0) {
    return res.status(200).send("0");
  }

  // Return total duration hours booked by users this month
  return res.status(200).send(hoursThisMonth[0].totalHours.toString());
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve total hours booked for each week for the past 6 weeks
router.get("/pastSixWeeksTotalHoursBooked", protect, admin || superadmin, async (req, res) => {
  // Format currentDate time to 0
  let currentDate = moment().startOf('days');

  // Get date seven weeks from now and one week from now
  let dateSevenWeeksFromNow = currentDate.clone().subtract(49, "d");
  let satOfLastWeek = currentDate.clone().subtract(7, "d").weekday("6");

  // Find weeks between dateSevenWeeksFromNow & satOfLastWeek
  let weeks = await Week.find({
    fromDate: { $gte: dateSevenWeeksFromNow, $lte: satOfLastWeek },
    toDate: { $gte: dateSevenWeeksFromNow, $lte: satOfLastWeek }
  })
  .select("fromDate")
  .sort("fromDate");

  let weeksAndHours = [];
  weeksAndHours[0] = [];
  weeksAndHours[1] = [];
  // For each week object
  for (i = 0; i < weeks.length; i++) {
    let week = weeks[i];

    weeksAndHours[0].push(moment(week.fromDate).format("DD-MMM-YYYY"));

    // Get total duration hours of shift booked by users that week
    let hoursThisWeek = await Booking.aggregate([
      {$match: { week: week._id }},
      {$group: { _id: "$week", totalHours: {$sum: "$duration"}}}
    ]);

    // If cannot find hours for that week
    if (hoursThisWeek.length == 0) {
      // Push 0 hours
      weeksAndHours[1].push(0);
    } else {
      // Else, push calculated total hours for that week
      weeksAndHours[1].push(hoursThisWeek[0].totalHours);
    }
  };

  // return weeksAndHours after all async functions are done e.g. [ [ "18-Feb-2019", "25-Feb-2019" ], [ 4, 0 ] ]
  return res.status(200).send(weeksAndHours);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve breakdown of successful & unsuccessful calls up to 6 months before
router.get("/pastSixMonthsCalllogsBreakdown", protect, admin || superadmin, async (req, res) => {
  // Define start of current month
  let startOfCurrentMonth = moment().startOf('month');

  // Get the first date of the month 6 months from now
  let dateSixMonthsFromNow = startOfCurrentMonth.clone().subtract(6, "months");

  // Retrieve count of successful & unsuccessful calls for the past 6 months
  let callLogsBreakdown = await CallLog.aggregate([
    {
      $match: {
        createdDate: { $gte: moment(dateSixMonthsFromNow).toDate(), $lt: moment(startOfCurrentMonth).toDate() }
      }
    },
    {
      $project: {
        _id: {
          year: { $year: "$createdDate" },
          month: { $month: "$createdDate" },
        },
        successfulCall: "$successfulCall"
      }
    },
    {
      $group: {
        _id: {
          year: "$_id.year",
          month: "$_id.month"
        },
        "successfulCall": {
          $sum: {
              $cond: [ "$successfulCall", 1, 0 ]
          }
        },
        "unSuccessfulCall": {
            $sum: {
                $cond: [ "$successfulCall", 0, 1 ]
            }
        }
      }
    },
    {
      $unwind: "$_id"
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1 }
    }
  ]);

  // Pushing results into monthsAndBreakdown
  let monthsAndBreakdown = [];
  monthsAndBreakdown[0] = [];
  monthsAndBreakdown[1] = [];
  monthsAndBreakdown[2] = [];
  // For each breakdown object
  for (i = 0; i < callLogsBreakdown.length; i++) {
    let year = callLogsBreakdown[i]._id.year;
    let month = callLogsBreakdown[i]._id.month;
    let yearAndMonth = moment().month(month-1).year(year).format("MMM-YY")

    let countOfSuccessfulCalls = callLogsBreakdown[i].successfulCall;
    let countOfUnsuccessfulCalls = callLogsBreakdown[i].unSuccessfulCall;

    monthsAndBreakdown[0].push(yearAndMonth);
    monthsAndBreakdown[1].push(countOfSuccessfulCalls);
    monthsAndBreakdown[2].push(countOfUnsuccessfulCalls);

  }

  // Return monthsAndBreakdown e.g. [ [ "Jan-19", "Sep-18" ], [ [ 1, 0 ], [ 4, 2 ] ] ]
  return res.status(200).send(monthsAndBreakdown);

});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve count of library duty appointments by location for current month
router.get("/countOfAppointmentsForCurrentMonth", protect, admin || superadmin, async (req, res) => {
  // Define start and end of current month
  let startOfCurrentMonth = moment().startOf('month');
  let endOfCurrentMonth = moment().endOf('month');

  // Retrieve count of appointments of each library duty
  let duties = await LibraryDuty.aggregate([
    {
      $match:
      {
        libraryDutyStart: { $gte: moment(startOfCurrentMonth).toDate(), $lte: moment(endOfCurrentMonth).toDate() }
      }
    },
    {
      $lookup:
      {
        from: "appointments",
        localField: "_id",
        foreignField: "libraryDuty",
        as: "appointments"
      }
    },
    {
      $project:
      {
        location: 1,
        appointments: {
          $filter: {
            input: "$appointments",
            as: "appointment",
            cond: { $eq: [ "$$appointment.status", "confirmed" ] }
          }
        }
      }
    },
    {
      $project:
      {
        location: 1,
        count: { $size: "$appointments" }
      }
    }
  ]);

  // Populate location fields
  duties = await Location.populate(duties, { path: "location", select: "locationName" });

  // Return count of appointments, grouped by locations
  return res.status(200).send(duties);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve current week to be displayed on the dashboard
router.get("/currentWeek", protect , admin || superadmin, async (req,res) => {
  // Format currentDate time to 0
  let currentDate = moment().startOf('days').subtract(1, 'd');

  let fromString = moment(currentDate.weekday(1)).format("DD, MMM YYYY");
  let toString = moment(currentDate.weekday(5)).format("DD, MMM YYYY");
  let monthString = moment().format("MMMM, YYYY");

  return res.status(200).send([fromString, toString, monthString]);
  });

//--------------------------------------------------------------------------------------------------------------------------------

// UTILITY FUNCTION

// Retrieve the week object of a given date
async function getWeekObjectBy(date) {
  // Return day of the week [1,2,3,4,5,6,0]
  let dayOfTheWeek = date.day();

  // If day is a weekend, get the thursday or friday of the week
  if (dayOfTheWeek == 6 || dayOfTheWeek == 0) {
    date = date.subtract(2, "d");
  }

  return await Week.findOne({ fromDate: {$lte: date}, toDate: {$gte: date}}).select("_id fromDate toDate");
}

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

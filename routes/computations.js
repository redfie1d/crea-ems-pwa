/*
Originator: Hidayatullah
Date: 12 Feb 2019
Routes for computing final hours
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
const { Record } = require("../models/record");
const { Booking } = require("../models/booking");
const { CallLog } = require("../models/calllog");
const { AdhocDuty } = require("../models/adhocDuty");
const { Config } = require("../models/config");

//-------------------------------------------------------------------------------------------------------------------------------

// New route to compute
router.post("/byDate/:fromDate/:toDate", protect, admin || superadmin, async(req, res) => {
  // retrieve configuration settings
  const config = await Config.findOne({}).catch(err => res.status(400).send(err.message));

  let fromDate = moment(req.params.fromDate).startOf("day");
  let toDate = moment(req.params.toDate).endOf("day");

  if(toDate.isBefore(fromDate)) return res.status(400).send("\"From\" date must be before \"To\" date");

  let callLogsByMonth = await CallLog.find({
    createdDate: {
      $gte: fromDate.toISOString(),
      $lt: toDate.toISOString()
    }
  });

  if(callLogsByMonth.length === 0) return res.status(404).send("Call logs have not been uploaded during this period");

  let userBookings = await Booking.aggregate([
    { $match: {
      bookingStart: { $gte: fromDate.toDate(), $lte: toDate.toDate() },
      isComputed: false
    }},
    { $lookup: {
      from: "users",
      localField: "user",
      foreignField: "_id",
      as: "user"
    }},
    { $unwind: "$user" },
    { $sort: {
      bookingStart: 1
    }},
    { $group: {
      _id: "$user",
      bookings: {
        $push: {
          bookingId: "$_id",
          bookingStart: "$bookingStart",
          bookingEnd: "$bookingEnd",
          dateCreated: "$dateCreated",
          duration: "$duration",
          week: "$week",
          isComputed: "$isComputed",
          split: "$split",
          userId: "$user._id",
          name: "$user.name"
        }
      }
    }}
  ]);

  if(userBookings.length === 0) return res.status(404).send("There are no shift bookings within the selected period");

  // for each user
  for(var user of userBookings) {
    var bookings = user.bookings;

    // for each booking
    for(var booking of bookings) {
      // split booking to hourly basis
      var split = await splitBookingByHour(booking);

      // for each split booking
      for(var splitBooking of split) {
        // format timings to moment objects
        let startTime = splitBooking.startTime;
        let endTime = splitBooking.endTime;

        splitBooking.review = "Flagged";
        splitBooking.successfulLogs = [];
        splitBooking.successType = [];
        splitBooking.numUnsuccessfulLogs = 0;

        // retrieve call logs within the hour
        let callLogs = await CallLog.find({
          createdBy: user._id,
          updatedBy: user._id,
          createdDate: {
            $gte: startTime.toISOString(),
            $lt: endTime.toISOString()
          }
        }).sort({
          createdDate: "asc"
        });

        // retrieve existing adhoc duties within the hour
        let adhocDuties = await AdhocDuty.find({
          user: user._id,
          $or: [
            { booking: booking._id },
            { startTime: { $gte: startTime.toISOString(), $lt: endTime.toISOString() }},
            { endTime: { $gte : startTime.toISOString(), $lt: endTime.toISOString() }},
          ]
        }).sort({
          startTime: "asc"
        });

        // check if there are adhoc duties
        if(adhocDuties.length > 0) {
          splitBooking.successType.push("Adhoc duties");
          splitBooking.review = "Resolved";
        }

        // check there are survey types while counting successful calls
        let countKPI = 0;
        let hasAppointment = false;
        let hasPhoneCompletion = false;

        for(var callLog of callLogs) {
          if(callLog.successfulCall) {
            countKPI++;
            splitBooking.successfulLogs.push(callLog._id);
            // check if call log is an smu appointment
            if(callLog.caseType === config.appointmentSurveyCT && callLog.modeOfContact === config.appointmentSurveyMOC) {
              hasAppointment = true;
            }
            // check if call log is a phone completion
            if(callLog.caseType === config.phoneSurveyCT) {
              hasPhoneCompletion = true;
            }
          } else {
            splitBooking.numUnsuccessfulLogs = splitBooking.numUnsuccessfulLogs + 1;
          }
        }

        // check if has survey appointment
        if(hasAppointment) {
          splitBooking.review = "Resolved";
          splitBooking.successType.push("Appointment");
        }

        // check if has survey appointment
        if(hasPhoneCompletion) {
          splitBooking.review = "Resolved";
          splitBooking.successType.push("Phone Completion");
        }

        // check if KPI >= config kpi requirement per hour
        if(countKPI >= config.kpi) {
          splitBooking.review = "Resolved";
          splitBooking.successType.push("KPI met");
        }
      }
      booking.split = split;

      // save each booking into db
      await Booking.updateOne(
        { _id: booking.bookingId },
        { $set: {
          split: split
        }}
      );
    }
    user.bookings = bookings;
  }
  return res.status(200).send(userBookings);
});

async function splitBookingByHour(booking) {
  // retrieve bookingStart and bookingEnd
  let bookingStart = moment(booking.bookingStart);
  let bookingEnd = moment(booking.bookingEnd);

  // get length from start and end
  let result = [];
  let i = bookingStart;
  while(i.isBefore(bookingEnd)) {
    let obj = {};
    obj.startTime = i.clone().toDate();
    obj.endTime = i.clone().add(1, "hours").toDate();
    result.push(obj);
    i.add(1, "hours");
  }

  return result;
}

//-------------------------------------------------------------------------------------------------------------------------------

router.post("/confirm", protect, admin || superadmin, async(req, res) => {
  // validate req body
  var results = req.body.results;
  let valid = validateResults(results);

  if(!valid) return res.status(400).send("Resolve all Flagged hours with comments before confirmation");

  // change all the .review to "Completed"
  results.forEach(user => {
    user.bookings.forEach(async booking => {
      booking.split.forEach(splitBooking => {
        splitBooking.review = "Completed";

      // End of each split booking
      });

      booking.isComputed = true;
      let computedDate = moment();

      // save booking
      await Booking.updateOne(
        { _id: booking.bookingId },
        { $set: {
          split: booking.split,
          computedDate: computedDate,
          isComputed: booking.isComputed
        }}
      );
    // End of each booking
    });

  // End of each user
  });

  return res.status(200).send("Computation process complete");
});

function validateResults(results) {
  let valid = true;
  results.forEach(user => {
    user.bookings.forEach(booking => {
      booking.split.forEach(splitBooking => {
        if(splitBooking.review === "Flagged") {
          valid = false;
        }

        if(splitBooking.successType.length === 0 && splitBooking.comment === "") {
          valid = false;
        }
      });
    });
  });
  return valid;
}

//-------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

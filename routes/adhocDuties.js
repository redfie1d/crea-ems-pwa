/*
Originator: Hidayatullah
Date: 28 Feb 2019
Routes for adhoc duties
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
const ObjectId = require("mongoose").Types.ObjectId;

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { User } = require("../models/user");
const { Week } = require("../models/week");
const { Booking } = require("../models/booking");
const { AdhocDuty, validateAdhocDutyInput, validateAdhocDutyUpdate } = require("../models/adhocDuty");

//--------------------------------------------------------------------------------------------------------------------------------

// Post request to create new adhoc duty
router.post("/:userId/:bookingId", protect, admin || superadmin, async(req, res) => {
  // validate user
  let user = await User.findOne({ _id: req.params.userId }).catch(err => res.status(400).send(err.message));

  if(!user) return res.status(404).send("User does not exist");

  // validate booking
  let booking = await Booking.findOne({ _id: req.params.bookingId })
    .catch(err => res.status(400).send(err.message));

  if(!booking) return res.status(404).send("Shift booking does not exist");

  // Validate request body
  const { error } = validateAdhocDutyInput(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Initialise startTime & endTime
  let startTime = moment(req.body.startTime);
  let endTime = moment(req.body.endTime);

  // return error status if end time is before start time
  if(endTime.isBefore(startTime)) return res.status(400).send("\"Start Time\" must be before \"End Time\"");

  // check if startTime and endTime is within booking time
  let bookingStart = moment(booking.bookingStart)
  let bookingEnd = moment(booking.bookingEnd)

  // return if startTime and endTime are not in between bookingStart and bookingEnd
  if(!(startTime >= bookingStart && startTime < bookingEnd) || !(endTime > bookingStart && endTime <= bookingEnd)) {
    return res.status(400).send("\"Start Time\" and \"End Time\" must be within booking times");
  }

  let adhocDutiesWithin = await AdhocDuty.find({
    user: req.params.userId,
    booking: req.params.bookingId,
    startTime: { $gte: startTime },
    endTime: { $lte: endTime }
  }).catch(err => res.status(400).send(err.message));

  let adhocDutiesBefore = await AdhocDuty.find({
    user: req.params.userId,
    booking: req.params.bookingId,
    startTime: { $gte: startTime, $lt: endTime }
  }).catch(err => res.status.send(err.message));

  let adhocDutiesAfter = await AdhocDuty.find({
    user: req.params.userId,
    booking: req.params.bookingId,
    endTime: { $gt: startTime, $lte: endTime }
  }).catch(err => res.status.send(err.message));

  if(adhocDutiesWithin.length > 0 || adhocDutiesBefore.length > 0 || adhocDutiesAfter.length > 0) {
    return res.status(400).send("There is an overlap in adhoc duties created")
  }

  // create adminDuty obj
  const adhocDuty = new AdhocDuty({
    user: req.params.userId,
    booking: req.params.bookingId,
    startTime: startTime,
    endTime: endTime,
    remarks: req.body.remarks
  });

  // save
  adhocDuty.save();

  return res.status(200).send("Adhoc duty saved for selected user");
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request for admins to get weeks of duties (descending date created and limited to 10)
router.get("/weeks", protect, admin || superadmin, async(req, res) => {
  let weeks = await Week.find({}).sort({fromDate: "desc"}).limit(10);

  return res.status(200).send(weeks);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request for admins to get duties by week id
router.get("/week/:id", protect, admin || superadmin, async(req, res) => {

  let duties = await Booking.aggregate([
    {
      $match: {
        week: ObjectId(req.params.id)
      }
    },
    {
      $lookup:
      {
        from: "adhocduties",
        localField: "_id",
        foreignField: "booking",
        as: "duty"
      }
    },
    {
      $unwind: "$duty"
    },
    {
      $sort:
      {
        "duty.startTime" : -1
      }
    },
    {
      $project: {
        _id: 0,
        duty: 1
      }
    }
  ]);

  // Populate user fields
  duties = await User.populate(duties, { path: "duty.user", select: "name" });

  let dutiesArray = [];

  // if no adhoc duties found for this week, return empty array
  if (duties.length == 0) return res.status(200).send(dutiesArray);

  for (i = 0; i < duties.length; i++) {
    dutiesArray.push(duties[i].duty);
  }

  return res.status(200).send(dutiesArray);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request for admins to get adhoc duty by id
router.get("/:id", protect, admin || superadmin, async(req, res) => {
  let duty = await AdhocDuty.findOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  let dutyObj = {};
  dutyObj["user"] = duty.user;
  dutyObj["date"] = moment(duty.startTime).format("YYYY-MM-DD");
  dutyObj["startTime"] = moment(duty.startTime).format("HH:mm");
  dutyObj["endTime"] = moment(duty.endTime).format("HH:mm");
  dutyObj["remarks"] = duty.remarks;

  return res.status(200).send(dutyObj);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Put request for admins to update a adhoc duty by id
router.put("/:id", protect, admin || superadmin, async(req, res) => {
  const { error } = validateAdhocDutyUpdate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Format request body date and time
  let dutyStart = moment(req.body.date + ' ' + req.body.startTime);
  let dutyEnd = moment(req.body.date + ' ' + req.body.endTime);

  // Date validation
  if (moment().isBefore(dutyStart) || moment().isBefore(dutyEnd)) {
    return res.status(400).send("Date selected must be a past date");
  }

  // Time validation
  if (dutyStart > dutyEnd) {
    return res.status(400).send("Start Time cannot be after End Time");
  }

  if (dutyStart == dutyEnd) {
    return res.status(400).send("Start Time cannot be the same as End Time");
  }

  // If all validations passes, find and update existing record
  let duty = await AdhocDuty.findOne({ _id: req.params.id });

  duty.startTime = dutyStart;
  duty.endTime = dutyEnd;
  duty.remarks = req.body.remarks;

  await duty.save();

  return res.status(200).send("Adhoc duty updated successfully.");

});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request for admins to delete adhoc duty
router.delete("/deleteOne/:id", protect, admin || superadmin, async(req, res) => {
  // validate id
  let adhocDuty = await AdhocDuty.findOne({ _id: req.params.id })
    .catch(err => res.status(400).send(err.message));

  if(!adhocDuty) return res.status(404).send("Adhoc duty does not exist");

  adhocDuty = await AdhocDuty.deleteOne({ _id: req.params.id })
    .catch(err => res.status(400).send(err.message));

  if(adhocDuty.n === 0) {
    return res.status(404).send("Failed to delete adhoc duty");
  }

  return res.status(200).send("Adhoc duty deleted successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

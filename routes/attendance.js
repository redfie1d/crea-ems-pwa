/*
Originator: Jun Ming
Date: 25 Feb 2019
Routes for attendance clock in / out endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");

// Require middleware
const protect = require("../middleware/protect");

// Require models
const { Config } = require("../models/config");
const { Record } = require("../models/record");

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO LOG THEIR ATTENDANCE TIME IN
router.post("/", protect, async (req, res) => {
  // Retrieve configurations
  let config = await Config
  .findOne({})
  .select("-__v -_id").catch(err => res.status(400).send(err.message));

  // Check location first
  let usersLocation = req.body.lat + "," + req.body.lng;
  let creaCoordinate = config.creaAddress;

  const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise
  });

  // Find distance between 2 address.
  let results = await googleMapsClient.distanceMatrix({
    origins: [creaCoordinate],
    destinations: [usersLocation],
    mode: 'walking',
    units: 'metric',
    region: 'sg'
  })
  .asPromise()
  .catch((err) => {
    return res.status(400).send("Google maps could not calculate distance");
  });

  let distanceBetweenUsersLocationAndCreaInMeters = results.json.rows[0].elements[0].distance.value;

  if (distanceBetweenUsersLocationAndCreaInMeters > config.maxDistanceFromCrea) {
    return res.status(400).send("You are not within CREA");
  }

  let timeNow = moment();
  let startOfToday = moment(timeNow).startOf("day");
  let endOfToday = moment(timeNow).endOf("day");

  // Check if there are any records created by this user today with status started
  let existingRecord = await Record.findOne({
    recordEnd: null,
    recordStart: { $gte: startOfToday, $lte: endOfToday },
    user: req.user.id,
    isManual: false
  });

  if (existingRecord) return res.status(400).send("You did not clock out your last attendance.");

  // Create new attendance record
  let record = new Record({
    user: req.user.id,
    recordStart: timeNow,
    recordType: "shift",
    review: "open",
    isManual: false
  });

  record.save();

  return res.status(200).send("Attendance clocked in successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO LOG THEIR ATTENDANCE TIME OUT
router.put("/", protect, async (req, res) => {
  // Retrieve configurations
  let config = await Config
  .findOne({})
  .select("-__v -_id").catch(err => res.status(400).send(err.message));

  // Check location first
  let usersLocation = req.body.lat + "," + req.body.lng;
  let creaCoordinate = config.creaAddress;

  const googleMapsClient = require('@google/maps').createClient({
    key: process.env.GOOGLE_API_KEY,
    Promise: Promise
  });

  // Find distance between 2 address.
  let results = await googleMapsClient.distanceMatrix({
    origins: [creaCoordinate],
    destinations: [usersLocation],
    mode: 'walking',
    units: 'metric',
    region: 'sg'
  })
  .asPromise()
  .catch((err) => {
    return res.status(400).send("Google maps could not calculate distance");
  });

  let distanceBetweenUsersLocationAndCreaInMeters = results.json.rows[0].elements[0].distance.value;

  if (distanceBetweenUsersLocationAndCreaInMeters > config.maxDistanceFromCrea) {
    return res.status(400).send("You are not within CREA");
  }

  let timeNow = moment();
  let startOfToday = moment(timeNow).startOf("day");
  let endOfToday = moment(timeNow).endOf("day");

  // Check if there are any records created by this user today with status started
  let record = await Record.findOne({
    recordEnd: null,
    recordStart: { $gte: startOfToday, $lte: endOfToday },
    user: req.user.id,
    isManual: false
  });

  if (!record || record == undefined) return res.status(400).send("You have not clocked in yet");

  // Update recordEnd with current time
  record.recordEnd = timeNow;
  record.save();

  return res.status(200).send("Attendance clocked out successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

/*
Originator: Jun Ming
Date: 29 Aug 2018
Routes for shift bookings management endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");
const randomColor = require('randomcolor');
const nodemailer = require("nodemailer");
const ObjectId = require("mongoose").Types.ObjectId;

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { Config } = require("../models/config");
const { Booking, validateCreateBooking, validateBookingByAdmin } = require("../models/booking");
const { Week } = require("../models/week");
const { User } = require("../models/user");

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO CREATE SHIFT BOOKINGS
router.post("/", protect, async (req,res) => {
  // Validate request body
  const { error } = validateCreateBooking(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Retrieve configurations
  let config = await Config
  .findOne({})
  .select("-__v -_id").catch(err => res.status(400).send(err.message));

  // Retrieve the week's deadline from index 0 of bookings array
  let week = await Week.findOne({ _id: req.body.bookings[0].week }).select("bookingDeadline");

  // Check if bookings are created after deadline
  if (moment().isAfter(moment(week.bookingDeadline))) return res.status(400).send("Cannot modify shift bookings after deadline");

  // Check for duplicate bookings in request body
  let duplicate = checkForDuplicateBookings(req.body.bookings);
  if (duplicate) return res.status(400).send("Duplicate bookings");

  // Check for any overlapped exisiting bookings in database
  let overlap = await checkForOverlappedBookings(req.body.bookings, req.user.id);
  if (overlap) return res.status(400).send("Overlapped bookings");

  // Check for minimum hours booked by student
  let minHours = config.minHoursPerWeek;
  let minHoursMet = await checkMinHoursForStudentMet(req.body.bookings, minHours);
  if (!minHoursMet) return res.status(400).send(`Require ${minHours} minimum hours`);

  // Check for each weekday whether booked hours exceed maximum hours for the day
  let maxHoursForTheDay = config.maxHoursPerDay;
  let dayThatExceedMaxHours = await checkBookingHoursExceedForTheDay(req.body.bookings, maxHoursForTheDay);
  if (dayThatExceedMaxHours) {
    return res.status(400).send(`Maximum hours exceeded for ${dayThatExceedMaxHours.day}`);
  }

  // If all validations passes, proceed to create shift bookings
  for (var booking of req.body.bookings) {
    let bookingStart = moment(booking.bookingStart);
    let bookingEnd = moment(booking.bookingEnd);

    // Calculate duration of booking
    let duration = moment.duration(bookingEnd.diff(bookingStart)).as("hours");

    // Proceed with creating booking object
    booking = new Booking({
      user: req.user.id,
      bookingStart: bookingStart,
      bookingEnd: bookingEnd,
      dateCreated: Date.now(),
      duration: duration,
      week: booking.week,
      isComputed: false,
      split: []
    });

    // Save in mongodb
    booking.save();
  }

  return res.status(200).send("Booking(s) created sucessfully");
});

// ***************************** UTILITY FUNCTIONS FOR CREATING SHIFT BOOKINGS *****************************


function checkForDuplicateBookings(bookings) {

  for (i = 0; i < bookings.length; i++) {
    let bookingStart1 = moment(bookings[i].bookingStart);
    let bookingEnd1 = moment(bookings[i].bookingEnd);

    for (j = i+1; j < bookings.length; j++) {
      let bookingStart2 = moment(bookings[j].bookingStart);
      let bookingEnd2 = moment(bookings[j].bookingEnd);

      // If booking 1 && booking 2 are not the last booking in the array
      if (i != bookings.length -1 && j != bookings.length-1) {
        // Go through validations
        if (bookingStart1 > bookingStart2 && bookingStart1 < bookingEnd2) {
          return true;
        } else if (bookingStart1 < bookingStart2 && bookingEnd1 >= bookingEnd2) {
          return true;
        } else if (bookingStart1 <= bookingStart2 && bookingEnd1 > bookingEnd2) {
          return true;
        } else if (bookingEnd1 > bookingStart2 && bookingEnd1 < bookingEnd2) {
          return true;
        } else if (bookingStart1.isSame(bookingStart2) && bookingEnd1.isSame(bookingEnd2)) {
          return true;
        }
      }

    }
  }
  return false;
}

async function checkForOverlappedBookings(bookings, userId) {
  for (var booking of bookings) {
    let bookingStart = moment(booking.bookingStart);
    let bookingEnd = moment(booking.bookingEnd);

    let result = await Booking.findOne({
      user: userId,
      $or: [
        { bookingStart: { $gte: bookingStart.toISOString(), $lt: bookingEnd.toISOString() }},
        { bookingEnd: { $gt : bookingStart.toISOString(), $lte: bookingEnd.toISOString() }},
      ]
    });

    if (result != null) return true;
  }
  return false;
}

async function checkMinHoursForStudentMet(bookings, minHours) {
  let bookedHours = 0;

  // Calculate total duration of exisiting bookings made by user this week
  let existingBookings = await Booking.aggregate([
    {
      $match:
      {
        week: ObjectId(bookings[0].week)
      }
    },
    {
      $group: {
        _id: "$week",
        totalHours: { $sum: "$duration" }
      }
    }
  ]);

  // Calculate total duration booked by this user
  for (var booking of bookings) {
    let bookingStart = moment(booking.bookingStart);
    let bookingEnd = moment(booking.bookingEnd);
    let duration = moment.duration(bookingEnd.diff(bookingStart)).as("hours");
    bookedHours += duration;
  }

  // If user does not have existing bookings
  if (existingBookings.length == 0) {
    if (bookedHours < minHours) {
      return false;
    }
  } else {
    if (bookedHours + existingBookings[0].totalHours < minHours) {
      return false;
    }
  }

  return true;
}

async function checkBookingHoursExceedForTheDay(bookings, maxHoursForTheDay) {
  // 1. Get total hours booked of all exisiting shift bookings for each day of this week
  let existingBookings = await Booking.aggregate([
    {
      $match:
      {
        week: ObjectId(bookings[0].week)
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: "$bookingStart" },
        totalHours: { $sum: "$duration" }
      }
    },
    {
      $sort: {
        _id: 1
      }
    }
  ]);

  // 2. Calculate total duration for each day of new bookings
  let bookingsMap = {};
  for (var booking of bookings) {
    let bookingStart = moment(booking.bookingStart);
    let bookingEnd = moment(booking.bookingEnd);
    let duration = moment.duration(bookingEnd.diff(bookingStart)).as("hours");
    let day = bookingStart.day();

    // Add day-duration pair to bookingsMap
    if (day in bookingsMap) {
      bookingsMap[day] = bookingsMap[day] + duration;
    } else {
      bookingsMap[day] = duration;
    }
  }

  // For each existing booking day, check that new booking hours does not exceed maximum hours for the day
  for (var existingBooking of existingBookings) {
    let day = existingBooking._id-1;

    if (day in bookingsMap) {
      let newTotalHoursCalculated = bookingsMap[day] + existingBooking.totalHours;
      if (newTotalHoursCalculated > maxHoursForTheDay) {
        let dayInString = moment().day(day).format("dddd");
        let hoursExceededBy = newTotalHoursCalculated - maxHoursForTheDay;
        return { day: dayInString, hoursExceededBy: hoursExceededBy };
      }
    }
  }

  return null;
}

// ***************************** END OF UTILITY FUNCTIONS FOR CREATING SHIFT BOOKINGS *****************************

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN OR SUPERADMIN TO CREATE SHIFT BOOKING FOR A USER
router.post("/user/:userId/admin", protect, superadmin || admin, async (req,res) => {
  // Validate request body
  const { error } = validateBookingByAdmin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Return day of the week [1,2,3,4,5,6,0]
  let dayOfTheWeek = moment(req.body.date).day();

  // Check if date is a weekend
  if (dayOfTheWeek == 6 || dayOfTheWeek == 0) {
    return res.status(400).send("Please select a weekday");
  }

  let startTimeArray = req.body.startTime.split(":");
  let endTimeArray = req.body.endTime.split(":");

  // Check start time and end time are on an hourly basis
  if (startTimeArray[1] != "00" || endTimeArray[1] != "00") {
    return res.status(400).send("Start Time / End Time must be on an hourly basis");
  }

  // Initialise date objects to moment objects
  let bookingStart = moment(req.body.date + ' ' + req.body.startTime);
  let bookingEnd = moment(req.body.date + ' ' + req.body.endTime);


  // Check start time cannot be after end time
  if (bookingStart.format() > bookingEnd.format()) return res.status(400).send("Start Time cannot be after End Time");

  // Check start time cannot be same as end time
  if (bookingStart.format() === bookingEnd.format()) return res.status(400).send("Start Time cannot be the same as End Time");

  let firstBookingTime = moment(req.body.date + " 09:00", "YYYY-MM-DD HH:mm");
  let lastBookingTime = moment(req.body.date + " 21:00", "YYYY-MM-DD HH:mm");

  // Check start time and end time is within 9am - 9pm
  if (bookingStart < firstBookingTime || bookingEnd > lastBookingTime) {
    return res.status(400).send("Booking time must be from 9am - 9pm");
  }

  // Calculate duration of new booking
  let duration = moment.duration(bookingEnd.diff(bookingStart)).as("hours");

  // Check duration updated by admin is minimum 1 hour
  if (duration < 1) return res.status(400).send("Minimum duration required is 1 hour");

  // Check if user has overlapping bookings
  let booking = await Booking.findOne({
    user: req.params.userId,
    $or: [
      { bookingStart: { $gte: bookingStart.toISOString(), $lt: bookingEnd.toISOString() }},
      { bookingEnd: { $gt : bookingStart.toISOString(), $lte: bookingEnd.toISOString() }},
    ]
  });

  if (booking != null) return res.status(400).send("User already has a booking that overlaps");

  let startOfDate = moment(req.body.date).startOf('day');

  let week = await Week.findOne({
    fromDate: { $lte: startOfDate.toISOString() },
    toDate: { $gte: startOfDate.toISOString() }
  });

  // Check if week schedule has been created
  if (!week || week == undefined) return res.status(400).send("Week schedule has not been created");

  // Proceed with creating booking object
  booking = new Booking({
    user: req.params.userId,
    bookingStart: bookingStart,
    bookingEnd: bookingEnd,
    dateCreated: Date.now(),
    duration: duration,
    week: week._id,
    isComputed: false,
    split: []
  });

  // Save in mongodb
  await booking.save();

  return res.status(200).send("Shift booking created successfully");
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN TO RETRIEVE A BOOKING
router.get("/:id/admin", protect, admin || superadmin, async (req, res) => {
  let booking = await Booking.findOne({ _id: req.params.id })
  .populate({ path: "user", select: "name" });

   // if booking does not exist, return error 404: not found
   if (!booking || booking == undefined) return res.status(404).send("Shift booking not found");

   let bookingObj = {};
   bookingObj["user"] = booking.user;
   bookingObj["date"] = moment(booking.bookingStart).format("YYYY-MM-DD");
   bookingObj["startTime"] = moment(booking.bookingStart).format("HH:mm");
   bookingObj["endTime"] = moment(booking.bookingEnd).format("HH:mm");

   return res.status(200).send(bookingObj);

});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN TO RETRIEVE ALL BOOKINGS BY WEEK
router.get("/week/:week/admin", protect, admin, async (req, res) => {
  // Check whether bookings exists, if not return 404 not found
  let bookings = await Booking
    .find({week: req.params.week})
    .populate("user")
    .sort({ dateCreated: "desc" })
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(bookings);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ALL USERS TO RETRIEVE ALL BOOKINGS BY WEEK
router.get("/week/:week/allUsers", protect, async (req, res) => {

  let bookings = await Booking
    .find({week: req.params.week})
    .populate("user", "name _id")
    .sort({bookingEnd: "asc"})
    .catch(err => res.status(400).send(err.message));

  // helper function to map each user to a color
  var colorMapping = generateColors(bookings);

  bookingsByDay = {
    mon: [],
    tue: [],
    wed: [],
    thu: [],
    fri: []
  };

  bookings.map(booking => {
    switch (moment(booking.bookingStart).day()) {
      case 1:
        bookingsByDay.mon.push(booking);
        break;
      case 2:
        bookingsByDay.tue.push(booking);
        break;
      case 3:
        bookingsByDay.wed.push(booking);
        break;
      case 4:
        bookingsByDay.thu.push(booking);
        break;
      case 5:
        bookingsByDay.fri.push(booking);
        break;
    }
  });

  var sortedBookings = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  }

  // for each day
  for(var key in bookingsByDay) {

    // get array of bookings by day
    let dayArr = bookingsByDay[key];

    // for each bookings in a day
    for(var booking of dayArr) {

      // append color to booking
      let colorMapped = colorMapping[booking.user._id];
      booking.color = colorMapped;

      // get start and end times of the booking
      let start = moment(booking.bookingStart);
      let end = moment(booking.bookingEnd);
      let day = moment(booking.bookingStart).day();

      // if there are no existing workstations used
      if(sortedBookings[day].length === 0) {
        let workstation = [];
        workstation.push(booking);
        sortedBookings[day].push(workstation);
      } else { // there are existing workstations used

        // retrieve all existing workstations
        let stationsArr = sortedBookings[day];

        // for each station
        var isPushed = false;
        var y = 0;
        while(!isPushed && y < stationsArr.length) {
          var currentStation = stationsArr[y];

          // check if booking fits into the current station
          for(var i = 0; i < currentStation.length; i++) {
            let stationBooking = currentStation[i];

            if(i === 0 && end <= moment(stationBooking.bookingStart)) { // if booking fits before first stationBooking
              currentStation.unshift(booking);
              isPushed = true;
            } else if(i === (currentStation.length-1) && start >= moment(stationBooking.bookingEnd)) { // if booking fits after last stationBooking
              currentStation.push(booking);
              isPushed = true;
            } else if(start >= moment(stationBooking.bookingEnd) && end <= moment(currentStation[i+1].bookingStart)) { // if booking is in between existing bookings
              currentStation.splice(i+1, 0, booking);
              isPushed = true;
            }
          }
          // continue
          y++;
        }

        // if the booking was not fit into any existing workstation
        if(!isPushed) {
          let workstation = [];
          workstation.push(booking);
          sortedBookings[day].push(workstation);
        }
      }
    }
  }

  var toReturn = structureBookings(sortedBookings);

  return res.status(200).send(toReturn);
});

// HELPER FUNCTION TO RETURN BOOKINGS STRUCTURED INTO HOURS
function structureBookings(sortedBookings) {
  var toReturn = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: []
  }

  // for each day
  for(var day in sortedBookings) {
    // retrieve array of bookings for the day
    let dayArr = sortedBookings[day];

    // for each booking in the day
    for(var stationId = 0; stationId < dayArr.length; stationId++) {
      // retrieve the current station
      let station = dayArr[stationId];

      // initialise empty station obj to map the bookings to timeslots
      let stationObj = {};

      // for each booking in the current station
      station.map(booking => {
        // initialise keys to assign bookings to
        let start = moment(booking.bookingStart);
        let startHour = start.hour();
        var str = "";
        if(startHour === 9) {
          str = stationId + "-0" + startHour + ":00-" + (startHour+1) + ":00";
        } else {
          str = stationId + "-" + startHour + ":00-" + (startHour+1) + ":00";
        }

        // map the key to booking
        stationObj[str] = booking;
      });

      // push station object into array to return
      toReturn[day].push(stationObj);
    }
  }

  return toReturn;
}

// HELPER FUNCTION TO MAP EACH USER IN BOOKINGS TO A COLOR
function generateColors(bookings) {
  // get number of users
  var users = [];
  for(var booking of bookings) {
    let user = booking.user;
    if(!users.includes(user._id)) {
      users.push(user._id);
    }
  }
  var numUsers = users.length;

  // generate random colors based on number of users
  var randomColors = randomColor({
    count: numUsers,
    luminosity: "light",
    format: "rgb"
  });

  // map each user to random colors generated
  var mapping = {};
  var i = 0;
  for(var userId of users) {
    mapping[userId] = randomColors[i++];
  }

  return mapping;
}

//--------------------------- -----------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO RETRIEVE HIS/HER BOOKINGS POINTER
router.get("/week/:week/pointer", protect, async (req, res) => {
  let bookings = await Booking
    .find({user: req.user.id, week: req.params.week})
    .select("_id bookingStart bookingEnd dateCreated duration")
    .catch(err => res.status(400).send(err.message));

  // initialise bookingPointer object to return mapping
  var bookingsPointer = {};

  // for each booking
  bookings.forEach((booking) => {
    // get day and start hour
    var day = moment(booking.bookingStart).day() - 1;
    var start = moment(booking.bookingStart).hour();

    // initialise string to use as key
    var key = "";
    if(start === 9) {
      key = day + "-0" + start + "-" + (start+1);
    } else {
      key = day + "-" + start + "-" + (start+1);
    }

    // map key with booking as the value
    bookingsPointer[key] = booking;
  });

  return res.status(200).send(bookingsPointer);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USERS TO VIEW PREDICTED BOOKINGS
router.get("/analytics/predictive", protect, async (req, res) => {
  // validate user
  let user = await User.findOne({ _id: req.user.id })
    .catch(err => res.status(400).send(err.message));

  if(!user) return res.status(404).send("User not found");

  // retrieve date now and date of past month
  const now = moment();
  const pastMonth = moment().subtract(1, "month").startOf("day");

  // aggregate function to retrieve bookings for the past month
  let bookingsByDay = await Booking.aggregate([
    { $match: {
      user: user._id,
      bookingStart: { $gte: pastMonth.toDate(), $lte: now.toDate() }
    }},
    { $sort: {
      bookingStart: 1
    }},
    { $addFields: {
      dayOfBooking: { $dayOfWeek: "$bookingStart" }
    }},
    { $group: {
      _id: "$dayOfBooking",
      bookings: {
        $push: {
          _id: "$_id",
          bookingStart: "$bookingStart",
          bookingEnd: "$bookingEnd",
          duration: "$duration",
          week: "$week",
          user: "$user"
        }
      }
    }}
  ]);

  var dayRecommendedBookings = [];

  // for each day
  for(var day of bookingsByDay) {
    // retrieve the day index (M: 2, T: 3, W: 4, T: 5, F: 6)
    var dayIndex = day._id - 2;

    // retrieve past bookings of the day
    var bookings = day.bookings;

    // object to store count of times
    var startTimesMap = {};
    var endTimesMap = {};

    // for each booking
    for(var booking of bookings) {
      // retrieve start times and end times
      var startTime = moment(booking.bookingStart).hour();
      var endTime = moment(booking.bookingEnd).hour();

      // if there is an existing start time
      if(startTime in startTimesMap) {
        // retrieve current count of start times and increment by 1
        let count = startTimesMap[startTime];
        count += 1;
        startTimesMap[startTime] = count;
      } else {
        startTimesMap[startTime] = 1;
      }

      // if there is an existing end time
      if(endTime in endTimesMap) {
        // retrieve current count of end times and increment by 1
        let count = endTimesMap[endTime];
        count += 1;
        endTimesMap[endTime] = count;
      } else {
        endTimesMap[endTime] = 1;
      }
    }

    // get top 2 highest start times and top 2 highest end times
    var firstStartTime = 0;
    var secondStartTime = 0;
    var countStartTemp = 0;
    for(var start in startTimesMap) {
      let count = startTimesMap[start];
      if(count >= countStartTemp) {
        secondStartTime = firstStartTime;
        firstStartTime = start;
        countStartTemp = count;
      }
    }

    var firstEndTime = 0;
    var secondEndTime = 0;
    var countEndTemp = 0;
    for(var end in endTimesMap) {
      let count = endTimesMap[end];
      if(count >= countEndTemp) {
        secondEndTime = firstEndTime;
        firstEndTime = end;
        countEndTemp = count;
      }
    }

    // convert all times to number
    firstStartTime = Number(firstStartTime);
    secondStartTime = Number(secondStartTime);
    firstEndTime = Number(firstEndTime);
    secondEndTime = Number(secondEndTime);

    // push first recommended
    if(firstStartTime > 0) {
      for(let i = firstStartTime; i < firstEndTime; i++) {
        let str = "";
        if(i === 9) {
          str = dayIndex + "-0" + i + "-" + (i+1);
        } else {
          str = dayIndex + "-" + i + "-" + (i+1);
        }

        dayRecommendedBookings.push(str);
      }
    }

    // push second recommended
    if(secondStartTime > 0) {
      for(let i = secondStartTime; i < secondEndTime; i++) {
        let str = "";
        if(i === 9) {
          str = dayIndex + "-0" + i + "-" + (i+1);
        } else {
          str = dayIndex + "-" + i + "-" + (i+1);
        }

        dayRecommendedBookings.push(str);
      }
    }
  }

  return res.status(200).send(dayRecommendedBookings);
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMINS TO RETRIEVE BOOKINGS BY USER AND WEEK
router.get("/byUserAndWeek/:userId/:weekId", protect, admin || superadmin, async (req, res) => {
  // validate request parameters
  let user = await User.findOne({ _id: req.params.userId })
    .catch(err => res.status(400).send(err.message));

  if(!user) return res.status(404).send("User does not exist")

  let week = await Week.findOne({ _id: req.params.weekId })
    .catch(err => res.status(400).send(err.message));

  if(!week) return res.status(404).send("Week does not exist")

  // get bookings by user and week
  let bookings = await Booking.find({
    user: req.params.userId,
    week: req.params.weekId
  }).catch(err => res.status(400).send(err.message));

  return res.status(200).send(bookings);
});

//--------------------------------------------------------------------------------------------------------------------------------

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN TO UPDATE A BOOKING
router.put("/:id/admin", protect, async (req, res) => {
  // Find old shift booking
  let oldBooking = await Booking.findOne({ _id: req.params.id });

  // if booking does not exist, return error 404: not found
  if (!oldBooking || oldBooking == undefined) return res.status(404).send("Shift booking not found");

  // Validate request body
  const { error } = validateBookingByAdmin(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let startTimeArray = req.body.startTime.split(":");
  let endTimeArray = req.body.endTime.split(":");

  // Check start time and end time are on an hourly basis
  if (startTimeArray[1] != "00" || endTimeArray[1] != "00") {
    return res.status(400).send("Start Time / End Time must be on an hourly basis");
  }

  // Initialise date objects to moment objects
  let newBookingStart = moment(req.body.date + ' ' + req.body.startTime);
  let newBookingEnd = moment(req.body.date + ' ' + req.body.endTime);

  // Check start time and end time
  if (newBookingStart > newBookingEnd) {
    return res.status(400).send("Start Time cannot be after End Time");
  }

  let firstBookingTime = moment(req.body.date + " 09:00", "YYYY-MM-DD HH:mm");
  let lastBookingTime = moment(req.body.date + " 21:00", "YYYY-MM-DD HH:mm");

  // Check start time and end time is within 9am - 9pm
  if (newBookingStart < firstBookingTime || newBookingEnd > lastBookingTime) {
    return res.status(400).send("Booking time must be from 9am - 9pm");
  }

  // Calculate duration of new booking
  let newDuration = moment.duration(newBookingEnd.diff(newBookingStart)).as("hours");

  // Check duration updated by admin is minimum 1 hour
  if (newDuration < 1) return res.status(400).send("Minimum duration required is 1 hour");

  // Update booking document
  oldBooking.bookingStart = newBookingStart;
  oldBooking.bookingEnd = newBookingEnd;
  oldBooking.duration = newDuration;
  await oldBooking.save();
  return res.status(200).send("Shift booking updated");

});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR USER TO DELETE HIS/HER BOOKING
router.delete("/:id", protect, async (req, res) => {
  // Check whether booking belongs to the user, if not return 403 forbidden
  let booking = await Booking
  .findOne({ _id: req.params.id, user: req.user.id })
  .populate({ path: "week", select: "bookingDeadline" })
  .catch(err => res.status(400).send(err.message));

  if (!booking || booking == undefined) return res.status(403).send("This booking does not belong to you");

   // If user's booking is in the past
  if (moment().isAfter(moment(booking.week.bookingDeadline))) return res.status(400).send("Cannot delete shift bookings after deadline");

  // Check if booking's start time is less than 24 hours from now
  let diffBetweenStartTimeAndNow = moment.duration(moment(booking.bookingStart).diff(moment())).as("hours");
  // If booking's start time is less than 24 hours from now, return 400: bad request
  if (diffBetweenStartTimeAndNow < 24) {
    return res.status(400).send("Shift bookings cannot be deleted 24 hours before start time");
  }

  // Proceed with booking deletion at booking collection
  await Booking.deleteOne({ _id: req.params.id });

  return res.status(200).send("Shift booking(s) successfully deleted");
});

//--------------------------------------------------------------------------------------------------------------------------------

// ROUTE FOR ADMIN TO DELETE A USER'S BOOKING
router.delete("/:id/admin", protect, admin, async (req, res) => {
  // Retrieve booking details
  let booking = await Booking.findOne({_id: req.params.id})
    .select("bookingStart bookingEnd dateCreated duration user")
    .catch(err => res.status(400).send(err.message));

  // Retrieve user from the database
  let user = await User.findOne({_id: booking.user})
    .catch(err => res.status(400).send(err.message));

  // If user's booking does not exist, return status 404: not found
  if (!booking || booking == undefined) return res.status(404).send("User's booking does not exist");

  // Else, proceed with booking deletion at booking collection
  await Booking.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  // Send email to user to notify of booking deletion by admin
  let smtpTransport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: true, // use SSL
    auth: {
      user: process.env.SENDER_EMAIL,
      pass: process.env.SENDER_EMAIL_PW
    }
  });
  let mailOptions = {
    to: user.email,
    from: process.env.SENDER_EMAIL,
    subject: "CREA EMS | Shift Booking Notification",
    text:
      `Dear ${user.name},\n\n` +
      `This is a notification email to inform you that the following shift booking was removed by ${req.user.name}.\n\n` +
      `Booking start: ${moment(booking.bookingStart).format('LLLL')}\n` +
      `Booking end: ${moment(booking.bookingEnd).format('LLLL')}\n` +
      `Duration of booking: ${booking.duration} hours\n` +
      `Date booked: ${moment(booking.dateCreated).format('LLLL')}\n` +
      `Remarks: ${String(req.body.remarks)}\n\n` +
      "This is a computer generated email. Please do not reply to this email address."
  };
  smtpTransport.sendMail(mailOptions, function(err) {
    res.status(200).send(`Notification email sent to ${user.email}`);
    done(err, "done");
  });
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

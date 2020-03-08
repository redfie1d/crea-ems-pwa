/*
Originator: Jun Ming
Date: 27 Aug 2018
Model for shift booking
*/
const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

// Schema standard to store in mongoDB
const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookingStart: { type: Date, required: true },
  bookingEnd: { type: Date, required: true },
  dateCreated: { type: Date, required: true },
  duration: { type: Number, required: true },
  week: { type: mongoose.Schema.Types.ObjectId, ref: "Week", required: true },
  isComputed: { type: Boolean, required: true },
  split: { type: Array, required: true },
  computedDate: { type: Date, required: false },
  color: { type: String, required: false }
});

const Booking = mongoose.model("Booking", bookingSchema);

// Validate post request for user to create one or more shift bookings using Joi
function validateCreateBookings(request) {
  const schema = Joi.object().keys({
      bookingStart: Joi.date().required().label("Start Time"),
      bookingEnd: Joi.date().required().label("End Time"),
      week: Joi.objectId()
  })

  const arrSchema = Joi.array().items(schema);

  return Joi.validate(request.bookings, arrSchema);
}

// Validate request for admin to create/update a shift booking using Joi
function validateBookingByAdmin(request) {
  const schema = {
    date: Joi.string().required().min(10).max(10).label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time")
  }

  return Joi.validate(request, schema);
}

// Validate get request inputs for admin to export shift bookings within a date range using Joi
function validateExportRequest(request) {
  const schema = {
    startDate: Joi.string().required().min(10).max(10).label("From"),
    endDate: Joi.string().required().min(10).max(10).label("To")
  }

  return Joi.validate(request, schema);
}

exports.Booking = Booking;
exports.validateCreateBooking = validateCreateBookings;
exports.validateBookingByAdmin = validateBookingByAdmin;
exports.validateExportRequest  = validateExportRequest;

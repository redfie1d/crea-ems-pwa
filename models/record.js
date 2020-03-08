/*
Originator: Nathan
Date: 11 Oct 2018
Model for timesheet record
*/

const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

// Standard schema to store in Mongodb.
const recordSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recordStart: { type: Date, required: true },
    recordEnd: { type: Date, default: null },
    recordType: { type: String, required: true },
    duration: { type: Number },
    isManual: { type: Boolean, default: true },
    review: { type: String, required: true }
  });

const Record = mongoose.model('record', recordSchema);

// Validate post request to create a timesheet record
function validateRecordInput(request) {
  // define the validation schema
  const schema = {
    date: Joi.string().required().min(10).max(10).label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time"),
    shiftType: Joi.string().allow("").label("Shift Type")
  }
  return Joi.validate(request, schema);
}

// Validate post request to update a timesheet record
function validateRecordUpdate(request) {
  // define the validation schema
  const schema = {
    date: Joi.string().required().min(10).max(10).label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time"),
    shiftType: Joi.string().allow("").label("Shift Type")
  }
  return Joi.validate(request, schema);
}

module.exports.Record = Record;
module.exports.validateRecordInput = validateRecordInput;
module.exports.validateRecordUpdate = validateRecordUpdate;

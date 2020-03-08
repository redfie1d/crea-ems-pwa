/*
Originator: Pei Jun Ming
Date: 13 Jan 2019
Model for library duty
*/

const mongoose = require("mongoose");
const Joi = require("joi");

// Define appointment schema
const libraryDutySchema = new mongoose.Schema({
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location", required: true },
  libraryDutyStart: { type: Date, required: true },
  libraryDutyEnd: { type: Date, required: true }
});

const LibraryDuty = mongoose.model("LibraryDuty", libraryDutySchema);

function validateCreateLibraryDuty(request) {
  const schema = {
    inputDate: Joi.string().required().label("Date"),
    from: Joi.string().required().label("Start Time"),
    to: Joi.string().required().label("End Time")
  }
  return Joi.validate(request, schema);
}

exports.LibraryDuty = LibraryDuty;
exports.validateCreateLibraryDuty = validateCreateLibraryDuty;

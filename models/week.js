/*
Originator: Hidayatullah
Date: 10 Oct 2018
Model for booking weeks
*/

const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const weekSchema = new mongoose.Schema({
  creator: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  bookingDeadline: { type: Date, required: true },
  workingDays: { type: Array, required: true },
  string: { type: String, required: true },
  dateCreated: { type: Date, required: true }
});

const week = mongoose.model("Week", weekSchema);

function validateCreateWeek(request) {
  const schema = {
    fromDate: Joi.date().required().label("From"),
    toDate: Joi.date().required().label("To"),
    bookingDeadline: Joi.date().required().label("Deadline"),
    workingDays: Joi.array().items(Joi.object().keys({
      day: Joi.string(),
      isWorkingDay: Joi.boolean()
    })).required()
  }
  return Joi.validate(request, schema);
}

exports.Week = week;
exports.validateCreateWeek = validateCreateWeek;

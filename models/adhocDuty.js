/*
Originator: Hidayatullah
Date: 28 Feb 2019
Model for adhoc duty
*/

// Require modules
const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

const adhocDutySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  remarks: { type: String, required: true }
});

const AdhocDuty = mongoose.model("adhocDuty", adhocDutySchema);

// function to validate new adhoc duties
function validateAdhocDutyInput(request) {
  const schema = {
    startTime: Joi.date().required().label("Start Time"),
    endTime: Joi.date().required().label("End Time"),
    remarks: Joi.string().required().min(1).label("Remarks")
  }

  return Joi.validate(request, schema);
}

// Validate put request to update an adhoc duty
function validateAdhocDutyUpdate(request) {
  // define the validation schema
  const schema = {
    date: Joi.string().required().min(10).max(10).label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time"),
    remarks: Joi.string().required().min(1).label("Remarks")
  }
  return Joi.validate(request, schema);
}

exports.AdhocDuty = AdhocDuty;
exports.validateAdhocDutyInput = validateAdhocDutyInput;
exports.validateAdhocDutyUpdate = validateAdhocDutyUpdate;

/*
Originator: Hidayatullah
Date: 25 Feb 2019
Model for configurations
*/

const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

// configuration schema
// temp configuration settings for kpi checks
const configSchema = {
  kpi: { type: Number, required: true },
  allCases: { type: Array, required: true },
  unsuccessfulCases: { type: Array, required: true },
  statusList: { type: Array, required: true },
  appointmentSurveyCT: { type: String, required: true },
  appointmentSurveyMOC: { type: String, required: true },
  phoneSurveyCT: { type: String, required: true },
  minHoursPerWeek: { type: Number, required: true },
  maxHoursPerDay: { type: Number, required: true },
  noOfWorkStations: { type: Number, required: true },
  creaAddress: { type: String },
  maxDistanceFromCrea: { type: Number },
}

const Config = mongoose.model("config", configSchema);

// function to validate incoming config update request
function validateConfig(request) {
  const schema = {
    kpi: Joi.number().integer().positive().label("KPI"),
    allCases: Joi.array().items(Joi.string()),
    unsuccessfulCases: Joi.array().items(Joi.string()),
    statusList: Joi.array().items(Joi.string()),
    appointmentSurveyCT: Joi.string(),
    appointmentSurveyMOC: Joi.string(),
    phoneSurveyCT: Joi.string(),
    minHoursPerWeek: Joi.number().integer().positive().min(1).allow(0).label("Minimum Hours / Week"),
    maxHoursPerDay: Joi.number().integer().positive().min(1).label("Maximum Hours / Day"),
    noOfWorkStations: Joi.number().integer().positive().min(1).label("Number of Workstations"),
    creaAddress: Joi.string().label("CREA Office Postal Code"),
    maxDistanceFromCrea: Joi.number().integer().positive().min(1).label("Max Distance Away")
  };
  return Joi.validate(request, schema);
}

exports.Config = Config;
exports.validateConfig = validateConfig;

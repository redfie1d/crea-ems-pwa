/*
Originator: Pei Jun Ming
Date: 18 Jan 2019
Model for location
*/

const mongoose = require("mongoose");
const Joi = require("joi");

// Define location schema
const locationSchema = new mongoose.Schema({
  locationName: String,
  address: String,
  postalCode: String
});

const Location = mongoose.model("Location", locationSchema);

function validateCreateLocation(request) {
  const schema = {
    locationName: Joi.string().required().label("Location Name"),
    address: Joi.string().required().label("Address"),
    postalCode: Joi.string().required().min(6).max(6).label("Postal Code")
  }
  return Joi.validate(request, schema);
}

exports.Location = Location;
exports.validateCreateLocation = validateCreateLocation;

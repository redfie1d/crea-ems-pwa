/*
Originator: Jun Ming
Date: 15 Jan 2019
Model for library duty appointment
*/

const mongoose = require("mongoose");

// Define appointment schema
const appointmentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  libraryDuty: { type: mongoose.Schema.Types.ObjectId, ref: "LibraryDuty", required: true },
  dateCreated: { type: Date, default: Date.now() },
  status: { type: String }
});

const Appointment = mongoose.model("Appointment", appointmentSchema);

exports.Appointment = Appointment;
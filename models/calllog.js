/*
Originator: Hidayatullah
Date: 28 Feb 2019
Model for call log
*/

// Name: Pei Jun Ming
// Date Created: 27 October 2018

const mongoose = require("mongoose");

// Schema standard to store in mongoDB
const callLogSchema = new mongoose.Schema({
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  respondentId: { type: String },
  wave: { type: String },
  contactList: { type: String },
  contactListByCall: { type: String },
  modeOfContact: { type: String },
  caseType: { type: String },
  followUp: { type: String },
  status: { type: String },
  createdDate: { type: Date },
  successfulCall: { type: Boolean }
});

const CallLog = mongoose.model("CallLog", callLogSchema);

exports.CallLog = CallLog;
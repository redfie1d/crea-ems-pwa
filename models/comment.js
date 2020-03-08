/*
Originator: Hidayatullah
Date: 11 Mar 2019
Model for comment
*/

const mongoose = require("mongoose");
const Joi = require("joi");
Joi.objectId = require("joi-objectid")(Joi);

// Comment schema
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  remarks: { type: String, required: true }
});

const Comment = mongoose.model('comment', commentSchema);

// function to validate comment input http request inputs using Joi
function validateCommentInput(request) {
  // define the validation schema
  const schema = {
    startTime: Joi.date().required().label("Start Time"),
    endTime: Joi.date().required().label("End Time"),
    remarks: Joi.string().required().label("Remarks")
  };

  return Joi.validate(request, schema);
}


module.exports.Comment = Comment;
module.exports.validateCommentInput = validateCommentInput;

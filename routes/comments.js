/*
Originator: Hidayatullah
Date: 11 Mar 2019
Routes for comments endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();
const moment = require("moment");

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { Comment, validateCommentInput } = require("../models/comment");
const { User } = require("../models/user");
const { Booking } = require("../models/booking");

//-------------------------------------------------------------------------------------------------------------------------------

// Post request to create comments
router.post("/create/:bookingId", protect, admin || superadmin, async(req, res) => {
  // validate booking
  let booking = await Booking.findOne({ _id: req.params.bookingId })
    .catch(err => res.status(400).send(err.message));

  if(!booking) return res.status(404).send("Shift booking does not exist");

  // if booking does not have split
  if(booking.split === undefined) return res.status(400).send("Shift booking has not been computed yet");

  // Validate request body fields using joi
  const { error } = validateCommentInput(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let startTime = moment(req.body.startTime).format()
  let endTime = moment(req.body.endTime).format()

  // create comments obj
  let comment = new Comment({
    user: booking.user,
    createdBy: req.user.id,
    booking: req.params.bookingId,
    startTime: startTime,
    endTime: endTime,
    remarks: req.body.remarks
  });

  // save into db
  comment.save();

  // TO REVIEW AGAIN LATER
  // append to the proper split booking
  // booking.split.forEach(splitBooking => {
  //   if(startTime.isBetween(splitBooking.startTime, splitBooking.endTime) && endTime.isBetween(splitBooking.startTime, splitBooking.endTime)) {
  //     splitBooking.comment = comment;
  //   }
  // });
  //
  // // save booking
  // await Booking.updateOne({ _id: booking.bookingId });

  return res.status(200).send("Comment successfully recorded");
});

//-------------------------------------------------------------------------------------------------------------------------------

// route for admins to get comments by user
router.get("/user/:userId", protect, admin || superadmin, async(req, res) => {
  // validate params
  let user = await User.findOne({ _id: req.params.userId })
    .catch(err => res.status(400).send(err.message));

  if(!user) return res.status(404).send("User does not exist");

  let comments = Comment.find({ user: req.params.userId })
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(comments);
});

//-------------------------------------------------------------------------------------------------------------------------------

// route for admins to get comment by booking
router.get("/booking/:bookingId", protect, admin || superadmin, async(req, res) => {
  // validate params
  let booking = await Booking.findOne({ _id: req.params.bookingId })
    .catch(err => res.status(400).send(err.message));

  if(!booking) return res.status(404).send("Shift booking does not exist");

  let comments = Comment.find({ booking: req.params.bookingId })
    .catch(err => res.status(400).send(err.message));

  return res.status(200).send(comments);
});

//-------------------------------------------------------------------------------------------------------------------------------

router.delete("/:id", protect, admin || superadmin, async(req, res) => {
  // validate params
  let comment = await Comment.findOne({ _id: req.params.id })
    .catch(err => res.status(400).send(err.message));

  if(!comment) return res.status(404).send("Comment does not exist");

  comment = await Comment.deleteOne({ _id: req.params.id })
    .catch(err => res.status(400).send(err.message));

  if(comment.n === 0) {
    return res.status(404).send("Failed to delete comment");
  }

  return res.status(200).send("Comment deleted successfully");
});

//-------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

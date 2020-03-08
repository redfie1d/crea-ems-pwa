/*
Originator: Jun Ming
Date: 18 Jan 2019
Routes for location management endpoints
*/

// Require node modules
const express = require("express");
const router = express.Router();

// Require middleware
const protect = require("../middleware/protect");
const admin = require("../middleware/admin");
const superadmin = require("../middleware/superadmin");

// Require models
const { Location, validateCreateLocation } = require("../models/location");
const { LibraryDuty } = require("../models/libraryduty");
const { Appointment } = require("../models/appointment");

//--------------------------------------------------------------------------------------------------------------------------------

// Post request endpoint to create a location
router.post("/", protect, admin || superadmin, async (req, res) => {
  // if error, return 400: bad request
  const { error } = validateCreateLocation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if db already has same location details
  let locationNameExist = await Location.findOne({ locationName: req.body.locationName }).catch(err => res.status(400).send(err.message));
  let addressExist = await Location.findOne({ address: req.body.address }).catch(err => res.status(400).send(err.message));
  let postalCodeExist = await Location.findOne({ postalCode: req.body.postalCode }).catch(err => res.status(400).send(err.message));

  let duplicates = [];
  if (locationNameExist != undefined) {
    duplicates.push(" Location Name ");
  }

  if (addressExist != undefined) {
    duplicates.push(" Address ");
  }

  if (postalCodeExist != undefined) {
    duplicates.push(" Postal Code ");
  }

  // If db contains a location with similar details
  if (duplicates.length > 0) {
    return res.status(400).send("Existing Duplicate(s): [" + duplicates + "]");
  }

  // Create new location
  location = new Location({
    locationName: req.body.locationName,
    address: req.body.address,
    postalCode: req.body.postalCode
  });

  // Save in mongodb
  location.save();

  return res.status(200).send("Location created successfully.");
});

//--------------------------------------------------------------------------------------------------------------------------------

// Get request endpoint to retrieve all locations
router.get("/", protect, async (req, res) => {
  let locations = await Location.find({}).sort({locationName: "asc"}).catch(err => res.status(400).send(err.message));

  return res.status(200).send(locations);
});

//--------------------------------------------------------------------------------------------------------------------------------

// Delete request endpoint to delete a location
router.delete("/:id", protect, admin || superadmin, async (req, res) => {
  // First, check if there's any library duties that have been created using this location
  let libraryDuties = await LibraryDuty.find({ location: req.params.id }).catch(err => res.status(400).send(err.message));

  // If there are library duties
  if (libraryDuties.length > 0) {
    
    // Loop through the library duties and delete appointments linked to each duty
    libraryDuties.forEach(async (duty) => {
      await Appointment.deleteMany({ libraryDuty: duty._id }).catch(err => res.status(400).send(err.message));
    });

    // Delete all library duties created using this location
    await LibraryDuty.deleteMany({ location: req.params.id }).catch(err => res.status(400).send(err.message));
  }

  // Remove location with given id
  await Location.deleteOne({ _id: req.params.id }).catch(err => res.status(400).send(err.message));

  return res.status(200).send("Location deleted successfully.");
});

//--------------------------------------------------------------------------------------------------------------------------------

module.exports = router;

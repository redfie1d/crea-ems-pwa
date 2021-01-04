const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const fileUpload = require('express-fileupload');
require("dotenv").config();

// Require routes
const users = require("./routes/users");
const authenticate = require("./routes/authenticate");
const forgot = require("./routes/forgot");
const bookings = require("./routes/bookings");
const weeks = require("./routes/weeks");
const records = require("./routes/records");
const upload = require("./routes/upload");
const exportCsv = require("./routes/export");
const comments = require("./routes/comments");
const locations = require("./routes/locations");
const libraryDuties = require("./routes/libraryduties");
const appointments = require("./routes/appointments");
const computations = require("./routes/computations");
const dashboard = require("./routes/dashboard");
const attendance = require("./routes/attendance");
const configs = require("./routes/configs");
const adhocDuties = require("./routes/adhocDuties");

// Init App
const app = express();

// Init Server
const server = require("http").Server(app);

// Use middleware functions
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb', extended: true }));
app.use(fileUpload());
app.use(cors());

// Allow CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin, X-Requested-With, Content-Type, Accept, x-auth-token"
  );
  next();
});

// Use routes
app.use("/api/users", users);
app.use("/api/authenticate", authenticate);
app.use("/api/forgot", forgot);
app.use("/api/bookings", bookings);
app.use("/api/records", records);
app.use("/api/weeks", weeks);
app.use('/api/upload', upload);
app.use('/api/export', exportCsv);
app.use('/api/comments', comments);
app.use('/api/locations', locations);
app.use('/api/libraryduties', libraryDuties);
app.use('/api/appointments', appointments);
app.use('/api/computations', computations);
app.use('/api/dashboard', dashboard);
app.use('/api/attendance', attendance);
app.use('/api/configs', configs);
app.use('/api/adhocDuties', adhocDuties);

// Connect to MongoDB
mongoose
  .connect(
    process.env.MONGO_DB,
    { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true }
  )
  .then(() => console.log("Connected to MongoDB..."))
  .catch(err => console.error("Could not connect to MongoDB..."));

// Get Mongoose to use the global promise library
mongoose.Promise = global.Promise;
//Get the default connection
var db = mongoose.connection;

// Bind connection to error event (to get notification of connection errors)
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Listen port
server.listen(process.env.BACKEND_PORT, () => {
  console.log("Server running on " + process.env.BACKEND_PORT);
});

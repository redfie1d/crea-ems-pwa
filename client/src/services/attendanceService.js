/*
Originator: Brandon
Date: 04 Mar 2019
Service for attendance
*/

import http from "./httpService";

const attendanceEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/attendance";

// Clock in attendance timesheet record (user)
export async function clockIn(data) {
  var body = {};
  body.lat = data.lat;
  body.lng = data.lng;

  var result = await http.post(attendanceEndpoint, body);
  return result.data;
}

// Clock in attendance timesheet record (user)
export async function clockOut(data) {
  var body = {};
  body.lat = data.lat;
  body.lng = data.lng;

  var result = await http.put(attendanceEndpoint, body);
  return result.data;
}

export default {
  clockIn,
  clockOut
};

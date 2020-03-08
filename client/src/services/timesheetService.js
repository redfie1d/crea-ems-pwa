/*
Originator: ?
Date: ?
Service for timesheet records
*/

import http from "./httpService";
import moment from "moment";

const recordsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/records";
const commentsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/comments";
const userEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/users";

function recordUrl(id) {
  return `${recordsEndpoint}/${id}`;
}

function commentUrl(id) {
  return `${commentsEndpoint}/${id}`;
}

function userUrl(id) {
  return `${userEndpoint}/${id}`;
}

// Create timesheet record (user)
export async function createRecords(data) {
  // Initialize parameters object with data values
  const endpoint = recordsEndpoint + "/";

  var body = {};
  body.date = data.date;
  body.startTime = data.startTime;
  body.endTime = data.endTime;
  body.shiftType = data.shiftType;

  const result = await http.post(endpoint, body);
  return result.data;
}

// Get all timesheet records (users)
export async function getAllRecords() {
  const { data } = await http.get(recordsEndpoint + "/");
  return data;
}

// Get the months with timesheet records created (user)
export async function getMonthsOfRecords() {
  const { data } = await http.get(recordsEndpoint + "/months");
  return data;
}

// Retrieve a timesheet record by record id
export async function retrieveRecord(id) {
  const { data } = await http.get(recordUrl(id));
  return data;
}

// Retrieve a timesheet record by user id
export async function retrieveRecordsByUser(id) {
  var { data } = await http.get(recordsEndpoint+"/user/"+ id + "/admin");
  var i;
  var timesheet = [];

  for (i = 0; i < data.length; i++) {
    let recordStart = moment(data[i].recordStart);
    const bookDate = recordStart.format("MM/DD/YYYY");
    const bookStart = recordStart.format("h:mma");
    const bookEnd = moment(data[i].recordEnd).format("h:mma");
    const recordType = data[i].recordType;
    var obj = {
      date: bookDate,
      startTime: bookStart,
      endTime: bookEnd,
      type: recordType
    };
    timesheet.push(obj);
  }

  return timesheet;
}

export async function updateRecord(data) {
  // Initialize parameters object with data values
  var body = {};
  body.date = data.date;
  body.startTime = data.startTime;
  body.endTime = data.endTime;
  body.shiftType = data.shiftType;

  var result  = await http.put(recordUrl(data.id), body);
  return result.data;
}

export async function deleteRecord(id) {
  var { data } = await http.delete(recordUrl(id));
  return data;
}

export async function InputComments(results) {
  //convert into datetime
  if (results.date === "" || results.startTime === "" || results.endTime === ""){
      throw String("blank parameters");
  }
  const year = Number(results.date.substring(0,4));
  const month = Number(results.date.substring(5,7));
  const day = Number(results.date.substring(8));
  const startHour = Number(results.startTime.substring(0,2));
  const startMin = results.startTime.substring(3);
  const endHour = Number(results.endTime.substring(0,2));
  const endMin = Number(results.endTime.substring(3));
  var recordStart = new moment([year,month-1,day,startHour,startMin]);
  var recordEnd = new moment([year,month-1,day,endHour,endMin]);
  var obj = {
      "usercomment": results.comment,
      "recordStart": recordStart,
      "recordEnd": recordEnd,
      "user" : results.userSelect
  }
  await http.post(commentsEndpoint, obj);
}

export async function getAllComments() {
  const endpoint = commentsEndpoint + "/";
  var { data } = await http.get(endpoint);
  var i;
  var commentRecords = [];

  for (i = 0; i < data.length; i++) {
    let recordStart = moment(data[i].recordStart);
    const bookDate = recordStart.format("MMM D, YYYY");
    const bookStart = recordStart.format("h:mma");
    const bookEnd = moment(data[i].recordEnd).format("h:mma");
    const user = data[i].user;
    const usercomment = data[i].usercomment;
    const commentid = data[i]._id;
    var obj = {
      date: bookDate,
      startTime: bookStart,
      endTime: bookEnd,
      user: user,
      comment: usercomment,
      commentid: commentid
    };
    commentRecords.push(obj);
  }

  return commentRecords;
}

export async function deleteComment(id) {
  var { data } = await http.delete(commentUrl(id));
  return data;
}

export async function retrieveUser(id) {
  var data = await http.get(userUrl(id));
  var name = data.data.name;
  return name;
}

export async function getAllUsersWithOpenRecords() {
  var { data } = await http.get(recordsEndpoint+"/open/records");
  return data;
}

export async function searchUserRecordsWithStatus(userId, status) {
  var { data } = await http.get(recordsEndpoint+"/userWithStatus/"+userId+"/"+status);
  return data;
}

export default {
  createRecords,
  getAllRecords,
  getMonthsOfRecords,
  retrieveRecord,
  retrieveRecordsByUser,
  updateRecord,
  deleteRecord,
  InputComments,
  getAllComments,
  deleteComment,
  retrieveUser,
  getAllUsersWithOpenRecords,
  searchUserRecordsWithStatus
};

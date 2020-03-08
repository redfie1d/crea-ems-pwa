/*
Originator: Hidayatullah
Date: 11 Mar 2019
Service for adhoc duties
*/

import http from "./httpService";
import moment from "moment";

const adhocDutiesEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/adhocDuties";

export async function createAdhocDuty(adhocDuty) {
  // format start time and end time
  let date = moment(adhocDuty.booking.bookingStart);
  let startTime = date.clone().set({ "hour": adhocDuty.startTime.substring(0, 2), "minute": adhocDuty.startTime.substring(3) }).format();
  let endTime = date.clone().set({ "hour": adhocDuty.endTime.substring(0, 2), "minute": adhocDuty.endTime.substring(3) }).format();

  // create obj to append to request body
  let obj = {
    startTime: startTime,
    endTime: endTime,
    remarks: adhocDuty.remarks
  }
  var { data } = await http.post(adhocDutiesEndpoint+"/"+adhocDuty.user._id+"/"+adhocDuty.booking._id, obj);
  return data;
}

export async function getAdhocDutiesWeeksSorted() {
  var { data } = await http.get(adhocDutiesEndpoint+"/weeks");
  return data;
}

export async function getAdhocDutiesByWeek(weekId) {
  var { data } = await http.get(adhocDutiesEndpoint+"/week/"+weekId);
  return data;
}

export async function getAdhocDuty(id) {
  var { data } = await http.get(adhocDutiesEndpoint+"/"+id);
  return data;
}

export async function updateAdhocByAdmin(data) {
  // Initialize parameters object with data values
  var body = {};
  body.date = data.date;
  body.startTime = data.startTime;
  body.endTime = data.endTime;
  body.remarks = data.remarks;

  var result  = await http.put(adhocDutiesEndpoint+"/"+data.id, body);
  return result.data;
}

export async function deleteAdhocDuty(dutyId) {
  var { data } = await http.delete(adhocDutiesEndpoint+"/deleteOne/"+dutyId);
  return data
}

export default {
  createAdhocDuty,
  getAdhocDutiesWeeksSorted,
  getAdhocDutiesByWeek,
  getAdhocDuty,
  updateAdhocByAdmin,
  deleteAdhocDuty
};

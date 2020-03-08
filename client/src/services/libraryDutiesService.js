/*
Originator: Brandon
Date: 13 Jan 2019
Service for library duties and appointments
*/

import http from "./httpService";

const locationsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/locations";
const libraryDutiesEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/libraryduties";
const appointmentsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/appointments";

// Create locations (admin)
export async function createLocation(data) {
  // Initialize parameters object with data values
  const endpoint = locationsEndpoint + "/";

  var body = {};
  body.locationName = data.locationName;
  body.address = data.address;
  body.postalCode = data.postalCode;

  const result = await http.post(endpoint, body);
  return result.data;
}

// Get all library duties (admin)
export async function getLocations() {
  const { data } = await http.get(locationsEndpoint + "/");
  return data;
}

// Delete a location by id (admin)
export async function deleteLocation(id) {
  const { data } = await http.delete(locationsEndpoint + "/" + id);
  return data;
}

// Create library duties (admin)
export async function createLibraryDuties(location, data) {
  // Initialize parameters object with data values
  const endpoint = libraryDutiesEndpoint + "/" + location;

  var body = {};
  body.inputDate = data.inputDate;
  body.from = data.from;
  body.to = data.to;

  const result = await http.post(endpoint, body);
  return result.data;
}

// Get all library duties (admin)
export async function getLibraryDuties() {
  const { data } = await http.get(libraryDutiesEndpoint + "/");
  return data;
}

// Get the months with library duties created (user)
export async function getMonthsOfLibraryDuties() {
  const { data } = await http.get(libraryDutiesEndpoint + "/months");
  return data;
}

// Delete library duty by id (admin)
export async function deleteLibraryDuties(id) {
  const { data } = await http.delete(libraryDutiesEndpoint + "/" + id);
  return data;
}

// Book appointment by library duty id (user)
export async function bookAppointment(libraryDutyId) {
  const { data } = await http.post(appointmentsEndpoint + "/" + libraryDutyId);
  return data;
}

// Get all appointments
export async function getAppointments() {
  const { data } = await http.get(appointmentsEndpoint + "/");
  return data;
}

// Get all appointments of logged-in user (user)
export async function getAppointmentsByUser() {
  const { data } = await http.get(appointmentsEndpoint + "/me");
  return data;
}

// Get all months with appointments
export async function getMonthsOfAppointments() {
  const { data } = await http.get(appointmentsEndpoint + "/months");
  return data;
}

// Get all appointments at location
export async function getAppointmentsOfLocation(locationId) {
  const { data } = await http.get(appointmentsEndpoint + "/location/" + locationId);
  return data;
}

// Update appointment by appointment id (admin)
export async function updateAppointmentByAdmin(appointmentId) {
  const { data } = await http.put(appointmentsEndpoint + "/" + appointmentId + "/admin");
  return data;
}

// Delete appointment by appointment id (user)
export async function deleteAppointment(appointmentId) {
  const { data } = await http.delete(appointmentsEndpoint + "/" + appointmentId);
  return data;
}

// Delete appointment by appointment id (admin)
export async function deleteAppointmentByAdmin(appointmentId, remarks) {
  if (!remarks) {
    throw String("NeedRemarks");
  }
  const { data } = await http.delete(appointmentsEndpoint + "/" + appointmentId + "/admin", {data:{remarks: remarks}});
  return data;
}

export default {
  createLocation,
  getLocations,
  deleteLocation,
  createLibraryDuties,
  getLibraryDuties,
  getMonthsOfLibraryDuties,
  deleteLibraryDuties,
  bookAppointment,
  getAppointments,
  getAppointmentsByUser,
  getMonthsOfAppointments,
  getAppointmentsOfLocation,
  updateAppointmentByAdmin,
  deleteAppointment,
  deleteAppointmentByAdmin
};

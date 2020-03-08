/*
Originator: Brandon
Date: 17 Feb 2019
Service for admin dashboard
*/

import http from "./httpService";

const dashboardEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/dashboard";

// Get all user booked shifts this week
export async function getUsersThisWeek() {
  const { data } = await http.get(dashboardEndpoint + "/countOfUsersWhoBookedThisWeek");
  return data;
}

// Get total hours of shifts booked this week
export async function getShiftsTotalHoursThisWeek() {
  const { data } = await http.get(dashboardEndpoint + "/totalHoursBookedThisWeek");
  return data;
}

// Get total hours of shifts booked this month
export async function getShiftsTotalHoursThisMonth() {
  const { data } = await http.get(dashboardEndpoint + "/totalHoursBookedThisMonth");
  return data;
}

// Get total hours booked for each shift weeks up to 6 weeks from current week
export async function getTotalHoursForShiftsWeek() {
  const { data } = await http.get(dashboardEndpoint + "/pastSixWeeksTotalHoursBooked");
  return data;
}

// Get total successful and unsucessful calls for each month up to 6 month from current month
export async function getCalls() {
  const { data } = await http.get(dashboardEndpoint + "/pastSixMonthsCalllogsBreakdown");
  return data;
}

export async function getAppointmentsOfCurrentMonth() {
  const { data } = await http.get(dashboardEndpoint + "/countOfAppointmentsForCurrentMonth");
  return data;
}

export async function getCurrent() {
  const { data } = await http.get(dashboardEndpoint + "/currentWeek");
  return data;
}

export default {
  getUsersThisWeek,
  getShiftsTotalHoursThisWeek,
  getShiftsTotalHoursThisMonth,
  getTotalHoursForShiftsWeek,
  getCalls,
  getAppointmentsOfCurrentMonth,
  getCurrent
}

/*
Originator: Hidayatullah
Date: 20 Oct 2018
Service for weeks schedule / shift bookings
*/

import http from "./httpService";
import moment from "moment";

const weeksEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/weeks";
const bookingsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/bookings";

// function to create a shift booking week (for managers)
export async function createShiftBookingWeek(data) {
  // validate fromDate to ensure that the day selected is a monday
  if(moment(data.fromDate).day() !== 1) {
    throw String("notMonday");
  }

  // initialize date array and adding boolean values
  var daysArr = [];
  daysArr.push({day:"Monday", isWorkingDay: data.workingDays.monday.isWorkingDay});
  daysArr.push({day:"Tuesday", isWorkingDay: data.workingDays.tuesday.isWorkingDay});
  daysArr.push({day:"Wednesday", isWorkingDay: data.workingDays.wednesday.isWorkingDay});
  daysArr.push({day:"Thursday", isWorkingDay: data.workingDays.thursday.isWorkingDay});
  daysArr.push({day:"Friday", isWorkingDay: data.workingDays.friday.isWorkingDay});

  var fromDate = moment(data.fromDate).format();
  var toDate = moment(data.fromDate).add(4, "d").format();

  // getting booking deadline datetime in strings
  var year = data.bookingDeadline.substring(0,4);
  var month = Number(data.bookingDeadline.substring(5,7)) - 1;
  var day = data.bookingDeadline.substring(8);
  var hour = data.bookingDeadlineTime.substring(0,2);
  var minute = data.bookingDeadlineTime.substring(3);
  var bookingDeadline = new Date(year, month.toString(), day, hour, minute);

  // Initialize parameters object with data values
  var params = {
    fromDate: fromDate,
    toDate: toDate,
    bookingDeadline: bookingDeadline,
    workingDays: daysArr
  };

  await http.post(weeksEndpoint, params);
}

export async function getAllShiftBookingWeeks() {
  const { data } = await http.get(weeksEndpoint);
  return data;
}

export async function getShiftBookingWeeksSorted() {
  const { data } = await http.get(weeksEndpoint+"/sort");
  return data;
}

export async function getPrevWeeks() {
  var { data } = await http.get(weeksEndpoint+"/prev/byMonth");
  return data;
}

export async function deleteShiftBookingWeek(id) {
  const { data } = await http.delete(weeksEndpoint+"/"+id);
  return data;
}

export async function createBookings(selectedTimes, week) {
  var now = new Date();
  if(now > new Date(week.bookingDeadline)) {
    throw String("Deadline");
  }
  if(selectedTimes.length === 0) {
    throw String("noBookings");
  }

  var fromDate = new Date(week.fromDate);
  var toDate = new Date(week.toDate);
  var weekDates = await getDates(fromDate, toDate);
  var arr = [];
  for(var i = 0; i < 5; i++) {
    var innerArr = [];
    for(var y = 0; y < selectedTimes.length; y++) {
      var id = selectedTimes[y];
      if(Number(id.substring(0,1)) === i) {
        innerArr.push(id);
      }
    }
    if(innerArr.length !== 0) {
      innerArr.sort();
      arr.push(innerArr);
    }
  }

  var bookings = [];
  arr.forEach((day) => {
    var dayBookings = [];
    if(day.length === 1) {
      dayBookings.push([day[0].split("-")[0], day[0].split("-")[1], day[0].split("-")[2]]);
    } else {
      var check = "";
      var startIndex = 0;
      for(var x = 0; x < day.length; x++) {
        var elements = day[x].split("-");
        if(x === 0) {
          check = elements[2];
        } else {
          // if there is a break
          if(elements[1] !== check) {
            // add start time and end time to dayBookings array
            dayBookings.push([elements[0], day[startIndex].split("-")[1], day[x-1].split("-")[2]]);
            // new start at index
            startIndex = x;

            if(x === day.length-1) {
              dayBookings.push([elements[0], day[startIndex].split("-")[1], day[x].split("-")[2]]);
            }

          } else if(x === day.length-1){
            // get from startIndex to current index
            dayBookings.push([elements[0], day[startIndex].split("-")[1], day[x].split("-")[2]]);
          }
          check = elements[2];
        }
      }
    }
    dayBookings.forEach((arr) => {
      var bookingStart = new Date(weekDates[arr[0]].substring(0,4), (Number(weekDates[arr[0]].substring(5,7)) - 1).toString(), weekDates[arr[0]].substring(8), arr[1]);
      var bookingEnd = new Date(weekDates[arr[0]].substring(0,4), (Number(weekDates[arr[0]].substring(5,7)) - 1).toString(), weekDates[arr[0]].substring(8), arr[2]);
      // push booking to bookings array
      var booking = {
        "bookingStart": moment(bookingStart).format(),
        "bookingEnd": moment(bookingEnd).format(),
        "week": week._id
      };
      bookings.push(booking);
    });
  });
  await http.post(bookingsEndpoint, {"bookings": bookings});
}

export async function createBookingForAdmin(data) {
  var body = {};
  body.date = data.date;
  body.startTime = data.startTime;
  body.endTime = data.endTime;

  const result = await http.post(bookingsEndpoint+"/user/"+data.userId+"/admin", body);
  return result.data;
}

export async function getBookingForAdmin(bookingId) {
  const { data } = await http.get(bookingsEndpoint+"/"+bookingId+"/admin");
  return data;
}

export async function getBookingsForAdmin(weekId) {
  const { data } = await http.get(bookingsEndpoint+"/week/"+weekId+"/admin");
  return data;
}

export async function getAllUserBookings(weekId) {
  const { data } = await http.get(bookingsEndpoint+"/week/"+weekId+"/allUsers");
  return data;
}

export async function getShiftBookingPointer(weekId) {
  const { data } = await http.get(bookingsEndpoint+"/week/"+weekId+"/pointer");
  return data;
}

export async function getPredictedBookings() {
  const { data } = await http.get(bookingsEndpoint+"/analytics/predictive");
  return data;
}

export async function getShiftBookingsByUserAndWeek(userId, weekId) {
  var { data } = await http.get(bookingsEndpoint+"/byUserAndWeek/"+userId+"/"+weekId);
  return data;
}

export async function updateBookingByAdmin(data) {
  // Initialize parameters object with data values
  var body = {};
  body.date = data.date;
  body.startTime = data.startTime;
  body.endTime = data.endTime;

  var result  = await http.put(bookingsEndpoint + "/"+ data.id + "/admin", body);
  return result.data;
}

export async function deleteBookingByUser(id) {
  const { data } = await http.delete(bookingsEndpoint+"/"+id);
  return data;
}

export async function deleteBookingByAdmin(id, remarks) {
  const { data } = await http.delete(bookingsEndpoint+"/"+id+"/admin", {data:{remarks: remarks}});
  return data;
}

/*
Helper functions
*/
async function getDates(startDate, stopDate) {
  var dateArray = [];
  var currentDate = moment(startDate);
  var endDate = moment(stopDate);
  while (currentDate <= endDate) {
    dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
    currentDate = moment(currentDate).add(1, 'days');
  }
  return dateArray;
}

export default {
  createShiftBookingWeek,
  getAllShiftBookingWeeks,
  getShiftBookingWeeksSorted,
  getPrevWeeks,
  deleteShiftBookingWeek,
  createBookings,
  createBookingForAdmin,
  getBookingForAdmin,
  getBookingsForAdmin,
  getAllUserBookings,
  getShiftBookingPointer,
  getPredictedBookings,
  getShiftBookingsByUserAndWeek,
  updateBookingByAdmin,
  deleteBookingByAdmin,
  deleteBookingByUser
}

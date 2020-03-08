/*
Originator: Brandon
Date: 17 Mar 2019
Service for export pdf / csv
*/

import http from "./httpService";

const exportEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/export";

export async function getComputedBookings(fromDate, toDate) {
  if(!fromDate && !toDate) {
    throw String("missingDates");
  } else if(!fromDate || !toDate) {
    throw String("missingDates");
  }

  const { data } = await http.get(exportEndpoint + "/pdf/" + fromDate + "/" + toDate);
  return data;
}

export async function exportCsv(fromDate, toDate){
  if(!fromDate && !toDate) {
    throw String("missingDates");
  } else if(!fromDate || !toDate) {
    throw String("missingDates");
  }

  const file = await http.get(exportEndpoint + "/csv/" + fromDate + "/" + toDate);
  return file;
}

export default {
    getComputedBookings,
    exportCsv
}

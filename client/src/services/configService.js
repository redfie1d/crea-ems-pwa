/*
Originator: Hidayatullah
Date: 27 Feb 2019
Service for configurations
*/

import http from "./httpService";

const configsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/configs";

export async function getAllConfigurations() {
  var { data } = await http.get(configsEndpoint+"/");
  return data
}

export async function updateConfigurations(data) {
  var result  = await http.put(configsEndpoint+"/", data);
  return result.data;
}

export async function clearWeeks(fromDate, toDate) {
  if(!fromDate && !toDate) {
    throw String("missingDates");
  } else if(!fromDate || !toDate) {
    throw String("missingDates");
  }

  const file = await http.get(configsEndpoint + "/weeks/" + fromDate + "/" + toDate);
  return file;
}

export async function clearLibraries(fromDate, toDate) {
  if(!fromDate && !toDate) {
    throw String("missingDates");
  } else if(!fromDate || !toDate) {
    throw String("missingDates");
  }

  const file = await http.get(configsEndpoint + "/library/" + fromDate + "/" + toDate);
  return file;
}

export async function clearCalls(fromDate, toDate) {
  if(!fromDate && !toDate) {
    throw String("missingDates");
  } else if(!fromDate || !toDate) {
    throw String("missingDates");
  }

  const { data } = await http.delete(configsEndpoint + "/calls/" + fromDate + "/" + toDate);
  return data;
}

export async function deleteUser(userId) {
  const file = await http.get(configsEndpoint + "/user/" + userId);

  if (file.data === "Admin deleted") {
    throw String("deleteAdmin");
  }

  return file;
}

export default {
  getAllConfigurations,
  updateConfigurations,
  clearWeeks,
  clearLibraries,
  clearCalls,
  deleteUser
};

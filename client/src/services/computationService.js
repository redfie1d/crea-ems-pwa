/*
Originator: Hidayatullah
Date: 12 Feb 2019
Computation of KPI records service
*/

import http from "./httpService";

const computationsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/computations";

export async function computeByDate(fromDate, toDate) {
  const { data } = await http.post(computationsEndpoint+"/byDate/"+fromDate+"/"+toDate);
  return data;
}

export async function confirmComputation(results) {
  const { data } = await http.post(computationsEndpoint+"/confirm", { results: results });
  return data;
}

export default {
  computeByDate,
  confirmComputation
}

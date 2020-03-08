/*
Originator: Hidayatullah
Date: 11 Mar 2019
Service for comments
*/

import http from "./httpService";

const commentsEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/comments";

export async function saveComments(bookingId, remarks) {
  const { data } = await http.post(commentsEndpoint+"/"+bookingId, {remarks: remarks});
  return data;
}

export default {
  saveComments
};

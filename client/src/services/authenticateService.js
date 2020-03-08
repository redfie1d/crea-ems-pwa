/*
Originator: Hidayatullah
Date: ?
Service for user authentication
*/

import http from "./httpService";
import jwtDecode from "jwt-decode";
http.setJwt(getJwt());

const authEndPoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/authenticate";
const forgotEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/forgot";
const resetEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/forgot/reset";

export async function login(email, password) {
  const { data: jwt } = await http.post(authEndPoint, { email, password });
  localStorage.setItem("token", jwt);
}

export function logout() {
  localStorage.removeItem("token");
}

export async function forgot(email) {
  await http.post(forgotEndpoint, { email });
}

export async function reset(password, confirmPassword, token) {
  await http.post(resetEndpoint + "/" + token, { password, confirmPassword });
}

export function getCurrentUser() {
  try {
    const jwt = localStorage.getItem("token");
    return jwtDecode(jwt);
  } catch (ex) {
    return null;
  }
}

export function getJwt() {
  return localStorage.getItem("token");
}

// -------------------------------------------------------------------------------------------------------------------------

export default {
  login,
  logout,
  forgot,
  reset,
  getCurrentUser,
  getJwt
};

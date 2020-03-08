/*
Originator:
Date:
Service for user management
*/

import http from "./httpService";
import moment from "moment";

const usersEndpoint = process.env.REACT_APP_DOMAIN_PRODUCTION + "/api/users";

// ROUTE FOR SUPER ADMIN TO CREATE ADMIN
export async function registerAdmin(user) {
  return http.post(usersEndpoint + "/admin", {
    name: user.name,
    email: user.email,
    accountType: user.accountType
  });
}

// ROUTE FOR ADMIN OR SUPERADMIN TO CREATE USER
export async function registerUser(user) {
  return http.post(usersEndpoint + "/user", {
    name: user.name,
    email: user.email,
    accountType: user.accountType
  });
}

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL USERS
export async function getAllUsers() {
  const users = await http.get(usersEndpoint + "/");
  return users;
}

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL STUDENTS
export async function getAllStudents() {
  const students = await http.get(usersEndpoint + "/students");
  return students;
}

// ROUTE FOR ADMIN OR SUPERADMIN TO RETRIEVE ALL ADMINS
export async function getAllAdmins() {
  const admins = await http.get(usersEndpoint + "/admins");
  return admins;
}

// ROUTE FOR USER TO UPDATE HIS/HER DETAILS
export async function saveUser(password, confirmedPassword, catsExpiryDate, contactNumber) {
  if(password !== confirmedPassword) {
    throw String("NotMatched");
  }

  var newPassword = password;

  if(password === undefined){
    newPassword = null;
  }
  if (catsExpiryDate != null) {
    catsExpiryDate = moment(catsExpiryDate).format("YYYY-MM-DD");
  }

  const {data: jwt} = await http.put(usersEndpoint + "/me", {
    password: newPassword,
    catsExpiryDate: catsExpiryDate,
    contactNumber: contactNumber
  });
  localStorage.removeItem("token");
  localStorage.setItem("token", jwt);
}

// ROUTE FOR ADMIN OR SUPERADMIN TO UPDATE HIS/HER DETAILS
export async function saveAdmin(password, confirmedPassword, contactNumber) {
  if(password !== confirmedPassword) {
    throw String("NotMatched");
  }

  const {data:jwt} = await http.put(usersEndpoint + "/me", {
    password : password,
    contactNumber : contactNumber
  });
  localStorage.removeItem("token");
  localStorage.setItem("token", jwt);
}

// ROUTE FOR ADMIN OR SUPERADMIN TO UPDATE USER'S DETAILS
export async function adminEditUser(userId, name, isWsg, catsExpiryDate, status, contactNumber) {
  if (catsExpiryDate != null) {
    catsExpiryDate = moment(catsExpiryDate).format("YYYY-MM-DD");
  }

  let isWsgBoolean;
  if (isWsg === "Yes") {
    isWsgBoolean = true;
  } else if (isWsg === "No") {
    isWsgBoolean = false;
  } else {
    isWsgBoolean = isWsg;
  }

  await http.put(usersEndpoint + "/" + userId, {
    name: name,
    isWsg: isWsgBoolean,
    catsExpiryDate: catsExpiryDate,
    status: status,
    contactNumber: contactNumber
  });
}

// ROUTE FOR SUPER ADMIN TO TRANSFER SUPER ADMIN RIGHTS
export async function transferSuperAdmin(userId) {
  const {data: jwt} = await http.put(usersEndpoint + "/transfer/" + userId);
  localStorage.removeItem("token");
  localStorage.setItem("token", jwt);
}

// ROUTE FOR SUPER ADMIN TO DELETE A USER
export function deleteUser(userId) {
  return http.delete(usersEndpoint + "/" + userId);
}

export default {
  registerAdmin,
  registerUser,
  getAllUsers,
  getAllStudents,
  getAllAdmins,
  saveUser,
  saveAdmin,
  adminEditUser,
  transferSuperAdmin,
  deleteUser
};

/*
Originator: Hidayatullah
Date: 3 Sept 2018
Logout component to destroy authentication token and redirect to "/"
*/
// Import external libraries
import { Component } from "react";

// Import custom components
import auth from "../services/authenticateService";

class Logout extends Component {
  componentDidMount() {
    auth.logout();
    window.location = "/";
  }

  render() {
    return null;
  }
}

export default Logout;

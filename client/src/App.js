/*
Originator: Hidayatullah
Date: ?
Main App loaded at the start of the lifecycle
*/
// Import external libraries
import React, { Component } from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import {
  Modal,
  ModalBody,
  ModalHeader
} from "reactstrap";
import {
 MoreVert
} from "@material-ui/icons";

// Import indices
import AdminManageConfigs from "./adminConfigs/index";
import AdminManageShifts from "./adminBookingManagement/index";
import AdminDashboard from "./adminDashboard/index";
import AdminManageLibraryDuties from "./adminLibraryDuties/index";
import AdminTabExportContent from "./adminExport/index";
import AdminPanelIndex from "./adminPanel/index";
import AdminProfile from "./adminProfile/index";
import AdminWeekManagement from "./adminWeekManagement/index";
import AdminManagePayroll from "./adminManagePayroll/index";
import SuperAdminPanelIndex from "./superAdminPanel/index";
import UserAppointmentsBookings from "./userLibraryDuties/index";
// import UserQRAttendance from "./userAttendance/index";
import UserProfile from "./userProfile/index";
import UserShiftBooking from "./userShiftBooking/index";
import ViewBookings from "./viewBooking/index";
// import UserManageTimesheet from "./userTimesheet/index";
import Upload from "./upload/index";

// Import custom components
import ProtectedRoute from "./common/protectedRoute";
import Login from "./authentication/login";
import Logout from "./authentication/logout";
import ForgotPassword from "./authentication/forgotPassword";

// Import services
import auth from "./services/authenticateService";

// Import css files
import "react-toastify/dist/ReactToastify.css";

class App extends Component {
  state = {
    mobileChrome: false,
    mobileSafari: false,
    appleDevices: [
      "iPad",
      "iPhone"
    ]
  }

  componentDidMount() {
    if(this.isMobileDevice()) {
      if(!(navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches)) {
        if(this.state.appleDevices.includes(navigator.platform)) {
          this.setState({ mobileSafari: true });
        } else {
          this.setState({ mobileChrome: true });
        }
      }
    }
  }

  isMobileDevice = () => {
    return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
  }

  toggleChrome = () => {
    this.setState({ mobileChrome: !this.state.mobileChrome });
  }

  toggleSafari = () => {
    this.setState({ mobileSafari: !this.state.mobileSafari });
  }

  render() {
    return (
      <React.Fragment>
        <ToastContainer />
        <Switch>
          <Route exact path="/logout" component={Logout} />
          <Route exact path="/forgetPassword" component={ForgotPassword} />
          <Route exact path="/login" component={Login} />
          <ProtectedRoute exact path="/weekManagement" component={AdminWeekManagement} />
          <ProtectedRoute exact path="/configurations" component={AdminManageConfigs} />
          <ProtectedRoute exact path="/dashboard" component={AdminDashboard} />
          <ProtectedRoute exact path="/libraryDutiesManagement" component={AdminManageLibraryDuties} />
          <ProtectedRoute exact path="/export" component={AdminTabExportContent} />
          <ProtectedRoute exact path="/libraryDuties" component={UserAppointmentsBookings} />
          {/*<ProtectedRoute exact path="/attendance" component={UserQRAttendance} />*/}
          <ProtectedRoute exact path="/shiftBooking" component={UserShiftBooking} />
          <ProtectedRoute exact path="/viewBookings" component={ViewBookings} />
          {/*<ProtectedRoute exact path="/timesheet" component={UserManageTimesheet} />*/}
          <ProtectedRoute exact path="/adminProfile" component={AdminProfile} />
          <ProtectedRoute exact path="/profile" component={UserProfile} />
          <ProtectedRoute exact path="/adminPanel" component={AdminPanelIndex} />
          <ProtectedRoute exact path="/shiftsManagement" component={AdminManageShifts} />
          <ProtectedRoute exact path="/payrollAdmin" component={AdminManagePayroll} />
          <ProtectedRoute exact path="/superAdminPanel" component={SuperAdminPanelIndex} />
          <ProtectedRoute exact path="/upload" component={Upload} />
          <ProtectedRoute exact
            path="/"
            render={
              () => {
                const user = auth.getCurrentUser();
                if (user.accountType === "Student") return <Redirect to="/shiftBooking" />
                return <Redirect to="/dashboard" />
              }
            }
          />
        </Switch>
        <Modal centered isOpen={this.state.mobileChrome} toggle={this.toggleChrome} zIndex="1300" style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}>
          <ModalHeader toggle={this.toggleChrome}></ModalHeader>
          <ModalBody style={{textAlign: "center"}}>
            <img style={{width: "40%"}} src="/192_transparent.png" alt="" />
            <p>Install CREA EMS on your home screen for quick and easy access when you're on the go.</p>
            <p>Just tap<MoreVert />on the top right corner, then 'Add to Home screen'</p>
            <p>If you have already added CREA EMS on your home screen, open the application through your home screen applications.</p>
            <p>Note: Use Chrome as your browser and ensure that your software is updated to the latest version to support this feature.</p>
          </ModalBody>
        </Modal>
        <Modal centered isOpen={this.state.mobileSafari} toggle={this.toggleSafari} zIndex="1300" style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}>
          <ModalHeader toggle={this.toggleSafari}></ModalHeader>
          <ModalBody style={{textAlign: "center"}}>
            <img style={{width: "40%"}} src="/192_transparent.png" alt="" />
            <p>Add CREA EMS on your home screen for quick and easy access when you're on the go.</p>
            <p>Just tap <img style={{width: "8%"}} src="./share.png" alt="" /> then 'Add to Home screen'</p>
            <p>If you have already added CREA EMS on your home screen, open the application through your home screen applications.</p>
            <p>Note: Use Safari with the latest updated software to support this feature.</p>
          </ModalBody>
        </Modal>
      </React.Fragment>
    );
  }
}

export default App;

/*
Originator: Brandon
Date: 18 Mar 2019
Subcomponent to render export components
*/
// Import external resources
import React, { Component } from "react";
import {
  TabContent,
  TabPane,
  Nav,
  NavItem,
  NavLink,
  Row,
  Col
} from 'reactstrap';

// import custom components
import LibraryDutiesManagement from "./libraryDutiesContent";
import AppointmentManagement from "./appointmentsContent";
import LocationManagement from "./locationContent";

class ManageLibraryDuties extends Component {
  state = {
    activeTab: "library"
  }

  toggleTab = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  render() {
    const { activeTab } = this.state;
    return (
      <React.Fragment>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <h2 style={{marginBottom:"30px"}}>Manage Library Duties</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            {/* NAV LINK GOES HERE */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "library" ? "active" : "")}
                  onClick={() => { this.toggleTab("library") }}
                >
                  Library Duties
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "appt" ? "active" : "")}
                  onClick={() => { this.toggleTab("appt") }}
                >
                  Appointments
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "location" ? "active" : "")}
                  onClick={() => { this.toggleTab("location") }}
                >
                  Locations
                </NavLink>
              </NavItem>
            </Nav>
            {/* TAB CONTENT GOES HERE */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="library">
                <Row className="mt-3">
                  <Col sm="12">
                    <LibraryDutiesManagement />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="appt">
                <Row className="mt-3">
                  <Col sm="12">
                    <AppointmentManagement />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="location">
                <Row className="mt-3">
                  <Col sm="12">
                    <LocationManagement />
                  </Col>
                </Row>
              </TabPane>
            </TabContent>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default ManageLibraryDuties;

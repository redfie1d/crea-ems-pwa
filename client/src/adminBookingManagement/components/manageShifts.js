/*
Originator: Brandon
Date: 18 Mar 2019
Subcomponent to render shifts components
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
import BookingsContent from "./bookingsContent";
import AdhocDutiesContent from "./adhocDutiesContent";
import CreateShiftContent from "./createShiftContent";

class ManageShifts extends Component {
  state = {
    activeTab: "booking"
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
            <h2 style={{marginBottom:"30px"}}>Manage Shifts</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            {/* NAV LINK GOES HERE */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "booking" ? "active" : "")}
                  onClick={() => { this.toggleTab("booking") }}
                >
                  Bookings
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "adhoc" ? "active" : "")}
                  onClick={() => { this.toggleTab("adhoc") }}
                >
                  View Adhoc Duties
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "createShift" ? "active" : "")}
                  onClick={() => { this.toggleTab("createShift") }}
                >
                  Create Shift
                </NavLink>
              </NavItem>
            </Nav>
            {/* TAB CONTENT GOES HERE */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="booking">
                <Row className="mt-3">
                  <Col sm="12">
                    <BookingsContent />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="adhoc">
                <Row className="mt-3">
                  <Col sm="12">
                    <AdhocDutiesContent />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="createShift">
                <Row className="mt-3">
                  <Col sm="12">
                    <CreateShiftContent />
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

export default ManageShifts;

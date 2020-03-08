/*
Originator: Brandon
Date: 29 Mar 2019
Subcomponent to render timesheet components
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
import CreateTimesheetContent from "./createTimesheetContent";
import ViewTimesheetContent from "./viewTimesheetContent";

class ManageShifts extends Component {
  state = {
    activeTab: "create"
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
            <h2 style={{marginBottom:"30px"}}>Manage Timesheet</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            {/* NAV LINK GOES HERE */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "create" ? "active" : "")}
                  onClick={() => { this.toggleTab("create") }}
                >
                  Create Timesheet
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "view" ? "active" : "")}
                  onClick={() => { this.toggleTab("view") }}
                >
                  View Timesheet
                </NavLink>
              </NavItem>
            </Nav>
            {/* TAB CONTENT GOES HERE */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="create">
                <Row className="mt-3">
                  <Col sm="12">
                    <CreateTimesheetContent />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="view">
                <Row className="mt-3">
                  <Col sm="12">
                    <ViewTimesheetContent />
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

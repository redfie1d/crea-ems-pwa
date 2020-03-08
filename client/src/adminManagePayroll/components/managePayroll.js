/*
Originator: Hidayatullah
Date: 26 Feb 2019
Subcomponent to render timesheet management components
*/
// Import external resources
import React, { Component } from "react";
import {
  // TabContent,
  // TabPane,
  // Nav,
  // NavItem,
  // NavLink,
  Row,
  Col
} from 'reactstrap';

// import custom components
// import TimesheetTabContent from "./timesheetTabContent";
import ComputationTabContent from "./computationTabContent";

class ManagePayroll extends Component {
  state = {
    activeTab: "computation"
  }

  toggleTab = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  render() {
    // const { activeTab } = this.state;
    return (
      <React.Fragment>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <h2 style={{marginBottom:"30px"}}>Manage Payroll</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <ComputationTabContent />
            {/*<Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "computation" ? "active" : "")}
                  onClick={() => { this.toggleTab("computation") }}
                >
                  Computation
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "timesheet" ? "active" : "")}
                  onClick={() => { this.toggleTab("timesheet") }}
                >
                  Timesheet
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={activeTab}>
              <TabPane tabId="computation">
                <Row className="mt-3">
                  <Col sm="12">
                    <ComputationTabContent />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="timesheet">
                <Row className="mt-3">
                  <Col sm="12">
                    <TimesheetTabContent />
                  </Col>
                </Row>
              </TabPane>
            </TabContent>*/}
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

export default ManagePayroll;

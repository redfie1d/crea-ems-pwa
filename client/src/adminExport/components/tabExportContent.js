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
import ExportPDF from "./exportPDF";
import ExportCSV from "./exportCSV";

class TabExportContent extends Component {
  state = {
    activeTab: "pdf"
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
            <h2 style={{marginBottom:"30px"}}>Export</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            {/* NAV LINK GOES HERE */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "pdf" ? "active" : "")}
                  onClick={() => { this.toggleTab("pdf") }}
                >
                  PDF Payroll
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "csv" ? "active" : "")}
                  onClick={() => { this.toggleTab("csv") }}
                >
                  CSV Shift Booking
                </NavLink>
              </NavItem>
            </Nav>
            {/* TAB CONTENT GOES HERE */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="pdf">
                <Row className="mt-3">
                  <Col sm="12">
                    <ExportPDF />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="csv">
                <Row className="mt-3">
                  <Col sm="12">
                    <ExportCSV />
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

export default TabExportContent;

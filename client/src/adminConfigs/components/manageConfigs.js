/*
Originator: Brandon
Date: 25 Mar 2019
Subcomponent to render configuration page
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
  Col,
  Button
} from 'reactstrap';

import CircularProgress from '@material-ui/core/CircularProgress';
import { toast } from "react-toastify";

// import custom components
import ShiftContent from "./shiftsContent";
import ComputationsContent from "./computationsContent";
import LoggerContent from "./loggerContent";
import ClearDatabaseContent from "./clearDatabaseContent";

// import services
import configService from "../../services/configService";

class ManageConfigs extends Component {
  state = {
    data: {
      minHoursPerWeek: 0,
      maxHoursPerDay: 0,
      noOfWorkStations: 0,
      kpi: 0,
      unsuccessfulCases: [],
      creaAddress: "",
      maxDistanceFromCrea: 0,
      allCases: []
    },
    original: {
      minHoursPerWeek: 0,
      maxHoursPerDay: 0,
      noOfWorkStations: 0,
      kpi: 0,
      unsuccessfulCases: [],
      creaAddress: "",
      maxDistanceFromCrea: 0,
      allCases: []
    },
    activeTab: "shifts",
    allowSave: true,
    saveLoading: false,
    allowCancel: true,
    cancelLoading: false,
    errors: {}
  }

  async componentDidMount() {
    var { data, original } = this.state;
    try {
      // --------------------------------------------------
      const result = await configService.getAllConfigurations();

      data = {...result}
      original = {...result}
      // --------------------------------------------------

    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ data, original });
    }
  }

  saveConfigs = async e => {
    this.setState({ saveLoading: true, allowSave: false });
    try {

      //-------------------------------------------------------------------
      const result = await configService.updateConfigurations(this.state.data);

      toast.info(result);
      //-------------------------------------------------------------------

      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      setTimeout(() => {
        this.setState({ saveLoading: false, allowSave: true });
      }, 1500);
    }
  };

  cancelConfigs = async e => {
    this.setState({ cancelLoading: true, allowCancel: false });

    var { original, data } = this.state;
    data = original
    this.setState({ data })

    toast.info("Changes reverted");

    setTimeout(function() {
      document.location.reload(true);
      this.setState({ saveLoading: false, allowSave: true });
    }, 1500);
  };

  toggleTab = (tab) => {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  handleChange = ({currentTarget: input}) => {
    var data = {...this.state.data};
    data[input.name] = input.value;
    this.setState({ data });
  };

  render() {
    const { activeTab, allowSave, saveLoading, allowCancel, cancelLoading, data } = this.state;
    return (
      <React.Fragment>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <h2 style={{marginBottom:"30px"}}>Configurations</h2>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <hr/>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 2, offset: 7 }}>
            <Button
              style={{ marginTop: "10px", width: "100%" }}
              color="info"
              onClick={this.saveConfigs}
              disabled={!allowSave}
            >
              {
                saveLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Saving..
                  </div>
                :
                  "Apply"
              }
            </Button>{' '}
          </Col>
          <Col xs="12" sm="12" md={{ size: 2 }}>
            <Button
              style={{ marginTop: "10px", width: "100%" }}
              color="danger"
              onClick={this.cancelConfigs}
              disabled={!allowCancel}
            >
              {
                cancelLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Cancelling...
                  </div>
                :
                  "Cancel"
              }
            </Button>{' '}
          </Col>
        </Row>
        <Row style={{ marginBottom: "10px", marginTop: "20px"}}>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            <hr/>
          </Col>
        </Row>
        <Row>
          <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
            {/* NAV LINK GOES HERE */}
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "shifts" ? "active" : "")}
                  onClick={() => { this.toggleTab("shifts") }}
                >
                  Shifts
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "computation" ? "active" : "")}
                  onClick={() => { this.toggleTab("computation") }}
                >
                  Computations
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "attendance" ? "active" : "")}
                  onClick={() => { this.toggleTab("attendance") }}
                >
                  Attendance Logger
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={"" + (activeTab === "clear" ? "active" : "")}
                  onClick={() => { this.toggleTab("clear") }}
                >
                  Clear Database
                </NavLink>
              </NavItem>
            </Nav>
            {/* TAB CONTENT GOES HERE */}
            <TabContent activeTab={activeTab}>
              <TabPane tabId="shifts">
                <Row className="mt-3">
                  <Col sm="12">
                    <ShiftContent handleChangeEvent={this.handleChange} data={data} />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="computation">
                <Row className="mt-3">
                  <Col sm="12">
                    <ComputationsContent handleChangeEvent={this.handleChange} data={data} />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="attendance">
                <Row className="mt-3">
                  <Col sm="12">
                    <LoggerContent handleChangeEvent={this.handleChange} data={data} />
                  </Col>
                </Row>
              </TabPane>
              <TabPane tabId="clear">
                <Row className="mt-3">
                  <Col sm="12">
                    {<ClearDatabaseContent handleChangeEvent={this.handleChange} data={data} />}
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

export default ManageConfigs;

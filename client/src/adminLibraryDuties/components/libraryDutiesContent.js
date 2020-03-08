/*
Originator: Brandon
Date: 17 Jan 2019
Component to render library duties management page for admins
*/
// Import external resources

import React from "react";
import Joi from "joi-browser";
import {
  Form,
  Row,
  Col,
} from "reactstrap";
import { toast } from "react-toastify";

// Import services
import libraryDuties from "../../services/libraryDutiesService";

// Import custom components
import LibraryDutiesTable from "./libraryDutiesTable";
import CommonForm from '../../common/form';

class LibraryDutiesManagement extends CommonForm {
  state = {
    locations: [],
    data: {
      locationId: "",
      inputDate: "",
      from: "",
      to: ""
    },
    errors: {},
    libDutyLoading: false,
    allowLibDuty: true
  }

  schema = {
    locationId: Joi.string().required().label("Location ID"),
    inputDate: Joi.string().required().label("Date of Appointment"),
    from: Joi.string().required().label("Starting Time"),
    to: Joi.string().required().label("Ending Time")
  }


  async componentDidMount() {
    try {
      var locationsResult = await libraryDuties.getLocations();
      var { locations } = this.state;
      locations = locationsResult;

      this.setState({ locations });

    } catch(ex) {
      if(ex.response && ex.response.status === 404) {
        const errors = { ...this.state.errors };
        errors.data = ex.response.data;
        this.setState({ errors });
      } else if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  doSubmit = async e => {
    this.setState({ libDutyLoading: true, allowLibDuty: false });
    var { data } = this.state;
    e.preventDefault();
    try {
      const result = await libraryDuties.createLibraryDuties(data.locationId, data);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      const errors = { ...this.state.errors };
      this.setState({ errors });
      toast.error(ex.response.data);
    } finally {
      setTimeout(() => {
        this.setState({ allowLibDuty: true, libDutyLoading: false })
      }, 1500);
    }
  }

  render() {
    const { locations, libDutyLoading, allowLibDuty } = this.state;
    return (
      <React.Fragment>
        <div>
          <Form onSubmit= {this.doSubmit}>
            <Row>
              {/* Drop down list for selecting location */}
              <Col>
                {this.renderSelect("locationId", "Locations", "locationName", locations)}
              </Col>
            </Row>
            <Row>
              <Col>
                {this.renderInput("inputDate", "Date", "date", "")}
              </Col>
            </Row>
            <Row>
              <Col xs="12" sm="12" md={{ size: 6 }}>
                {this.renderInput("from", "Start Time", "time", "")}
              </Col>
              <Col xs="12" sm="12" md={{ size: 6 }}>
                {this.renderInput("to", "End Time", "time", "")}
              </Col>
            </Row>
            <Row style={{ marginTop: "20px" }}>
              <Col xs="12" sm="12" md={{ size: 4, offset: 8 }}>
              {this.renderButton("Create Library Duties", "100%", libDutyLoading, allowLibDuty)}
              </Col>
            </Row>
            <Row />
            <Row>
              <Col>
                <hr/>
              </Col>
            </Row>
            <Row>
              <Col>
                <LibraryDutiesTable />
              </Col>
            </Row>
          </Form>
        </div>
      </React.Fragment>
    );
  }

}

export default LibraryDutiesManagement;

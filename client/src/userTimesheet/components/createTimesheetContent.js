/*
Originator: Brandon
Date: 25 Feb 2019
Component to render timesheet input
*/
// Import external resources
import React from "react";
import Joi from "joi-browser";
import { Row, Col, Form} from "reactstrap";
import { toast } from "react-toastify";

// Import services
import timesheetService from "../../services/timesheetService";

// Import custom components
import CommonForm from '../../common/form';

class CreateTimesheetContent extends CommonForm {
  state = {
    data: {
      date: "",
      startTime: "",
      endTime: "",
      shiftType: ""
    },
    errors: {},
    submitLoading: false,
    allowSubmit: true
  }

  schema = {
    date: Joi.string().required().label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time"),
    shiftType: Joi.string().required().label("Shift Type")
  }

  doSubmit = async e => {
    this.setState({ submitLoading: true, allowSubmit: false });
    var { data } = this.state;
    e.preventDefault();
    try {
      const result = await timesheetService.createRecords(data);
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
        this.setState({ allowSubmit: true, submitLoading: false })
      }, 1500);
    }
  }

  handleTypeSelect = ({ currentTarget: input }) => {
    var {data} = this.state;
    data.shiftType = input.value;

    this.setState({ data });
  };

  render() {
    const {submitLoading, allowSubmit} = this.state;

    return (
      <React.Fragment>
        <div>
          <Form onSubmit= {this.doSubmit}>
            <Row>
              {/* Drop down list for selecting shift type */}
              <Col xs="12" sm="12" md={{ size: 12 }}>
                <div className="form-group">
                  <label htmlFor="selectType">Shift Type</label>
                  <select className="form-control" id="selectType" value={this.state.data.shiftType} onChange={this.handleTypeSelect}>
                    <option value="" disabled hidden >Select...</option>
                    <option value="shift">Shift</option>
                    <option value="lib">Library Duty</option>
                  </select>
                </div>
              </Col>
            </Row>
            <Row>
              <Col xs="12" sm="12" md={{ size: 12 }}>
                {this.renderInput("date", "Date", "date", "")}
              </Col>
            </Row>
            <Row>
              <Col xs="12" sm="12" md={{ size: 6 }}>
                {this.renderInput("startTime", "Start Time", "time", "")}
              </Col>
              <Col xs="12" sm="12" md={{ size: 6 }}>
                {this.renderInput("endTime", "End Time", "time", "")}
              </Col>
            </Row>
            <Row style={{ marginTop: "20px" }}>
              <Col xs="12" sm="12" md={{ size: 4, offset: 8 }}>
              {this.renderButton("Create Timesheet", "100%", submitLoading, allowSubmit)}
              </Col>
            </Row>
          </Form>
        </div>
      </React.Fragment>
    );
  }
}

export default CreateTimesheetContent;

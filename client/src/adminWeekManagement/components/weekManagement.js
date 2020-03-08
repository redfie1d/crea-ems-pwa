/*
Originator: Hidayatullah
Date: 8 Oct 2018
Main component to render booking management module
*/
// Import external resources
import React from "react";
import Joi from "joi-browser";
import {
  Form,
  FormGroup,
  FormText,
  Label,
  Row,
  Col,
  Button,
  ButtonGroup,
  ButtonToolbar
} from "reactstrap";
import { toast } from "react-toastify";

// Import custom components
import CommonForm from "../../common/form";
import WeekTable from "./weekTable";

// Import services
import booking from "../../services/bookingService";

class WeekManagement extends CommonForm {
  state = {
    data: {
      bookingDeadline: "",
      bookingDeadlineTime: "",
      fromDate: "",
      workingDays: {
        monday: {isWorkingDay: true, color: "rgb(23, 162, 184)"},
        tuesday: {isWorkingDay: true, color: "rgb(23, 162, 184)"},
        wednesday: {isWorkingDay: true, color: "rgb(23, 162, 184)"},
        thursday: {isWorkingDay: true, color: "rgb(23, 162, 184)"},
        friday: {isWorkingDay: true, color: "rgb(23, 162, 184)"}
      }
    },
    errors: {},
    weekLoading: false,
    allowWeek: true,
  }

  schema = {
    bookingDeadline: Joi.string().required().label("Date deadline"),
    bookingDeadlineTime: Joi.string().required().label("Time deadline"),
    fromDate: Joi.string().required().label("From date"),
    workingDays: Joi.object().keys({
      monday: Joi.object(),
      tuesday: Joi.object(),
      wednesday: Joi.object(),
      thursday: Joi.object(),
      friday: Joi.object()
    })
  }

  handleWorkingDays = (e) => {
    e.preventDefault();
    const data = {...this.state.data};
    if (!data.workingDays[e.target.id].isWorkingDay) {
      data.workingDays[e.target.id].isWorkingDay = true;
      data.workingDays[e.target.id].color = "rgb(23, 162, 184)";
      this.setState({data});
    } else {
      data.workingDays[e.target.id].isWorkingDay = false;
      data.workingDays[e.target.id].color = "rgb(95, 102, 116)";
      this.setState({data});
    }
  }

  doSubmit = async () => {
    this.setState({ weekLoading: true, allowWeek: false });
    try {
      await booking.createShiftBookingWeek(this.state.data);
      toast.info("Shift bookings week has been created successfully");
      setTimeout(function(){document.location.reload(true);},1500);
    } catch(ex) {
      if(ex === "notMonday") {
        toast.error("Select a Monday for the week");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      setTimeout(() => {
        this.setState({ allowWeek: true, weekLoading: false })
      }, 1500);
    }
  }

  render() {
    var data = {...this.state.data};
    var { weekLoading, allowWeek } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{marginBottom:"30px"}}>Create Shift Schedule</h2>
            </Col>
          </Row>
          {/* SHIFT BOOKING WEEK FORM */}
          <Form onSubmit={this.handleSubmit}>
            <Row>
              <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                {this.renderInput("fromDate", "From", "date", "Fill in the date of the MONDAY of the week")}
              </Col>
            </Row>
            {
              data.fromDate ?
                <Row>
                  <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                    <FormGroup>
                      <Label style={{marginBottom: "0px", marginTop: "15px"}}>Select non-working days of the week</Label>
                      <FormText>Click to deactivate/activate working days</FormText>
                      <ButtonToolbar style={{marginBottom:"10px"}}>
                        <ButtonGroup>
                          <Button style={{backgroundColor:data.workingDays.monday.color, borderColor:data.workingDays.monday.color}} id="monday" onClick={this.handleWorkingDays}>Monday</Button>
                          <Button style={{backgroundColor:data.workingDays.tuesday.color, borderColor:data.workingDays.tuesday.color}} id="tuesday" onClick={this.handleWorkingDays}>Tuesday</Button>
                          <Button style={{backgroundColor:data.workingDays.wednesday.color, borderColor:data.workingDays.wednesday.color}} id="wednesday" onClick={this.handleWorkingDays}>Wednesday</Button>
                          <Button style={{backgroundColor:data.workingDays.thursday.color, borderColor:data.workingDays.thursday.color}} id="thursday" onClick={this.handleWorkingDays}>Thursday</Button>
                          <Button style={{backgroundColor:data.workingDays.friday.color, borderColor:data.workingDays.friday.color}} id="friday" onClick={this.handleWorkingDays}>Friday</Button>
                        </ButtonGroup>
                      </ButtonToolbar>
                    </FormGroup>
                  </Col>
                </Row>
              :
                ""
            }
            <Row style={{ marginTop: "20px" }}>
              <Col xs="12" sm="12" md={{ size: 5, offset: 1 }}>
                {this.renderInput("bookingDeadline", "Deadline (Date)", "date", "Fill in the date deadline for booking")}
              </Col>
              <Col xs="12" sm="12" md={{ size: 5 }}>
                {this.renderInput("bookingDeadlineTime", "Deadline (Time)", "time", "Fill in the time deadline for booking")}
              </Col>
            </Row>
            <Row style={{ marginTop: "20px" }}>
              <Col xs="12" sm="12" md={{ size: 3, offset: 8 }}>
              {this.renderButton("Create Shifts", "100%", weekLoading, allowWeek)}
              </Col>
            </Row>
          </Form>
            <Row>
              <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
                <hr/>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <WeekTable />
            </Col>
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default WeekManagement;

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
import user from "../../services/userService";
import booking from "../../services/bookingService";

// Import custom components
import CommonForm from '../../common/form';

class CreateShiftContent extends CommonForm {
  state = {
    users: [],
    data: {
      userId: "",
      date: "",
      startTime: "",
      endTime: ""
    },
    errors: {},
    createLoading: false,
    allowCreate: true
  }

  schema = {
    userId: Joi.string().required().label("User ID"),
    date: Joi.string().required().label("Date"),
    startTime: Joi.string().required().label("Start Time"),
    endTime: Joi.string().required().label("End Time")
  }


  async componentDidMount() {
    try {
      var { users } = this.state;
      var allUsers = await user.getAllStudents();
      users = allUsers.data;
      this.setState({ users });

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
    this.setState({ createLoading: true, allowCreate: false });
    var { data } = this.state;
    e.preventDefault();
    try {
      const result = await booking.createBookingForAdmin(data);
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
        this.setState({ allowCreate: true, createLoading: false })
      }, 1500);
    }
  }

  render() {
    const { users, createLoading, allowCreate } = this.state;
    return (
      <React.Fragment>
        <div>
          <Form onSubmit= {this.doSubmit}>
            <Row>
              {/* Drop down list for selecting users */}
              <Col>
                {this.renderSelect("userId", "Users", "name", users)}
              </Col>
            </Row>
            <Row>
              <Col>
                {this.renderInput("date", "Date", "date", "")}
              </Col>
            </Row>
            <Row>
              <Col sm={6}>
                {this.renderInput("startTime", "Start Time", "time", "")}
              </Col>
              <Col sm={6}>
                {this.renderInput("endTime", "End Time", "time", "")}
              </Col>
            </Row>
            <Row style={{ marginTop: "20px" }}>
              <Col xs="12" sm="12" md={{ size: 3, offset: 9 }}>
              {this.renderButton("Create Shifts", "100%", createLoading, allowCreate)}
              </Col>
            </Row>
          </Form>
        </div>
      </React.Fragment>
    );
  }

}

export default CreateShiftContent;

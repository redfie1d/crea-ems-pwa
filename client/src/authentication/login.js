/*
Originator: Hidayatullah
Date: ?
Main component to render the Login page
*/
// Import external libraries
import React from "react";
import Joi from "joi-browser";
import { Container, Row, Col, Form } from "reactstrap";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

// Import services
import auth from "../services/authenticateService";

// Import components
import CommonForm from "../common/form";

class Login extends CommonForm {
  state = {
    data: {
      email: "",
      password: ""
    },
    errors: {}
  };

  styles = {
      boxShadow: "0 0 6px #ccc",
      backgroundColor: "#333A56",
      borderRadius: "25px",
      width:"70%",
      color: "#ffffff",
      fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
  };

  schema = {
    email: Joi.string()
      .required()
      .email()
      .label("Email"),
    password: Joi.string()
      .required()
      .label("Password")
  };

  doSubmit = async () => {
    try {
      const { data } = this.state;
      await auth.login(data.email, data.password);

      const { state } = this.props.location;
      window.location = state ? state.from.pathname : "/";
    } catch (ex) {
      if (ex.response && ex.response.status === 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  };

  render() {
    const md = {
      size: 6,
      offset: 3
    };
    const sm = {
      size: 10,
      offset: 1
    };
    const xs = {
      size: 10,
      offset: 1
    };
    return (
      <Container>
         <Row className="mt-4">
            <Col
              xs={{ size: xs.size, offset: xs.offset }}
              sm={{ size: sm.size, offset: sm.offset }}
              md={{ size: md.size, offset: md.offset }}
            >
              <img
                src="../../crea-logo-remake.png"
                className="img-fluid"
                alt=""
              />
            </Col>
          </Row>
        <Container className="mt-4 pt-3 pb-5" style={this.styles}>
          <Form className="" onSubmit={this.handleSubmit}>
            <Row className="mt-4">
              <Col
                xs={{ size: xs.size, offset: xs.offset }}
                sm={{ size: sm.size, offset: sm.offset }}
                md={{ size: md.size, offset: md.offset }}
              >
                {this.renderInput("email", "Email", "email")}
              </Col>
            </Row>
            <Row className="mt-2">
              <Col
                xs={{ size: xs.size, offset: xs.offset }}
                sm={{ size: sm.size, offset: sm.offset }}
                md={{ size: md.size, offset: md.offset }}
              >
                {this.renderInput("password", "Password", "password")}
              </Col>
            </Row>
            <Row className="mt-4">
              <Col
                xs={{ size: xs.size, offset: xs.offset }}
                sm={{ size: sm.size, offset: sm.offset }}
                md={{ size: md.size, offset: md.offset }}
              >
                {this.renderButton("Sign in", "100%")}
              </Col>
            </Row>
          </Form>
          <Row className="mt-4" align="right">
            <Col
              xs={{ size: xs.size, offset: xs.offset }}
              sm={{ size: sm.size, offset: sm.offset }}
              md={{ size: md.size, offset: md.offset }}
            >
              <NavLink style={{color: "white"}} to="/forgetPassword">Forget password?</NavLink>
            </Col>
          </Row>
        </Container>
      </Container>
    );
  }
}

export default Login;

/*
Originator: Cassandra Lim
Date: 9 Sept 2018
Main component to render the ForgotPassword component
*/
// Import external libraries
import React, { Component } from "react";
import {
  Container,
  Row,
  Col,
  FormGroup,
  Label,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalFooter
} from "reactstrap";
import { NavLink } from "react-router-dom";
import { toast } from "react-toastify";

// Import services
import auth from "../services/authenticateService";

class ForgotPassword extends Component {
  state = {
    data: {
      email: "",
      token: "",
      password: "",
      confirmPassword: ""
    },
    errors: {},
    loading: false,
    loadingSubmit: false,
    tokenSuccess: false,
    modal: false,
    disabled: true
  };

  styles = {
    boxShadow: "0 0 6px #ccc",
    backgroundColor: "#333A56",
    borderRadius: "25px",
    width:"70%",
    color: "#ffffff",
    fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"
  }

  handleChange = ({ currentTarget: input }) => {
    let data = this.state.data;
    let disabled = this.state.disabled;
    data[input.name] = input.value;
    if(data.token && data.password && data.confirmPassword) {
      disabled = false;
    } else {
      disabled = true;
    }
    this.setState({ data, disabled });
  }

  requestToken = async () => {
    this.setState({ loading: true });
    try {
      const { data } = this.state;
      await auth.forgot(data.email);
      toast.info("A reset token has been sent to your email");
      this.toggleForm();
    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        errors.email = ex.response.data;
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ loading: false });
    }
  }

  toggleForm = () => {
    this.setState({ tokenSuccess: true });
  }

  handleSubmit = async () => {
    this.setState({ loadingSubmit: true });
    try {
      const { data } = this.state;
      const token = this.state.data.token;
      if(data.password === data.confirmPassword) {
        await auth.reset(data.password, data.confirmPassword, token);
        this.toggleModal();
      } else {
        const errors = {...this.state.errors};
        errors.confirmPassword = "\"Confirm password\" field does not match!";
        this.setState({ errors });
        toast.error(errors.confirmPassword);
      }
    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = {...this.state.errors};
        this.setState({ errors });
      }
    } finally {
      this.setState({ loadingSubmit: false });
    }
  }

  toggleModal = () => {
    this.setState({modal: !this.state.modal});
  }

  doRedirect = () => {
    window.location = "/login";
  }

  render() {
    // fields
    const md = {
      size: 10,
      offset: 1
    };
    const sm = {
      size: 10,
      offset: 1
    }
    const xs = {
      size: 10,
      offset: 1
    }

    // logo
    const logoMd = {
      size: 6,
      offset: 3
    };
    const logoSm = {
      size: 10,
      offset: 1
    };
    const logoXs = {
      size: 10,
      offset: 1
    };
    let { loading, tokenSuccess, loadingSubmit, disabled } = this.state;
    return (
      <Container>
        <Row className="mt-4">
          <Col
            xs={{ size: logoXs.size, offset: logoXs.offset }}
            sm={{ size: logoSm.size, offset: logoSm.offset }}
            md={{ size: logoMd.size, offset: logoMd.offset }}
          >
            <img src="../../crea-logo-remake.png" className="img-fluid" alt="" />
          </Col>
        </Row>
        <Container className="mt-4 pt-3 pb-5" style={this.styles}>
        <Row className="mt-4">
          <Col
            xs={{ size: xs.size, offset: xs.offset }}
            sm={{ size: sm.size, offset: sm.offset }}
            md={{ size: md.size, offset: md.offset }}
          >
            <FormGroup>
              <Label for="email" className="mb-0">Email</Label>

                <Input
                  style={{marginTop:'10px'}}
                  id="email"
                  name="email"
                  onChange={this.handleChange}
                />
            </FormGroup>
          </Col>
        </Row>
        <Row>
          <Col
            xs={{ size: xs.size, offset: xs.offset }}
            sm={{ size: sm.size, offset: sm.offset }}
            md={{ size: md.size, offset: md.offset }}
          >
            <FormGroup>
              {
                tokenSuccess ?
                  <Button color="primary" style={{backgroundColor:'#52658F',borderColor:'#52658F', marginTop:'10px', float:'right'}} onClick={this.requestToken}>
                    {
                      !loading ?
                        "Resend Token"
                      :
                        "Loading..."
                    }
                  </Button>
                :
                  <Button color="primary" style={{backgroundColor:'#52658F',borderColor:'#52658F', marginTop:'10px', float:'right'}} onClick={this.requestToken}>
                    {
                      !loading ?
                        "Send Token"
                      :
                        "Loading..."
                    }
                  </Button>
              }
            </FormGroup>
          </Col>
        </Row>
        {
          tokenSuccess ?
            <div>
              <Row className="mt-4">
                <Col
                  xs={{ size: xs.size, offset: xs.offset }}
                  sm={{ size: sm.size, offset: sm.offset }}
                  md={{ size: md.size, offset: md.offset }}
                >
                  <FormGroup>
                    <Label for="token" className="mb-0">Token</Label>
                    <Input
                      id="token"
                      name="token"
                      onChange={this.handleChange}
                      type="text"
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row className="mt-1">
                <Col
                  xs={{ size: xs.size, offset: xs.offset }}
                  sm={{ size: sm.size, offset: sm.offset }}
                  md={{ size: md.size, offset: md.offset }}
                >
                  <FormGroup>
                    <Label for="password" className="mb-0">New password</Label>
                    <Input
                      id="password"
                      name="password"
                      onChange={this.handleChange}
                      type="password"
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row className="mt-1">
                <Col
                  xs={{ size: xs.size, offset: xs.offset }}
                  sm={{ size: sm.size, offset: sm.offset }}
                  md={{ size: md.size, offset: md.offset }}
                >
                  <FormGroup>
                    <Label for="confirmPassword" className="mb-0">Confirm password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      onChange={this.handleChange}
                      type="password"
                    />
                  </FormGroup>
                </Col>
              </Row>
              <Row className="mt-4">
                <Col
                  xs={{ size: xs.size, offset: xs.offset }}
                  sm={{ size: sm.size, offset: sm.offset }}
                  md={{ size: md.size, offset: md.offset }}
                >
                  <Button color="primary" style={{backgroundColor:'#52658F',borderColor:'#52658F',width:'100%'}} onClick={this.handleSubmit} disabled={disabled}>
                    {
                      loadingSubmit ?
                        "Loading..."
                      :
                        "Reset Password"
                    }
                  </Button>
                </Col>
              </Row>
            </div>
          :
            ''
        }
        <Row className="mt-4" align="right">
          <Col
            xs={{ size: xs.size, offset: xs.offset }}
            sm={{ size: sm.size, offset: sm.offset }}
            md={{ size: md.size, offset: md.offset }}
          >
            <NavLink style={{color:'#fff'}} to="/login">Return to login</NavLink>
          </Col>
        </Row>
        <Modal centered style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modal} toggle={this.toggleModal} className={this.props.className}>
          <ModalBody>
            Your password has been reset successfully!
          </ModalBody>
          <ModalFooter>
            <Button color="primary" style={{backgroundColor:'#52658F',borderColor:'#52658F'}} onClick={this.doRedirect}>Return to login</Button>
          </ModalFooter>
        </Modal>
        </Container>
      </Container>
    );
  }
}

export default ForgotPassword;

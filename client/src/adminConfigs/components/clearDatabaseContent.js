/*
Originator: Brandon
Date: 27 Mar 2019
Subcomponent to render clear db configurations
*/
// Import external resources
import React, { Component } from "react";
import { Row, Col, FormGroup, Label, Input, Form, Button, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap"
import CircularProgress from '@material-ui/core/CircularProgress';
import { toast } from "react-toastify";

// import services
import configService from "../../services/configService";
import usersService from "../../services/userService";

class ClearDatabaseContent extends Component {
  state = {
    data: {
      startDateWeek: "",
      endDateWeek: "",
      startDateLibrary: "",
      endDateLibrary: "",
      startDateCall: "",
      endDateCall: "",
      selectedUser: ""
    },
    allUsers: [],
    modalWeek: false,
    modalLibrary: false,
    modalCall: false,
    modalUser: false,
    clearLoading: false,
    allowClear: true
  }

  async componentDidMount() {
    var { allUsers } = this.state;
    try {
      const users = await usersService.getAllUsers();
      allUsers = users.data;
    } catch(ex) {
      if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ allUsers });
    }
  }

  // Export and Clear Shifts
  handleClearWeeks = async () => {
    this.setState({ clearLoading: true, allowClear: false });
    var { data } = this.state;
    try {
      // -------------------------------------------------------------------
      var file = await configService.clearWeeks(data.startDateWeek, data.endDateWeek);
      // -------------------------------------------------------------------
      const blob = new Blob([file.data], {type:'text/csv'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden','');
      a.setAttribute('href', url);
      a.setAttribute('download', 'weeksExport.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if(ex === "missingDates") {
        toast.error("Please enter a start and end date");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
        this.setState({ clearLoading: false, allowClear: true });
    }
  };

  // Export and Clear Library Duties
  handleClearLibrary = async () => {
    this.setState({ clearLoading: true, allowClear: false });
    var { data } = this.state;
    try {
      // -------------------------------------------------------------------
      var file = await configService.clearLibraries(data.startDateLibrary, data.endDateLibrary);
      // -------------------------------------------------------------------
      const blob = new Blob([file.data], {type:'text/csv'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden','');
      a.setAttribute('href', url);
      a.setAttribute('download', 'libraryDutiesExport.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if(ex === "missingDates") {
        toast.error("Please enter a start and end date");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
        this.setState({ clearLoading: false, allowClear: true });
    }
  };

  // Export and Clear Call Logs
  handleClearCall = async () => {
    this.setState({ clearLoading: true, allowClear: false });
    var { data } = this.state;
    try {
      const result = await configService.clearCalls(data.startDateCall, data.endDateCall);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 2000);
    } catch (ex) {
      if(ex === "missingDates") {
        toast.error("Please enter a start and end date");
      } else if(ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ clearLoading: false, allowClear: true });
    }
  }

  // Export and Clear User
  handleClearUser = async () => {
    this.setState({ clearLoading: true, allowClear: false });
    var { data } = this.state;
    try {
      // -------------------------------------------------------------------
      var file = await configService.deleteUser(data.selectedUser);
      // -------------------------------------------------------------------
      const blob = new Blob([file.data], {type:'text/csv'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden','');
      a.setAttribute('href', url);
      a.setAttribute('download', 'usersBookingsExport.csv');
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch (ex) {
      if (ex === "deleteAdmin") {
        toast.info("Admin deleted");
      } if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    } finally {
      this.setState({ clearLoading: false, allowClear: true });
    }
  }

  toggleWeek = () => {
    const { modalWeek } = this.state;
    if (modalWeek) {
      this.setState({
        modalWeek: false
      });
    } else {
      this.setState({
        modalWeek: true
      });
    }
  };

  toggleLibrary = () => {
    const { modalLibrary } = this.state;
    if (modalLibrary) {
      this.setState({
        modalLibrary: false
      });
    } else {
      this.setState({
        modalLibrary: true
      });
    }
  };

  toggleCall = () => {
    const { modalCall } = this.state;
    if (modalCall) {
      this.setState({
        modalCall: false
      });
    } else {
      this.setState({
        modalCall: true
      });
    }
  };

  toggleUser = () => {
    const { modalUser } = this.state;
    if (modalUser) {
      this.setState({
        modalUser: false
      });
    } else {
      this.setState({
        modalUser: true
      });
    }
  };

  handleChange = ({ currentTarget: input }) => {
    let {data} = this.state;
    data[input.name] = input.value;
    this.setState({ data });
  }

  handleUserChange = e => {
    let { data } = this.state;
    data[e.target.id] = e.target.value;
    this.setState({ data });
  }

  render() {
    var { clearLoading, allowClear, allUsers } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 4, offset: 2 }}>
              <Button style={{ width: "100%", marginTop: "20px"}} color="primary" onClick={this.toggleWeek}>
                Clear Weeks Schedule
              </Button>
            </Col>
            <Col xs="12" sm="12" md={{ size: 4 }}>
              <Button style={{ width: "100%", marginTop: "20px"}} color="primary" onClick={this.toggleLibrary}>
                Clear Library Duties
              </Button>
            </Col>
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 4, offset: 2}}>
              <Button style={{ width: "100%", marginTop: "20px"}} color="primary" onClick={this.toggleCall}>
                Clear Call Logs
              </Button>
            </Col>
            <Col xs="12" sm="12" md={{ size: 4 }}>
              <Button style={{ width: "100%", marginTop: "20px"}} color="primary" onClick={this.toggleUser}>
                Delete User
              </Button>
            </Col>
          </Row>
          {/*-----------------------------------*/}
          {/*Modal for clearing and export weeks*/}
          <Modal isOpen={this.state.modalWeek} toggle={this.toggleWeek} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleWeek}>Clear & Export Week's Shift Bookings</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label className="mb-0" for="startDateWeek">Start Date:</Label>
                  <Input type="date" name="startDateWeek" id="startDateWeek" onChange={this.handleChange}/>
                </FormGroup>
                <FormGroup>
                  <Label className="mb-0" for="endDateWeek">End Date:</Label>
                  <Input type="date" name="endDateWeek" id="endDateWeek" onChange={this.handleChange}/>
                </FormGroup>
              </Form>
              <br />
              <b style={{ color: "red" }}>*Warning* All subsequent shift bookings, adhoc duties created within weeks schedule's date range will be deleted.</b>
              <br />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onClick={this.handleClearWeeks} disabled={!allowClear}>
                {
                  clearLoading ?
                    <div>
                      <CircularProgress size= {20} />{" "}
                      Exporting..
                    </div>
                  :
                    "Clear & Export"
                }
              </Button>{' '}
            </ModalFooter>
          </Modal>
          {/*--------------------------------------------*/}
          {/*Modal for clearing and export library duties*/}
          <Modal isOpen={this.state.modalLibrary} toggle={this.toggleLibrary} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleLibrary}>Clear & Export Library Duties</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label className="mb-0" for="startDateLibrary">Start Date:</Label>
                  <Input type="date" name="startDateLibrary" id="startDateLibrary" onChange={this.handleChange}/>
                </FormGroup>
                <FormGroup>
                  <Label className="mb-0" for="endDateLibrary">End Date:</Label>
                  <Input type="date" name="endDateLibrary" id="endDateLibrary" onChange={this.handleChange}/>
                </FormGroup>
              </Form>
              <br />
              <b style={{ color: "red" }}>*Warning* All subsequent user's appointments created within libary duties' date range will be deleted.</b>
              <br />
            </ModalBody>
            <ModalFooter>
            <Button color="danger" onClick={this.handleClearLibrary} disabled={!allowClear}>
              {
                clearLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Exporting..
                  </div>
                :
                  "Clear & Export"
              }
            </Button>{' '}
            </ModalFooter>
          </Modal>
          {/*------------------------------------------*/}
          {/*Modal for clearing call logs*/}
          <Modal isOpen={this.state.modalCall} toggle={this.toggleCall} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleCall}>Clear Call Logs</ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label className="mb-0" for="startDateCall">Start Date:</Label>
                  <Input type="date" name="startDateCall" id="startDateCall" onChange={this.handleChange}/>
                </FormGroup>
                <FormGroup>
                  <Label className="mb-0" for="endDateCall">End Date:</Label>
                  <Input type="date" name="endDateCall" id="endDateCall" onChange={this.handleChange}/>
                </FormGroup>
              </Form>
            </ModalBody>
            <ModalFooter>
            <Button color="danger" onClick={this.handleClearCall} disabled={!allowClear}>
              {
                clearLoading ?
                  <div>
                    <CircularProgress size= {20} />{" "}
                    Clearing..
                  </div>
                :
                  "Clear"
              }
            </Button>{' '}
            </ModalFooter>
          </Modal>
          {/*-----------------------------------*/}
          {/*Modal for clearing and export users*/}
          <Modal isOpen={this.state.modalUser} toggle={this.toggleUser} className={this.props.className} centered zIndex="1300" size="md"
            style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}}
          >
            <ModalHeader toggle={this.toggleUser}>Delete & Export User's Shift Bookings: </ModalHeader>
            <ModalBody>
              <Form>
                <FormGroup>
                  <Label className="mb-0">Users:</Label>
                  <Input
                    type="select"
                    id="selectedUser"
                    onChange={this.handleUserChange}
                  >
                    <option value="" hidden>
                      Select...
                    </option>
                    {
                      allUsers.length > 0 ?
                        allUsers.map((user) => (
                          <option key={user._id} id={user._id} value={user._id}>
                            {user.name}
                          </option>
                        ))
                      :
                      <option disabled>{"There are no users in the database"}</option>
                    }
                  </Input>
                </FormGroup>
              </Form>
              <br />
              <b style={{ color: "red" }}>*Warning* If selected user is a student, all subsequent shift bookings, adhoc duties, and library duty appointments created will be deleted.</b>
              <br />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" onClick={this.handleClearUser} disabled={!allowClear}>
                {
                  clearLoading ?
                    <div>
                      <CircularProgress size= {20} />{" "}
                      Exporting..
                    </div>
                  :
                    "Delete & Export"
                }
              </Button>{' '}
            </ModalFooter>
          </Modal>

        </div>
      </React.Fragment>
    );
  }
}

export default ClearDatabaseContent;

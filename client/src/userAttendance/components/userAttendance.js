/*
Originator: Brandon
Date: 03 Mar 2019
Component to render qr scanner for attendance clocking
*/
// Import external resources
import React, { Component } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, Button } from "reactstrap";
import QrReader from 'react-qr-reader';
import { toast } from "react-toastify";
import moment from "moment";
import { GoogleApiWrapper } from 'google-maps-react';

// import services
import attendance from '../../services/attendanceService';

class UserAttendance extends Component {
  state = {
    data: {
      lat: "",
      lng: ""
    },
    qr: "",
    modalIn: false,
    modalOut: false,
    modalInvalid: false
  }

  componentDidMount() {
    if (navigator && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = pos.coords;
        this.setState({
            data: {
                lat: coords.latitude,
                lng: coords.longitude
            }
        })
      })
    }
  }

  handleScan = async data => {
    const { qr } = this.state;
    if (data === "attendance") {
      if (qr === "in") {
        this.toggleInModal();
        this.setState({
          qr: ""
        });
      } else if (qr === "out") {
        this.toggleOutModal();
        this.setState({
          qr: ""
        });
      }
    } else if (data !== null && data !== "attendance") {
      this.toggleInvalidModal();
      this.setState({
        qr: ""
      });
    }
  }

  handleError = err => {
    console.error(err)
  }

  toggleQRIn = () => {
    const { qr } = this.state;
    if(qr) {
      this.setState({
        qr: ""
      });
    } else {
      this.setState({
        qr: "in"
      });
    }
  }

  toggleQROut = () => {
    const { qr } = this.state;
    if(qr) {
      this.setState({
        qr: ""
      });
    } else {
      this.setState({
        qr: "out"
      });
    }
  }

  toggleInModal = () => {
    const { modalIn } = this.state;

    if(modalIn) {
      this.setState({
        modalIn: false
      });
    } else {
      this.setState({
        modalIn: true
      });
    }
  }

  toggleOutModal = () => {
    const { modalOut } = this.state;
    if(modalOut) {
      this.setState({
        modalOut: false
      });
    } else {
      this.setState({
        modalOut: true
      });
    }
  }

  toggleInvalidModal = () => {
    const { modalInvalid } = this.state;
    if(modalInvalid) {
      this.setState({
        modalInvalid: false
      });
    } else {
      this.setState({
        modalInvalid: true
      });
    }
  }

  clockInAttendance = async e => {
    var { data } = this.state;
    try {
      const result = await attendance.clockIn(data);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }

  clockOutAttendance = async e => {
    var { data } = this.state;
    try {
      const result = await attendance.clockOut(data);
      toast.info(result);
      setTimeout(function() {
        document.location.reload(true);
      }, 1500);
    } catch(ex) {
      if (ex.response && ex.response.status >= 400) {
        const errors = { ...this.state.errors };
        this.setState({ errors });
        toast.error(ex.response.data);
      }
    }
  }


  render() {
    const { qr } = this.state;
    return (
      <React.Fragment>
        <div>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              <h2 style={{ marginBottom: "30px" }}>Log Attendance</h2>
            </Col>
          </Row>
          <Row style={{marginBottom:"30px"}}>
            {
              qr === "in" ?
                <Col xs="12" sm="12" md={{ size: 5, offset: 1 }} style={{ marginBottom: "30px" }}>
                  <Button color="danger" onClick={() => {this.toggleQRIn()}} block>Cancel</Button>
                </Col>
              :
                <Col xs="12" sm="12" md={{ size: 5, offset: 1 }} style={{ marginBottom: "30px" }}>
                  <Button color="info" onClick={() => {this.toggleQRIn()}} block>Clock In</Button>
                </Col>
            }
            {
              qr === "out" ?
                <Col xs="12" sm="12" md={{ size: 5 }}>
                  <Button color="danger" onClick={() => {this.toggleQROut()}} block>Cancel</Button>
                </Col>
              :
                <Col xs="12" sm="12" md={{ size: 5 }}>
                  <Button color="warning" onClick={() => {this.toggleQROut()}} block>Clock Out</Button>
                </Col>
            }
          </Row>
          <Row>
            <Col xs="12" sm="12" md={{ size: 10, offset: 1 }}>
              {qr ?
                <QrReader
                  delay={1000}
                  onError={this.handleError}
                  onScan={this.handleScan}
                  style={{ height: "100%", width: '100%' }}
                />
              :
                ""
              }
            </Col>
          </Row>

          {/* Modal upon clock in*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalIn} toggle={this.toggleInModal} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleInModal}>Time In</ModalHeader>
            <ModalBody>
              Confirm attendance? <br/><br/>
              Time: {moment().format("h:mm a")}
            </ModalBody>
            <ModalFooter>
              <Button color="info" onClick={this.clockInAttendance}>
                Confirm
              </Button>{' '}
            </ModalFooter>
          </Modal>

          {/* Modal upon clock out*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalOut} toggle={this.toggleOutModal} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleOutModal}>Time Out</ModalHeader>
            <ModalBody>
              Clock out? <br/><br/>
              Time: {moment().format("h:mm a")}
            </ModalBody>
            <ModalFooter>
              <Button color="info" onClick={this.clockOutAttendance}>
                Confirm
              </Button>{' '}
            </ModalFooter>
          </Modal>

          {/* Modal upon invalid QR*/}
          <Modal style={{fontFamily: "Lucida Sans Unicode, Lucida Grande, sans-serif"}} isOpen={this.state.modalInvalid} toggle={this.toggleInvalidModal} className={this.props.className} centered zIndex="1300" size="md">
            <ModalHeader toggle={this.toggleInvalidModal}>Invalid QR Code</ModalHeader>
            <ModalBody>Please scan the correct QR Code for attendance clocking</ModalBody>
            <ModalFooter>
              <Button color="danger" onClick={this.toggleInvalidModal}>
                OK
              </Button>{' '}
            </ModalFooter>
          </Modal>
        </div>
      </React.Fragment>
    )
  }
}
export default GoogleApiWrapper({
  apiKey: ('AIzaSyC51-T7AsOcjrAGyoSrUmPoaC5wUuR6pXE')
})(UserAttendance)
